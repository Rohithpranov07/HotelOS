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

describe('payments-service health & auth gates', () => {
  it('GET /health reports provider configuration', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.service).toBe('payments-service');
    expect(body.providers).toMatchObject({
      razorpay: true, // test keys are wired in setup.ts
      sendgrid: false,
      s3: false,
    });
  });

  it('POST /create-order requires auth', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/create-order',
      payload: { reservation_id: '00000000-0000-0000-0000-000000000000', amount: 1000 },
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /verify rejects without auth', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/verify',
      payload: {
        reservation_id: '00000000-0000-0000-0000-000000000000',
        razorpay_order_id: 'order_1',
        razorpay_payment_id: 'pay_1',
        razorpay_signature: 'deadbeef',
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET /invoice/:id requires auth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/payments/invoice/00000000-0000-0000-0000-000000000000',
    });
    expect(res.statusCode).toBe(401);
  });
});
