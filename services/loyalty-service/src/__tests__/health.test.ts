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

describe('loyalty-service health & auth gates', () => {
  it('GET /health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json().service).toBe('loyalty-service');
  });

  it('GET /summary requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/loyalty/summary' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /statement requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/loyalty/statement' });
    expect(res.statusCode).toBe(401);
  });

  it('POST /redeem requires auth', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/loyalty/redeem',
      payload: {
        reservation_id: '00000000-0000-0000-0000-000000000000',
        points: 500,
        apply_to: 'folio',
      },
    });
    expect(res.statusCode).toBe(401);
  });
});
