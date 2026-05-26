import { Worker, type Job } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '../config.js';
import { prisma } from '../lib/prisma.js';
import type { SlaJobData } from '../lib/queue.js';
import { emitSlaWarning, emitSlaBreach, type AppIO } from '../lib/socket.js';

const connection = new Redis(config.redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });

export function startSlaWorker(io: AppIO): Worker<SlaJobData> {
  return new Worker<SlaJobData>(
    'orders-sla',
    async (job: Job<SlaJobData>) => {
      const { orderId, propertyId, kind } = job.data;
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return { skipped: 'order_missing' };
      if (order.status === 'completed' || order.status === 'cancelled') {
        return { skipped: 'order_terminal' };
      }

      const payload = {
        orderId: order.id,
        reservationId: order.reservationId,
        type: order.type,
        status: order.status,
        slaDeadline: order.slaDeadline?.toISOString() ?? null,
      };

      if (kind === 'warning') {
        emitSlaWarning(io, propertyId, payload);
      } else {
        // TODO(notifications-service): on breach, also FCM-push the property manager.
        emitSlaBreach(io, propertyId, payload);
      }
      return { kind, orderId };
    },
    { connection },
  );
}
