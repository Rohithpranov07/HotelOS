import { Redis } from 'ioredis';
import { config } from '../config.js';

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Lazy-connect: explicit connect on first use, retry on failure.
let connected = false;
export async function ensureRedis(): Promise<void> {
  if (connected) return;
  if (redis.status === 'ready') {
    connected = true;
    return;
  }
  await redis.connect().catch((err) => {
    if (err.message?.includes('already connecting')) return;
    throw err;
  });
  connected = true;
}

const OTP_PREFIX = 'otp:';
const OTP_RATE_PREFIX = 'rate:otp:';
const REFRESH_PREFIX = 'refresh:';

interface OtpRecord {
  code: string;
  attempts: number;
}

export async function storeOtp(phone: string, code: string): Promise<void> {
  await ensureRedis();
  const key = OTP_PREFIX + phone;
  const record: OtpRecord = { code, attempts: 0 };
  await redis.set(key, JSON.stringify(record), 'EX', config.otp.ttlSeconds);
}

export type OtpVerifyResult =
  | { kind: 'ok' }
  | { kind: 'invalid'; attemptsRemaining: number }
  | { kind: 'locked' }
  | { kind: 'expired' };

export async function verifyOtp(phone: string, inputCode: string): Promise<OtpVerifyResult> {
  await ensureRedis();
  const key = OTP_PREFIX + phone;
  const raw = await redis.get(key);
  if (!raw) return { kind: 'expired' };

  const data = JSON.parse(raw) as OtpRecord;

  if (data.attempts >= config.otp.maxAttempts) {
    return { kind: 'locked' };
  }

  if (data.code !== inputCode) {
    const next: OtpRecord = { code: data.code, attempts: data.attempts + 1 };
    const ttl = await redis.ttl(key);
    await redis.set(key, JSON.stringify(next), 'EX', Math.max(ttl, 1));
    return {
      kind: 'invalid',
      attemptsRemaining: Math.max(config.otp.maxAttempts - next.attempts, 0),
    };
  }

  await redis.del(key);
  return { kind: 'ok' };
}

/** Returns true if request is allowed; false if rate-limited. */
export async function checkOtpRateLimit(phone: string): Promise<{ allowed: boolean; retryAfter: number }> {
  await ensureRedis();
  const key = OTP_RATE_PREFIX + phone;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, config.otp.rateWindowSeconds);
  }
  if (count > config.otp.rateLimit) {
    const retryAfter = await redis.ttl(key);
    return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
  }
  return { allowed: true, retryAfter: 0 };
}

export interface RefreshTokenPayload {
  userId: string;
  userType: 'guest' | 'staff';
  role?: string;
  propertyId?: string;
}

export async function storeRefreshToken(
  jti: string,
  payload: RefreshTokenPayload,
  ttlSeconds: number,
): Promise<void> {
  await ensureRedis();
  await redis.set(REFRESH_PREFIX + jti, JSON.stringify(payload), 'EX', ttlSeconds);
}

export async function getRefreshToken(jti: string): Promise<RefreshTokenPayload | null> {
  await ensureRedis();
  const raw = await redis.get(REFRESH_PREFIX + jti);
  return raw ? (JSON.parse(raw) as RefreshTokenPayload) : null;
}

export async function deleteRefreshToken(jti: string): Promise<void> {
  await ensureRedis();
  await redis.del(REFRESH_PREFIX + jti);
}
