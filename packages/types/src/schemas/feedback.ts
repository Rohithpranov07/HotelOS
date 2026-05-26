import { z } from 'zod';
import { MoodEnum } from '../enums.js';

export const FeedbackRequestSchema = z.object({
  reservation_id: z.string().uuid(),
  order_id: z.string().uuid().nullable().optional(),
  rating: z.number().int().min(1).max(5),
  mood: MoodEnum,
  categories: z
    .object({
      food: z.number().int().min(1).max(5).optional(),
      housekeeping: z.number().int().min(1).max(5).optional(),
      front_desk: z.number().int().min(1).max(5).optional(),
      concierge: z.number().int().min(1).max(5).optional(),
    })
    .default({}),
  text_note: z.string().max(2000).optional(),
  voice_note_url: z.string().url().nullable().optional(),
  is_anonymous: z.boolean().default(false),
});
export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;
