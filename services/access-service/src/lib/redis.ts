import { Redis } from 'ioredis';
import { config } from '../config.js';

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

let connected = false;
export async function ensureRedis(): Promise<void> {
  if (connected) return;
  if (redis.status === 'ready') {
    connected = true;
    return;
  }
  await redis.connect().catch((err: Error) => {
    if (err.message?.includes('already connecting')) return;
    throw err;
  });
  connected = true;
}

export const KEY_PREFIX = 'key:';

export type CachedKey = {
  status: 'active';
  keyToken: string;
  roomNumber: string;
  lockDeviceId: string;
  lockType: 'mock' | 'assa_abloy' | 'salto';
  validFrom: string;
  validUntil: string;
  providerKeyId: string;
};

export async function cacheKey(
  reservationId: string,
  value: CachedKey,
  ttlSeconds: number,
): Promise<void> {
  await ensureRedis();
  const safeTtl = Math.max(1, Math.floor(ttlSeconds));
  await redis.set(KEY_PREFIX + reservationId, JSON.stringify(value), 'EX', safeTtl);
}

export async function getCachedKey(reservationId: string): Promise<CachedKey | null> {
  await ensureRedis();
  const raw = await redis.get(KEY_PREFIX + reservationId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedKey;
  } catch {
    return null;
  }
}

export async function deleteCachedKey(reservationId: string): Promise<void> {
  await ensureRedis();
  await redis.del(KEY_PREFIX + reservationId);
}
