// Cross-store bridge so a guest's order shows up in the staff queue (and vice versa)
// while running in demo / offline-backend mode. Uses lazy requires to avoid the
// orders ↔ staff ↔ auth ↔ reservation circular import that direct imports would create.

import type { Order, OrderStatus } from '../stores/orders.store';
import type { StaffTask, TaskStatus, TaskType, TaskItem } from '../stores/staff.store';

export function mapOrderTypeToTaskType(orderType: string): TaskType {
  const t = orderType.toLowerCase();
  if (t === 'beverage' || t === 'bar' || t === 'wine') return 'beverage';
  if (t === 'housekeeping' || t === 'turndown' || t === 'cleaning') return 'housekeeping';
  if (t === 'laundry' || t === 'press' || t === 'dry_clean') return 'laundry';
  if (t === 'maintenance' || t === 'repair' || t === 'engineering') return 'maintenance';
  if (t === 'concierge' || t === 'transport' || t === 'spa') return 'concierge';
  return 'food';
}

function statusToTaskStatus(s: OrderStatus): TaskStatus {
  return s;
}

interface GuestContext {
  id: string;
  name: string;
  roomNumber: string;
  loyaltyTier: StaffTask['guest']['loyaltyTier'];
  phone?: string;
  propertyId?: string;
}

function readGuestContext(): GuestContext {
  // Lazy require so this file can be imported from either store without cycles.
  const { useAuthStore } = require('../stores/auth.store') as typeof import('../stores/auth.store');
  const { useReservationStore } =
    require('../stores/reservation.store') as typeof import('../stores/reservation.store');
  const guest = useAuthStore.getState().guest;
  const reservation = useReservationStore.getState().reservation;
  const name = (guest?.fullName?.trim() || 'In-house Guest') as string;
  return {
    id: guest?.id ?? 'guest-anonymous',
    name,
    roomNumber: reservation?.room?.roomNumber ?? '—',
    loyaltyTier: guest?.loyaltyTier ?? 'BRONZE',
    phone: guest?.phone,
  };
}

function orderItemsToTaskItems(items: Order['items']): TaskItem[] | undefined {
  if (!items?.length) return undefined;
  return items.map((i) => ({
    name: i.name,
    quantity: i.quantity,
    unit_price: i.unit_price,
    ...(i.notes ? { notes: i.notes } : {}),
  }));
}

function describeOrder(order: Order): string {
  if (order.items?.length) {
    return order.items
      .map((i) => (i.quantity > 1 ? `${i.quantity} × ${i.name}` : i.name))
      .join(', ');
  }
  return order.type.replace(/_/g, ' ');
}

export function orderToStaffTask(order: Order, ctx: GuestContext): StaffTask {
  const type = mapOrderTypeToTaskType(order.type);
  const priority: StaffTask['priority'] =
    ctx.loyaltyTier === 'PLATINUM' || ctx.loyaltyTier === 'GOLD'
      ? 'high'
      : ctx.loyaltyTier === 'SILVER'
        ? 'medium'
        : 'low';
  return {
    id: order.id,
    type,
    status: statusToTaskStatus(order.status),
    priority,
    guest: {
      id: ctx.id,
      name: ctx.name,
      roomNumber: ctx.roomNumber,
      loyaltyTier: ctx.loyaltyTier,
      phone: ctx.phone,
    },
    description: describeOrder(order),
    items: orderItemsToTaskItems(order.items),
    totalAmount: order.total_amount,
    notes: order.notes,
    createdAt: order.created_at,
    slaDeadline: order.sla_deadline,
    assignedToMe: false,
    reservationId: order.reservation_id,
    propertyId: ctx.propertyId,
    completionPhotoUrl: null,
  };
}

// Called from orders.store when a guest creates an order (real or local-fake).
export function bridgeGuestOrderToStaff(order: Order): void {
  const { useStaffStore } =
    require('../stores/staff.store') as typeof import('../stores/staff.store');
  const ctx = readGuestContext();
  const task = orderToStaffTask(order, ctx);
  useStaffStore.getState().ingestGuestOrder(task);
}

// Called from orders.store when the guest-side simulation moves an order forward.
export function bridgeStatusToStaff(orderId: string, status: OrderStatus): void {
  const { useStaffStore } =
    require('../stores/staff.store') as typeof import('../stores/staff.store');
  useStaffStore.getState().applyBridgeStatus(orderId, statusToTaskStatus(status));
}

// Called from staff.store when staff updates a task — propagates back to the guest's
// activeOrders so the guest sees status changes without round-tripping the backend.
export function bridgeStatusToGuest(taskId: string, status: TaskStatus): void {
  const { useOrdersStore } =
    require('../stores/orders.store') as typeof import('../stores/orders.store');
  useOrdersStore.getState().applyBridgeStatus(taskId, status as OrderStatus);
}

// Called from feedback / orders stores when a guest submits negative sentiment.
// Surfaces an alert on the manager's staff console.
export function bridgeNegativeFeedback(args: {
  reservationId: string;
  overallScore: number;
  comment?: string;
}): void {
  const ctx = readGuestContext();
  const { useStaffStore } =
    require('../stores/staff.store') as typeof import('../stores/staff.store');
  useStaffStore.getState().pushNegativeFeedback({
    reservationId: args.reservationId,
    guestName: ctx.name,
    roomNumber: ctx.roomNumber,
    overallScore: args.overallScore,
    comment: args.comment,
    receivedAt: new Date().toISOString(),
  });
}
