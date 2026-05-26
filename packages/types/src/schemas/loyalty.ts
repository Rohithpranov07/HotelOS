import { z } from 'zod';
import { LoyaltyTierEnum, LoyaltyTransactionTypeEnum } from '../enums.js';

export const LoyaltyTransactionSchema = z.object({
  id: z.string().uuid(),
  guestId: z.string().uuid(),
  propertyId: z.string().uuid(),
  reservationId: z.string().uuid().nullable().optional(),
  type: LoyaltyTransactionTypeEnum,
  points: z.number().int(),
  balanceAfter: z.number().int().min(0),
  reason: z.string().max(200).nullable().optional(),
  expiresAt: z.string().date().nullable().optional(),
  createdAt: z.string().datetime(),
});
export type LoyaltyTransaction = z.infer<typeof LoyaltyTransactionSchema>;

export const LoyaltySummarySchema = z.object({
  current_points: z.number().int(),
  lifetime_points: z.number().int(),
  tier: LoyaltyTierEnum,
  next_tier: LoyaltyTierEnum.nullable(),
  points_to_next_tier: z.number().int(),
  tier_progress_pct: z.number(),
  this_stay_earned: z.number().int().default(0),
  redemption_value: z.number(),
  tier_benefits: z.array(z.string()),
});
export type LoyaltySummary = z.infer<typeof LoyaltySummarySchema>;

export const RedeemRequestSchema = z.object({
  reservation_id: z.string().uuid(),
  points: z.number().int().min(500),
  apply_to: z.enum(['folio', 'fnb_order']),
});
export type RedeemRequest = z.infer<typeof RedeemRequestSchema>;
