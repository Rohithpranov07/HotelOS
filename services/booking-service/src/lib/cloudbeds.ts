import { createHmac, timingSafeEqual } from 'node:crypto';
import axios from 'axios';
import { z } from 'zod';
import { config } from '../config.js';

export const CloudbedsWebhookSchema = z.object({
  event: z.string(),
  data: z.object({
    reservationID: z.string(),
    guestID: z.string().optional(),
    status: z.string().optional(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    roomID: z.string().optional(),
    guestFirstName: z.string().optional(),
    guestLastName: z.string().optional(),
    guestPhone: z.string().optional(),
    guestEmail: z.string().optional(),
    adults: z.coerce.number().int().optional(),
    children: z.coerce.number().int().optional(),
    total: z.coerce.number().optional(),
  }),
});
export type CloudbedsWebhookPayload = z.infer<typeof CloudbedsWebhookSchema>;

export function verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
  if (!signature) return false;
  const expected = createHmac('sha256', config.cloudbeds.webhookSecret)
    .update(rawBody)
    .digest('hex');
  const provided = signature.startsWith('sha256=') ? signature.slice(7) : signature;
  if (expected.length !== provided.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'));
  } catch {
    return false;
  }
}

interface ArrivalsResponse {
  data?: Array<{
    reservationID: string;
    guestID?: string;
    status?: string;
    checkIn?: string;
    checkOut?: string;
    roomID?: string;
    adults?: number;
    children?: number;
    total?: number;
  }>;
}

export async function fetchUpcomingArrivals(fromDate: string, toDate: string): Promise<NonNullable<ArrivalsResponse['data']>> {
  if (!config.cloudbeds.apiKey) return [];
  const response = await axios.get<ArrivalsResponse>(`${config.cloudbeds.apiUrl}/getReservations`, {
    params: {
      propertyID: config.cloudbeds.propertyId,
      checkInFrom: fromDate,
      checkInTo: toDate,
    },
    headers: { Authorization: `Bearer ${config.cloudbeds.apiKey}` },
    timeout: 10_000,
  });
  return response.data.data ?? [];
}
