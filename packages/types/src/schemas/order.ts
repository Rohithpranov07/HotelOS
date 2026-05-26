import { z } from 'zod';
import { OrderTypeEnum, OrderStatusEnum, PaymentMethodEnum } from '../enums.js';

export const OrderItemSchema = z.object({
  menu_item_id: z.string().uuid().optional(),
  name: z.string().min(1),
  quantity: z.number().int().min(1),
  unit_price: z.number().min(0),
  notes: z.string().max(500).optional(),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.object({
  id: z.string().uuid(),
  reservationId: z.string().uuid(),
  guestId: z.string().uuid(),
  propertyId: z.string().uuid(),
  assignedStaffId: z.string().uuid().nullable().optional(),
  type: OrderTypeEnum,
  status: OrderStatusEnum.default('pending'),
  items: z.array(OrderItemSchema).default([]),
  totalAmount: z.number().default(0),
  scheduledFor: z.string().datetime().nullable().optional(),
  slaDeadline: z.string().datetime().nullable().optional(),
  acceptedAt: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  guestRating: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
});
export type Order = z.infer<typeof OrderSchema>;

export const CreateOrderRequestSchema = z.object({
  reservation_id: z.string().uuid(),
  type: OrderTypeEnum,
  items: z.array(OrderItemSchema).min(1),
  scheduled_for: z.string().datetime().nullable().optional(),
  payment_method: PaymentMethodEnum.default('folio'),
  notes: z.string().max(1000).optional(),
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;
