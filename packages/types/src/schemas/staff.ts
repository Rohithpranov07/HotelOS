import { z } from 'zod';
import { StaffRoleEnum } from '../enums.js';

export const StaffSchema = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1).max(200),
  role: StaffRoleEnum,
  isActive: z.boolean().default(true),
});
export type Staff = z.infer<typeof StaffSchema>;

export const TaskCardSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  status: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  guest: z.object({
    name: z.string(),
    roomNumber: z.string(),
    loyaltyTier: z.string(),
  }),
  description: z.string(),
  totalAmount: z.number().optional(),
  createdAt: z.string().datetime(),
  slaDeadline: z.string().datetime().nullable(),
  slaMinutesRemaining: z.number(),
  isSlaBreached: z.boolean(),
});
export type TaskCard = z.infer<typeof TaskCardSchema>;
