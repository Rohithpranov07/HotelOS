import type { OrderType, StaffRole } from '@prisma/client';
import { prisma } from './prisma.js';

const ORDER_TYPE_TO_ROLES: Record<OrderType, StaffRole[]> = {
  food: ['room_service'],
  beverage: ['room_service'],
  laundry: ['housekeeping'],
  housekeeping: ['housekeeping'],
  amenity: ['housekeeping', 'front_desk'],
  maintenance: ['maintenance'],
  spa: ['front_desk'],
};

/**
 * Least-loaded staff member with a role that handles this order type.
 * Returns null when no eligible staff exist (order stays unassigned).
 */
export async function findAssignee(
  propertyId: string,
  orderType: OrderType,
): Promise<string | null> {
  const roles = ORDER_TYPE_TO_ROLES[orderType] ?? [];
  if (roles.length === 0) return null;

  const candidates = await prisma.staff.findMany({
    where: { propertyId, isActive: true, role: { in: roles } },
    select: {
      id: true,
      _count: {
        select: {
          assignedOrders: {
            where: { status: { in: ['pending', 'accepted', 'in_progress'] } },
          },
        },
      },
    },
  });

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a._count.assignedOrders - b._count.assignedOrders);
  return candidates[0]!.id;
}
