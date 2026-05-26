import { Worker, type Job } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '../config.js';
import { prisma } from '../lib/prisma.js';
import { getKeyProvider } from '../providers/index.js';
import { KeyService } from '../services/key.service.js';

const connection = new Redis(config.redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });

export interface BookingEventJobData {
  type: string;
  reservationId: string;
  guestId?: string;
  propertyId?: string;
  roomId?: string | null;
  mobileKeyNeeded?: boolean;
  totalAmount?: number;
}

export function startBookingEventsWorker(): Worker<BookingEventJobData> {
  const service = new KeyService(prisma, getKeyProvider());
  return new Worker<BookingEventJobData>(
    'booking-events',
    async (job: Job<BookingEventJobData>) => {
      switch (job.name) {
        case 'booking.checked_in': {
          if (job.data.mobileKeyNeeded === false) return { skipped: 'no_key_needed' };
          await service.provisionKeyForReservation(job.data.reservationId);
          return { provisioned: job.data.reservationId };
        }
        case 'booking.checked_out': {
          await service.revokeKey(job.data.reservationId);
          return { revoked: job.data.reservationId };
        }
        default:
          return { ignored: job.name };
      }
    },
    {
      connection,
      // Booking events drive room access — we want them retried persistently
      // when the lock vendor is briefly unavailable.
      autorun: true,
      concurrency: 4,
    },
  );
}
