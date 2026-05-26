import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '../config.js';

export const queueConnection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

export const slaQueue = new Queue('orders-sla', { connection: queueConnection });
export const orderEventsQueue = new Queue('order-events', { connection: queueConnection });

export type SlaJobData = {
  orderId: string;
  reservationId: string;
  propertyId: string;
  kind: 'warning' | 'breach';
};

export type OrderEvent =
  | { type: 'order.created'; orderId: string; reservationId: string; propertyId: string }
  | {
      type: 'order.completed';
      orderId: string;
      reservationId: string;
      guestId: string;
      propertyId: string;
      totalAmount: number;
      orderType: string;
    };

export async function scheduleSlaWarning(
  data: Omit<SlaJobData, 'kind'>,
  delayMs: number,
): Promise<void> {
  if (delayMs <= 0) return;
  await slaQueue.add(
    'warning',
    { ...data, kind: 'warning' as const },
    { delay: delayMs, removeOnComplete: 50, removeOnFail: 50, jobId: `warn-${data.orderId}` },
  );
}

export async function scheduleSlaBreach(
  data: Omit<SlaJobData, 'kind'>,
  delayMs: number,
): Promise<void> {
  if (delayMs <= 0) return;
  await slaQueue.add(
    'breach',
    { ...data, kind: 'breach' as const },
    { delay: delayMs, removeOnComplete: 50, removeOnFail: 50, jobId: `breach-${data.orderId}` },
  );
}

export async function emitOrderEvent(event: OrderEvent): Promise<void> {
  await orderEventsQueue.add(event.type, event, {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  });
}
