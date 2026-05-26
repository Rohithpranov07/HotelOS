import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyWebhookSignature, CloudbedsWebhookSchema } from '../lib/cloudbeds.js';

const SECRET = 'test-webhook-secret';
const sign = (body: string) => createHmac('sha256', SECRET).update(body).digest('hex');

describe('verifyWebhookSignature', () => {
  it('accepts a valid HMAC-SHA256 signature', () => {
    const body = JSON.stringify({ event: 'new_reservation', data: { reservationID: 'r1' } });
    expect(verifyWebhookSignature(body, sign(body))).toBe(true);
  });

  it('accepts the sha256= prefixed form', () => {
    const body = 'hello';
    expect(verifyWebhookSignature(body, `sha256=${sign(body)}`)).toBe(true);
  });

  it('rejects an invalid signature', () => {
    expect(verifyWebhookSignature('payload', 'deadbeef')).toBe(false);
  });

  it('rejects when signature missing', () => {
    expect(verifyWebhookSignature('payload', undefined)).toBe(false);
  });

  it('rejects when body has been tampered with', () => {
    const original = 'payload-a';
    const sig = sign(original);
    expect(verifyWebhookSignature('payload-b', sig)).toBe(false);
  });
});

describe('CloudbedsWebhookSchema', () => {
  it('parses a minimal new_reservation payload', () => {
    const parsed = CloudbedsWebhookSchema.parse({
      event: 'new_reservation',
      data: {
        reservationID: 'CB-123',
        checkIn: '2026-06-01',
        checkOut: '2026-06-03',
        adults: 2,
      },
    });
    expect(parsed.event).toBe('new_reservation');
    expect(parsed.data.reservationID).toBe('CB-123');
    expect(parsed.data.adults).toBe(2);
  });

  it('coerces numeric strings for adults/children/total', () => {
    const parsed = CloudbedsWebhookSchema.parse({
      event: 'modification',
      data: { reservationID: 'CB-1', adults: '3', total: '450.50' },
    });
    expect(parsed.data.adults).toBe(3);
    expect(parsed.data.total).toBe(450.5);
  });

  it('rejects payloads missing reservationID', () => {
    const result = CloudbedsWebhookSchema.safeParse({ event: 'new_reservation', data: {} });
    expect(result.success).toBe(false);
  });
});
