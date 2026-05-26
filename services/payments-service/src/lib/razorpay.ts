import { createHmac, timingSafeEqual } from 'node:crypto';
import Razorpay from 'razorpay';
import { config, hasRazorpay } from '../config.js';

let _client: Razorpay | null = null;

function getClient(): Razorpay {
  if (!hasRazorpay) {
    throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }
  if (!_client) {
    _client = new Razorpay({
      key_id: config.razorpay.keyId!,
      key_secret: config.razorpay.keySecret!,
    });
  }
  return _client;
}

export interface CreatedOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string | null;
}

export async function createPaymentOrder(params: {
  amount: number; // rupees
  currency?: string;
  reservationId: string;
  guestPhone?: string;
}): Promise<CreatedOrder> {
  const rzp = getClient();
  const order = await rzp.orders.create({
    amount: Math.round(params.amount * 100),
    currency: params.currency ?? 'INR',
    receipt: params.reservationId.slice(0, 40),
    notes: {
      reservation_id: params.reservationId,
      guest_phone: params.guestPhone ?? '',
    },
  });
  return {
    id: String(order.id),
    amount: Number(order.amount),
    currency: String(order.currency),
    receipt: order.receipt ?? null,
  };
}

/**
 * Verify the razorpay_signature returned by Checkout. Uses constant-time
 * comparison so an attacker can't time-leak the secret.
 */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!config.razorpay.keySecret) return false;
  const body = `${params.orderId}|${params.paymentId}`;
  const expected = createHmac('sha256', config.razorpay.keySecret).update(body).digest('hex');
  const provided = params.signature.toLowerCase();
  if (expected.length !== provided.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'));
  } catch {
    return false;
  }
}
