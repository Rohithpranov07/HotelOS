import { z } from 'zod';

export const ConciergeMessageRequestSchema = z.object({
  reservation_id: z.string().uuid(),
  message: z.string().min(1).max(2000),
  message_type: z.enum(['text', 'voice_note']).default('text'),
  voice_url: z.string().url().nullable().optional(),
  session_id: z.string().uuid(),
});
export type ConciergeMessageRequest = z.infer<typeof ConciergeMessageRequestSchema>;

export const ConciergeActionSchema = z.object({
  type: z.enum(['order_created', 'service_requested', 'human_escalation']),
  order_id: z.string().uuid().optional(),
  details: z.string().optional(),
});
export type ConciergeAction = z.infer<typeof ConciergeActionSchema>;

export const ConciergeResponseSchema = z.object({
  session_id: z.string().uuid(),
  response_text: z.string(),
  actions_taken: z.array(ConciergeActionSchema).default([]),
  intent: z.string(),
  confidence: z.number().min(0).max(1),
  needs_human: z.boolean().default(false),
  follow_up_suggestions: z.array(z.string()).default([]),
});
export type ConciergeResponse = z.infer<typeof ConciergeResponseSchema>;
