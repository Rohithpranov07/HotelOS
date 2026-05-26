import { z } from 'zod';
import { PhoneE164 } from './guest.js';

export const SendOtpRequestSchema = z.object({
  phone: PhoneE164,
});
export type SendOtpRequest = z.infer<typeof SendOtpRequestSchema>;

export const VerifyOtpRequestSchema = z.object({
  phone: PhoneE164,
  otp: z.string().length(6).regex(/^\d{6}$/),
});
export type VerifyOtpRequest = z.infer<typeof VerifyOtpRequestSchema>;

export const StaffLoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  totp_code: z.string().length(6).optional(),
});
export type StaffLoginRequest = z.infer<typeof StaffLoginRequestSchema>;

export const RefreshRequestSchema = z.object({
  refresh_token: z.string(),
});
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;

export const TokenPairSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
});
export type TokenPair = z.infer<typeof TokenPairSchema>;
