import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { prisma } from '../lib/prisma.js';
import { config, hasRazorpay } from '../config.js';
import { createPaymentOrder, verifyPaymentSignature } from '../lib/razorpay.js';
import { emitBookingCheckedOut, enqueueInvoiceDelivery } from '../lib/queue.js';
import { num } from '../lib/folio.js';
import { renderAndUploadInvoice } from '../services/invoice.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const errBody = (code: string, message: string, extra: Record<string, unknown> = {}) => ({
  error: { code, message, ...extra },
});

const CreateOrderSchema = z.object({
  reservation_id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
});

const VerifySchema = z.object({
  reservation_id: z.string().uuid(),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function paymentRoutes(app: FastifyInstance): Promise<void> {
  // ─── POST /create-order ─────────────────────────────────────────
  app.post('/create-order', { preHandler: requireAuth }, async (request, reply) => {
    if (!hasRazorpay) {
      return reply
        .status(503)
        .send(errBody('PROVIDER_UNAVAILABLE', 'Razorpay is not configured on this environment'));
    }
    const parsed = CreateOrderSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send(errBody('VALIDATION_ERROR', 'Invalid body', { details: parsed.error.issues }));
    }
    const user = request.user!;
    const reservation = await prisma.reservation.findUnique({
      where: { id: parsed.data.reservation_id },
      include: { guest: { select: { phone: true } } },
    });
    if (!reservation) return reply.status(404).send(errBody('RESERVATION_NOT_FOUND', 'Not found'));
    if (user.userType === 'guest' && reservation.guestId !== user.userId) {
      return reply.status(403).send(errBody('FORBIDDEN', 'Not your reservation'));
    }

    try {
      const order = await createPaymentOrder({
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        reservationId: reservation.id,
        guestPhone: reservation.guest.phone,
      });
      return reply.send({
        razorpay_order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: config.razorpay.keyId,
        reservation_id: reservation.id,
      });
    } catch (err) {
      request.log.error({ err }, 'Razorpay create-order failed');
      return reply
        .status(502)
        .send(errBody('RAZORPAY_ERROR', (err as Error).message ?? 'Provider error'));
    }
  });

  // ─── POST /verify ───────────────────────────────────────────────
  app.post('/verify', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = VerifySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send(errBody('VALIDATION_ERROR', 'Invalid body', { details: parsed.error.issues }));
    }
    const ok = verifyPaymentSignature({
      orderId: parsed.data.razorpay_order_id,
      paymentId: parsed.data.razorpay_payment_id,
      signature: parsed.data.razorpay_signature,
    });
    if (!ok) {
      return reply.status(400).send(errBody('PAYMENT_FAILED', 'Signature verification failed'));
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: parsed.data.reservation_id },
    });
    if (!reservation) return reply.status(404).send(errBody('RESERVATION_NOT_FOUND', 'Not found'));

    // Mark the reservation as paid in full. payments-service is the single
    // writer of paidAmount on success, which keeps booking-service's
    // checkout step free of provider verification (see T-04 TODO).
    const totalAmount = num(reservation.totalAmount);
    const updated = await prisma.reservation.update({
      where: { id: reservation.id },
      data: { paidAmount: new Prisma.Decimal(totalAmount) },
    });

    // When the full amount is paid we drive the booking lifecycle forward
    // by emitting booking.checked_out — access-service revokes the key,
    // loyalty-service credits points, and this service generates the invoice.
    if (num(updated.paidAmount) >= totalAmount && updated.status !== 'checked_out') {
      await emitBookingCheckedOut({
        reservationId: updated.id,
        guestId: updated.guestId,
        propertyId: updated.propertyId,
        totalAmount,
      });
    }

    return reply.send({
      success: true,
      payment_id: parsed.data.razorpay_payment_id,
      amount_paid: totalAmount,
      reservation_id: updated.id,
    });
  });

  // ─── GET /invoice/:reservationId ────────────────────────────────
  app.get<{ Params: { reservationId: string }; Querystring: { download?: string } }>(
    '/invoice/:reservationId',
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = request.user!;
      const reservation = await prisma.reservation.findUnique({
        where: { id: request.params.reservationId },
        select: { id: true, guestId: true, propertyId: true },
      });
      if (!reservation) return reply.status(404).send(errBody('NOT_FOUND', 'Reservation not found'));
      if (user.userType === 'guest' && reservation.guestId !== user.userId) {
        return reply.status(403).send(errBody('FORBIDDEN', 'Not your reservation'));
      }

      try {
        const result = await renderAndUploadInvoice(prisma, reservation.id);
        if (!result) return reply.status(404).send(errBody('NOT_FOUND', 'Reservation not found'));

        // When the client asks for `?download=1` we stream the PDF directly
        // instead of returning the S3 URL — useful for tests and for staff
        // tools that don't have S3 read access.
        if (request.query.download === '1') {
          reply.header('Content-Type', 'application/pdf');
          reply.header(
            'Content-Disposition',
            `attachment; filename="${result.data.invoiceNumber}.pdf"`,
          );
          return reply.send(result.pdf);
        }

        // Queue email delivery — useful when the staff manually re-renders
        // an invoice for a checked-out guest who never received it.
        await enqueueInvoiceDelivery(reservation.id);

        return reply.send({
          invoice_url: result.upload.url,
          invoice_number: result.data.invoiceNumber,
          generated_at: result.data.generatedAt,
          total_amount: result.data.totalAmount,
          paid_amount: result.data.paidAmount,
          balance_due: result.data.balanceDue,
        });
      } catch (err) {
        request.log.error({ err }, 'Invoice generation failed');
        return reply
          .status(500)
          .send(errBody('INVOICE_FAILED', (err as Error).message ?? 'Could not generate invoice'));
      }
    },
  );
}
