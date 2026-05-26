import type { FastifyInstance } from 'fastify';
import { Prisma, type ReservationStatus } from '@prisma/client';

import { prisma } from '../lib/prisma.js';
import { emitBookingEvent } from '../lib/queue.js';
import {
  CloudbedsWebhookSchema,
  verifyWebhookSignature,
  type CloudbedsWebhookPayload,
} from '../lib/cloudbeds.js';

const errBody = (code: string, message: string) => ({ error: { code, message } });

function mapEventToStatus(event: string): ReservationStatus | null {
  switch (event) {
    case 'new_reservation':
    case 'reservation_created':
      return 'confirmed';
    case 'check_in':
      return 'checked_in';
    case 'check_out':
      return 'checked_out';
    case 'cancellation':
    case 'reservation_cancelled':
      return 'cancelled';
    case 'no_show':
      return 'no_show';
    case 'modification':
    case 'reservation_modified':
      return null; // no status change, just update fields
    default:
      return null;
  }
}

export async function processCloudbedsEvent(
  payload: CloudbedsWebhookPayload,
  propertyId: string,
): Promise<{ reservationId: string; status: ReservationStatus } | null> {
  const { event, data } = payload;
  const status = mapEventToStatus(event);

  // Ensure guest exists (placeholder if needed).
  let guestId = data.guestID
    ? await prisma.guest
        .findFirst({ where: { phone: data.guestID, propertyId } })
        .then((g) => g?.id ?? null)
    : null;

  if (!guestId) {
    const placeholder = await prisma.guest.upsert({
      where: { phone: `cloudbeds:${data.reservationID}` },
      update: {},
      create: {
        phone: `cloudbeds:${data.reservationID}`,
        fullName:
          [data.guestFirstName, data.guestLastName].filter(Boolean).join(' ') || 'Cloudbeds Guest',
        propertyId,
      },
    });
    guestId = placeholder.id;
  }

  const baseFields = {
    guestId,
    propertyId,
    checkInDate: data.checkIn ? new Date(data.checkIn) : undefined,
    checkOutDate: data.checkOut ? new Date(data.checkOut) : undefined,
    adults: data.adults ?? undefined,
    children: data.children ?? undefined,
    totalAmount: data.total !== undefined ? new Prisma.Decimal(data.total) : undefined,
  };

  const existing = await prisma.reservation.findUnique({
    where: { pmsBookingRef: data.reservationID },
  });

  let reservationId: string;
  let finalStatus: ReservationStatus;

  if (existing) {
    const updateData: Prisma.ReservationUpdateInput = {};
    if (baseFields.checkInDate) updateData.checkInDate = baseFields.checkInDate;
    if (baseFields.checkOutDate) updateData.checkOutDate = baseFields.checkOutDate;
    if (baseFields.adults !== undefined) updateData.adults = baseFields.adults;
    if (baseFields.children !== undefined) updateData.children = baseFields.children;
    if (baseFields.totalAmount !== undefined) updateData.totalAmount = baseFields.totalAmount;
    if (status) {
      updateData.status = status;
      if (status === 'checked_in') updateData.actualCheckIn = new Date();
      if (status === 'checked_out') updateData.actualCheckOut = new Date();
    }
    const updated = await prisma.reservation.update({
      where: { id: existing.id },
      data: updateData,
    });
    reservationId = updated.id;
    finalStatus = updated.status;
  } else {
    if (!baseFields.checkInDate || !baseFields.checkOutDate || baseFields.adults === undefined) {
      throw new Error('Cannot create reservation without checkIn/checkOut/adults');
    }
    const created = await prisma.reservation.create({
      data: {
        guestId,
        propertyId,
        pmsBookingRef: data.reservationID,
        status: status ?? 'confirmed',
        checkInDate: baseFields.checkInDate,
        checkOutDate: baseFields.checkOutDate,
        adults: baseFields.adults,
        children: baseFields.children ?? 0,
        totalAmount: baseFields.totalAmount ?? new Prisma.Decimal(0),
        source: 'cloudbeds',
      },
    });
    reservationId = created.id;
    finalStatus = created.status;
  }

  // Emit downstream events.
  switch (finalStatus) {
    case 'confirmed':
      if (!existing) {
        await emitBookingEvent({
          type: 'booking.confirmed',
          reservationId,
          guestId,
          propertyId,
        });
      }
      break;
    case 'checked_in':
      await emitBookingEvent({
        type: 'booking.checked_in',
        reservationId,
        guestId,
        propertyId,
        roomId: null,
        mobileKeyNeeded: false,
      });
      break;
    case 'checked_out':
      await emitBookingEvent({
        type: 'booking.checked_out',
        reservationId,
        guestId,
        propertyId,
        totalAmount: baseFields.totalAmount ? Number(baseFields.totalAmount.toString()) : 0,
      });
      break;
    default:
      break;
  }

  return { reservationId, status: finalStatus };
}

export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  // Capture the raw body for HMAC verification.
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (request, body: string, done) => {
      request.rawBody = body;
      try {
        done(null, body.length === 0 ? {} : JSON.parse(body));
      } catch (err) {
        done(err as Error);
      }
    },
  );

  app.post('/cloudbeds', async (request, reply) => {
    const signature = request.headers['x-cloudbeds-signature'] as string | undefined;
    const raw = request.rawBody ?? '';
    if (!verifyWebhookSignature(raw, signature)) {
      return reply.status(401).send(errBody('INVALID_SIGNATURE', 'Webhook signature invalid'));
    }

    const parsed = CloudbedsWebhookSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid webhook payload',
            details: parsed.error.issues,
          },
        });
    }

    // Property mapping: in this scaffold we require a header indicating the
    // target propertyId. T-08 will replace this with per-tenant credential lookup.
    const propertyId =
      (request.headers['x-property-id'] as string | undefined) ??
      process.env.CLOUDBEDS_DEFAULT_PROPERTY_ID;
    if (!propertyId) {
      return reply.status(400).send(errBody('PROPERTY_REQUIRED', 'x-property-id header missing'));
    }

    try {
      const result = await processCloudbedsEvent(parsed.data, propertyId);
      return reply.send({ success: true, ...result });
    } catch (err) {
      request.log.error({ err, event: parsed.data.event }, 'Cloudbeds webhook processing failed');
      return reply.status(500).send(errBody('WEBHOOK_PROCESSING_FAILED', 'Could not process event'));
    }
  });
}
