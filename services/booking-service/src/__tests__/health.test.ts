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

describe('booking-service health & auth gates', () => {
  it('GET /health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('booking-service');
  });

  it('unauthenticated /api/v1/reservations/active is 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/reservations/active' });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('AUTH_REQUIRED');
  });

  it('webhook rejects requests without a valid signature', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/cloudbeds',
      headers: { 'content-type': 'application/json', 'x-property-id': 'prop-1' },
      payload: JSON.stringify({ event: 'new_reservation', data: { reservationID: 'CB-1' } }),
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('INVALID_SIGNATURE');
  });
});
