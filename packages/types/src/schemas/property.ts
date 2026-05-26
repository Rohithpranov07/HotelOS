import { z } from 'zod';

export const PropertySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  address: z.string(),
  city: z.string().max(100),
  country: z.string().length(2),
  timezone: z.string().default('Asia/Kolkata'),
  pmsType: z.string().nullable().optional(),
  loyaltyEarnRate: z.number().default(1.0),
  pointsExpiryDays: z.number().int().default(365),
  subscriptionTier: z.string().default('starter'),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
});
export type Property = z.infer<typeof PropertySchema>;
