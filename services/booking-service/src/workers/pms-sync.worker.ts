import { Worker, Queue, type Job } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '../config.js';
import { fetchUpcomingArrivals } from '../lib/cloudbeds.js';
import { processCloudbedsEvent } from '../routes/webhook.routes.js';

const connection = new Redis(config.redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });

export const pmsSyncQueue = new Queue('pms-sync', { connection });

const JOB_NAME = 'sync-arrivals';

export async function schedulePmsSync(): Promise<void> {
  if (!config.pmsSync.enabled) return;
  // Repeatable job, idempotent on jobId.
  await pmsSyncQueue.add(
    JOB_NAME,
    {},
    {
      repeat: { every: config.pmsSync.intervalMs },
      removeOnComplete: 20,
      removeOnFail: 20,
      jobId: 'pms-sync-recurring',
    },
  );
}

export function startPmsSyncWorker(propertyId: string): Worker {
  return new Worker(
    'pms-sync',
    async (job: Job) => {
      const today = new Date().toISOString().slice(0, 10);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const arrivals = await fetchUpcomingArrivals(today, tomorrow);
      let synced = 0;
      for (const a of arrivals) {
        try {
          await processCloudbedsEvent(
            {
              event: 'reservation_modified',
              data: {
                reservationID: a.reservationID,
                guestID: a.guestID,
                status: a.status,
                checkIn: a.checkIn,
                checkOut: a.checkOut,
                roomID: a.roomID,
                adults: a.adults,
                children: a.children,
                total: a.total,
              },
            },
            propertyId,
          );
          synced++;
        } catch (err) {
          job.log(`Failed to sync ${a.reservationID}: ${(err as Error).message}`);
        }
      }
      return { synced, total: arrivals.length };
    },
    { connection },
  );
}
