import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '../config.js';

export const queueConnection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

export const bookingEventsQueue = new Queue('booking-events', { connection: queueConnection });
export const invoiceQueue = new Queue('invoice-delivery', { connection: queueConnection });

export type InvoiceJob = {
  reservationId: string;
};

export async function enqueueInvoiceDelivery(reservationId: string): Promise<void> {
  await invoiceQueue.add(
    'generate-and-send',
    { reservationId },
    {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      jobId: `invoice-${reservationId}`,
    },
  );
}

export async function emitBookingCheckedOut(payload: {
  reservationId: string;
  guestId: string;
  propertyId: string;
  totalAmount: number;
}): Promise<void> {
  await bookingEventsQueue.add('booking.checked_out', payload, {
    removeOnComplete: 100,
    removeOnFail: 50,
  });
}
