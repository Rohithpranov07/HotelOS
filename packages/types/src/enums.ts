import { z } from 'zod';

export const LoyaltyTierEnum = z.enum(['bronze', 'silver', 'gold', 'platinum']);
export type LoyaltyTier = z.infer<typeof LoyaltyTierEnum>;

export const ReservationStatusEnum = z.enum([
  'confirmed',
  'pre_checked_in',
  'checked_in',
  'checked_out',
  'cancelled',
  'no_show',
]);
export type ReservationStatus = z.infer<typeof ReservationStatusEnum>;

export const OrderTypeEnum = z.enum([
  'food',
  'beverage',
  'laundry',
  'housekeeping',
  'amenity',
  'maintenance',
  'spa',
]);
export type OrderType = z.infer<typeof OrderTypeEnum>;

export const OrderStatusEnum = z.enum([
  'pending',
  'accepted',
  'in_progress',
  'completed',
  'cancelled',
]);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const StaffRoleEnum = z.enum([
  'front_desk',
  'housekeeping',
  'room_service',
  'maintenance',
  'manager',
  'admin',
]);
export type StaffRole = z.infer<typeof StaffRoleEnum>;

export const RoomStatusEnum = z.enum([
  'clean',
  'occupied',
  'dirty',
  'inspected',
  'out_of_order',
]);
export type RoomStatus = z.infer<typeof RoomStatusEnum>;

export const LoyaltyTransactionTypeEnum = z.enum([
  'earn',
  'redeem',
  'expire',
  'adjust',
  'bonus',
  'referral',
]);
export type LoyaltyTransactionType = z.infer<typeof LoyaltyTransactionTypeEnum>;

export const PaymentMethodEnum = z.enum(['razorpay', 'stripe', 'loyalty_points', 'folio']);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export const MoodEnum = z.enum(['very_unhappy', 'unhappy', 'neutral', 'happy', 'delighted']);
export type Mood = z.infer<typeof MoodEnum>;

export const KeyStatusEnum = z.enum([
  'not_applicable',
  'pending_activation',
  'active',
  'revoked',
]);
export type KeyStatus = z.infer<typeof KeyStatusEnum>;
