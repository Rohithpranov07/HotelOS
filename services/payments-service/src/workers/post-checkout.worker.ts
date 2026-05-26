import { Worker, type Job } from 'bullmq';
import { Redis } from 'ioredis';

import { config } from '../config.js';
import { prisma } from '../lib/prisma.js';
import { renderAndUploadInvoice } from '../services/invoice.service.js';
import { sendInvoiceEmail } from '../lib/email.js';
import { enqueueInvoiceDelivery } from '../lib/queue.js';

const connection = new Redis(config.redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });

export interface BookingEventJobData {
  reservationId: string;
  guestId?: string;
  propertyId?: string;
  totalAmount?: number;
}

async function deliverInvoice(reservationId: string): Promise<{
  sent: boolean;
  invoiceUrl: string;
  invoiceNumber: string;
}> {
  const result = await renderAndUploadInvoice(prisma, reservationId);
  if (!result) throw new Error(`Reservation ${reservationId} not found`);

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { guest: true },
  });
  if (!reservation) throw new Error(`Reservation ${reservationId} disappeared mid-job`);

  let sent = false;
  if (reservation.guest.email) {
    const pointsEarned = Math.floor(Number(reservation.totalAmount) / 100);
    const r = await sendInvoiceEmail({
      toEmail: reservation.guest.email,
      toName: reservation.guest.fullName,
      hotelName: config.hotel.name,
      pdf: result.pdf,
      invoiceNumber: result.data.invoiceNumber,
      loyaltyPointsEarned: pointsEarned,
      loyaltyBalance: reservation.guest.loyaltyPoints,
      loyaltyTier: reservation.guest.loyaltyTier,
    });
    sent = r.sent;
  }
  return { sent, invoiceUrl: result.upload.url, invoiceNumber: result.data.invoiceNumber };
}

/**
 * Consumes booking.checked_out and enqueues the invoice-delivery job. We
 * split the work into two queues so a slow PDF/email step can't block the
 * shared booking-events queue that access-service and loyalty-service
 * also consume.
 */
export function startBookingEventsWorker(): Worker<BookingEventJobData> {
  return new Worker<BookingEventJobData>(
    'booking-events',
    async (job: Job<BookingEventJobData>) => {
      if (job.name !== 'booking.checked_out') return { ignored: job.name };
      await enqueueInvoiceDelivery(job.data.reservationId);
      return { enqueued: job.data.reservationId };
    },
    { connection, concurrency: 4 },
  );
}

export function startInvoiceDeliveryWorker(): Worker<{ reservationId: string }> {
  return new Worker<{ reservationId: string }>(
    'invoice-delivery',
    async (job) => deliverInvoice(job.data.reservationId),
    { connection, concurrency: 2 },
  );
}
