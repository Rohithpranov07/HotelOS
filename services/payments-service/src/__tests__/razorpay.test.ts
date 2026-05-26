import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyPaymentSignature } from '../lib/razorpay.js';

const SECRET = 'XqLR6y2JslOeOC0eyhE2rlNN';

function sign(orderId: string, paymentId: string): string {
  return createHmac('sha256', SECRET).update(`${orderId}|${paymentId}`).digest('hex');
}

describe('verifyPaymentSignature', () => {
  it('accepts a valid HMAC-SHA256 signature', () => {
    const orderId = 'order_ABC123';
    const paymentId = 'pay_XYZ789';
    const signature = sign(orderId, paymentId);
    expect(verifyPaymentSignature({ orderId, paymentId, signature })).toBe(true);
  });

  it('rejects a tampered signature', () => {
    const orderId = 'order_ABC123';
    const paymentId = 'pay_XYZ789';
    const tampered = sign(orderId, paymentId).slice(0, -2) + 'aa';
    expect(verifyPaymentSignature({ orderId, paymentId, signature: tampered })).toBe(false);
  });

  it('rejects when the paymentId has been swapped', () => {
    const orderId = 'order_ABC123';
    const signature = sign(orderId, 'pay_REAL');
    expect(
      verifyPaymentSignature({ orderId, paymentId: 'pay_FAKE', signature }),
    ).toBe(false);
  });

  it('rejects an empty signature', () => {
    expect(verifyPaymentSignature({ orderId: 'o', paymentId: 'p', signature: '' })).toBe(false);
  });

  it('rejects a signature of the wrong length', () => {
    expect(verifyPaymentSignature({ orderId: 'o', paymentId: 'p', signature: 'abcd' })).toBe(false);
  });
});
