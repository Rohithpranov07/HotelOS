import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../index.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('access-service health & auth gates', () => {
  it('GET /health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json().service).toBe('access-service');
  });

  it('GET /api/v1/reservations/:id/key requires auth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/reservations/00000000-0000-0000-0000-000000000000/key',
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/v1/keys/provision requires manager/admin', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/keys/provision',
      payload: { reservation_id: '00000000-0000-0000-0000-000000000000' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/v1/keys/revoke/:id requires manager/admin', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/keys/revoke/00000000-0000-0000-0000-000000000000',
    });
    expect(res.statusCode).toBe(401);
  });
});
