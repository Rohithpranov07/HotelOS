import { z } from 'zod';

export const MenuItemSchema = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  price: z.number().min(0),
  category: z.string().max(50),
  dietaryTags: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
  imageUrl: z.string().url().nullable().optional(),
  prepTimeMinutes: z.number().int().default(15),
  isAvailable: z.boolean().default(true),
  availableFrom: z.string().nullable().optional(),
  availableTo: z.string().nullable().optional(),
});
export type MenuItem = z.infer<typeof MenuItemSchema>;
