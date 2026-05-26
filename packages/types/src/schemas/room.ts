import { z } from 'zod';
import { RoomStatusEnum } from '../enums.js';

export const RoomSchema = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  roomNumber: z.string().max(10),
  roomType: z.string().max(50),
  floor: z.number().int(),
  maxOccupancy: z.number().int().default(2),
  baseRate: z.number(),
  lockDeviceId: z.string().nullable().optional(),
  amenities: z.array(z.string()).default([]),
  isAvailable: z.boolean().default(true),
  housekeepingStatus: RoomStatusEnum.default('clean'),
  lastCleanedAt: z.string().datetime().nullable().optional(),
});
export type Room = z.infer<typeof RoomSchema>;
