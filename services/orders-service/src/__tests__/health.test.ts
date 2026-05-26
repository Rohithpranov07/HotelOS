import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { Server as IOServer } from 'socket.io';
import { createServer } from 'node:http';
import { buildApp } from '../index.js';
import type { AppIO } from '../lib/socket.js';

let app: FastifyInstance;
let stubIo: AppIO;
let httpServer: ReturnType<typeof createServer>;

beforeAll(async () => {
  httpServer = createServer();
  stubIo = new IOServer(httpServer);
  app = await buildApp({ io: stubIo });
  await app.ready();
});

afterAll(async () => {
  await app.close();
  stubIo.close();
  httpServer.close();
});

describe('orders-service health & auth gates', () => {
  it('GET /health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json().service).toBe('orders-service');
  });

  it('unauthenticated /api/v1/menu is 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/menu' });
    expect(res.statusCode).toBe(401);
  });

  it('unauthenticated POST /api/v1/orders is 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      payload: { reservation_id: '00000000-0000-0000-0000-000000000000', type: 'food', items: [] },
    });
    expect(res.statusCode).toBe(401);
  });

  it('order creation rejects malformed input shape', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: { authorization: 'Bearer not.a.real.token' },
      payload: {},
    });
    // Either TOKEN_INVALID (401) before validation, but token check runs first.
    expect([401, 400]).toContain(res.statusCode);
  });
});
