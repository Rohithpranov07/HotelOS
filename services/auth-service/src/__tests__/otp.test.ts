import { describe, it, expect, beforeEach, vi } from 'vitest';

// Replace ioredis with the in-memory mock for this test file.
vi.mock('ioredis', async () => {
  const mod = await import('ioredis-mock');
  return { Redis: mod.default };
});

import {
  storeOtp,
  verifyOtp,
  checkOtpRateLimit,
  storeRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  redis,
} from '../lib/redis.js';
import { generateOtp } from '../lib/firebase.js';

beforeEach(async () => {
  await redis.flushall();
});

describe('OTP storage', () => {
  it('generateOtp returns a 6-digit numeric string', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateOtp();
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it('happy path: stored OTP verifies once and is consumed', async () => {
    await storeOtp('+919876543210', '123456');
    const first = await verifyOtp('+919876543210', '123456');
    expect(first.kind).toBe('ok');
    // Same code rejected on second use (cleared)
    const second = await verifyOtp('+919876543210', '123456');
    expect(second.kind).toBe('expired');
  });

  it('wrong code: decrements attempts, then locks after 3 failures', async () => {
    await storeOtp('+919876543211', '111111');
    const r1 = await verifyOtp('+919876543211', '999999');
    const r2 = await verifyOtp('+919876543211', '999999');
    const r3 = await verifyOtp('+919876543211', '999999');
    const r4 = await verifyOtp('+919876543211', '999999');
    expect(r1.kind).toBe('invalid');
    expect(r2.kind).toBe('invalid');
    expect(r3.kind).toBe('invalid');
    expect(r4.kind).toBe('locked');
  });

  it('attempts_remaining counts down', async () => {
    await storeOtp('+919876543212', '654321');
    const r1 = await verifyOtp('+919876543212', '000000');
    expect(r1.kind === 'invalid' && r1.attemptsRemaining).toBe(2);
    const r2 = await verifyOtp('+919876543212', '000000');
    expect(r2.kind === 'invalid' && r2.attemptsRemaining).toBe(1);
  });
});

describe('OTP rate limit', () => {
  it('allows up to N requests then 429s', async () => {
    const a = await checkOtpRateLimit('+919876500000');
    const b = await checkOtpRateLimit('+919876500000');
    const c = await checkOtpRateLimit('+919876500000');
    const d = await checkOtpRateLimit('+919876500000');
    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
    expect(c.allowed).toBe(true);
    expect(d.allowed).toBe(false);
    expect(d.retryAfter).toBeGreaterThan(0);
  });
});

describe('refresh token store', () => {
  it('round-trips a payload', async () => {
    await storeRefreshToken('jti-1', { userId: 'u1', userType: 'guest' }, 60);
    const fetched = await getRefreshToken('jti-1');
    expect(fetched).toEqual({ userId: 'u1', userType: 'guest' });
  });

  it('delete removes the record', async () => {
    await storeRefreshToken('jti-2', { userId: 'u2', userType: 'staff', role: 'manager' }, 60);
    await deleteRefreshToken('jti-2');
    expect(await getRefreshToken('jti-2')).toBeNull();
  });
});
