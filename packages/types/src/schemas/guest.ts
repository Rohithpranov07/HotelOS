import { z } from 'zod';
import { LoyaltyTierEnum } from '../enums.js';

export const PhoneE164 = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Phone must be E.164 format');

export const GuestSchema = z.object({
  id: z.string().uuid(),
  phone: PhoneE164,
  email: z.string().email().nullable().optional(),
  fullName: z.string().min(1).max(200),
  nationality: z.string().length(2).nullable().optional(),
  languageCode: z.string().default('en'),
  dateOfBirth: z.string().date().nullable().optional(),
  anniversaryDate: z.string().date().nullable().optional(),
  loyaltyTier: LoyaltyTierEnum.default('bronze'),
  loyaltyPoints: z.number().int().min(0).default(0),
  lifetimePoints: z.number().int().min(0).default(0),
  totalStays: z.number().int().min(0).default(0),
  dietaryFlags: z.array(z.string()).default([]),
  waOptIn: z.boolean().default(false),
  appPushOptIn: z.boolean().default(false),
  propertyId: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type Guest = z.infer<typeof GuestSchema>;

export const GuestPreferencesSchema = z.object({
  room_temp_celsius: z.number().min(16).max(30).optional(),
  pillow_type: z.enum(['soft', 'firm', 'medium']).optional(),
  floor_preference: z.enum(['high', 'low', 'none']).optional(),
  dietary_flags: z.array(z.string()).optional(),
  newspaper: z.string().max(100).optional(),
  extra_blanket: z.boolean().optional(),
  early_checkin_request: z.boolean().optional(),
  special_notes: z.string().max(500).optional(),
});
export type GuestPreferences = z.infer<typeof GuestPreferencesSchema>;
