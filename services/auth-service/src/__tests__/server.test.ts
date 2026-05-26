import { describe, it, expect, vi } from 'vitest';

// Prisma needs to be mocked since tests don't have a DB
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    property: { findFirst: vi.fn() },
    guest: { findUnique: vi.fn(), create: vi.fn() },
    staff: { findUnique: vi.fn() },
  },
}));

// Redis → ioredis-mock
vi.mock('ioredis', async () => {
  const mod = await import('ioredis-mock');
  return { Redis: mod.default };
});

import { buildApp } from '../index.js';

describe('auth-service server', () => {
  it('boots, exposes /health', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok', service: 'auth-service' });
    await app.close();
  });

  it('POST /api/v1/auth/otp/send returns 200 for a valid phone', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/otp/send',
      payload: { phone: '+919876543299' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ success: true, expires_in: 300 });
    await app.close();
  });

  it('POST /api/v1/auth/otp/send rejects invalid phone format', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/otp/send',
      payload: { phone: 'not-a-phone' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION_ERROR');
    await app.close();
  });

  it('GET /api/v1/auth/me requires Authorization', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/v1/auth/me' });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('AUTH_REQUIRED');
    await app.close();
  });
});
