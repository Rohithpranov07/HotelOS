import { z } from 'zod';
import { ReservationStatusEnum, KeyStatusEnum } from '../enums.js';

export const ReservationSchema = z.object({
  id: z.string().uuid(),
  guestId: z.string().uuid(),
  propertyId: z.string().uuid(),
  roomId: z.string().uuid().nullable().optional(),
  pmsBookingRef: z.string().nullable().optional(),
  status: ReservationStatusEnum,
  checkInDate: z.string().date(),
  checkOutDate: z.string().date(),
  actualCheckIn: z.string().datetime().nullable().optional(),
  actualCheckOut: z.string().datetime().nullable().optional(),
  adults: z.number().int().min(1),
  children: z.number().int().min(0).default(0),
  ratePlan: z.string().nullable().optional(),
  roomRate: z.number().nullable().optional(),
  totalRoomAmount: z.number().default(0),
  totalFnbAmount: z.number().default(0),
  totalOtherAmount: z.number().default(0),
  totalAmount: z.number().default(0),
  paidAmount: z.number().default(0),
  specialRequests: z.string().nullable().optional(),
  mobileKeyStatus: KeyStatusEnum.default('not_applicable'),
  isDnd: z.boolean().default(false),
});
export type Reservation = z.infer<typeof ReservationSchema>;

export const PreCheckinRequestSchema = z.object({
  id_scan: z.object({
    document_type: z.enum(['passport', 'aadhaar', 'dl']),
    full_name: z.string().min(1),
    date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    document_number_hash: z.string(),
  }),
  preferences: z.object({
    room_temp_celsius: z.number().min(16).max(30).optional(),
    pillow_type: z.enum(['soft', 'firm', 'medium']).optional(),
    floor_preference: z.enum(['high', 'low', 'none']).optional(),
    early_checkin_request: z.boolean().default(false),
    special_notes: z.string().max(500).optional(),
  }),
  eta: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
});
export type PreCheckinRequest = z.infer<typeof PreCheckinRequestSchema>;

export const CheckoutRequestSchema = z.object({
  payment_method: z.enum(['razorpay', 'stripe', 'loyalty_points', 'folio']),
  razorpay_payment_id: z.string().optional(),
  tip_amount: z.number().min(0).default(0),
  bill_split_confirmed: z.boolean().default(false),
});
export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;
