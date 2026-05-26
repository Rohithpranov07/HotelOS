import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '../config.js';

export const queueConnection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

export const bookingEventsQueue = new Queue('booking-events', {
  connection: queueConnection,
});

export type BookingEvent =
  | {
      type: 'booking.confirmed';
      reservationId: string;
      guestId: string;
      propertyId: string;
    }
  | {
      type: 'booking.pre_checked_in';
      reservationId: string;
      guestId: string;
      propertyId: string;
    }
  | {
      type: 'booking.checked_in';
      reservationId: string;
      guestId: string;
      propertyId: string;
      roomId: string | null;
      mobileKeyNeeded: boolean;
    }
  | {
      type: 'booking.checked_out';
      reservationId: string;
      guestId: string;
      propertyId: string;
      totalAmount: number;
    };

export async function emitBookingEvent(event: BookingEvent): Promise<void> {
  await bookingEventsQueue.add(event.type, event, {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  });
}
