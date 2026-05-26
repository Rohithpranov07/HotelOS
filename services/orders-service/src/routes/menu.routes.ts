import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

import { prisma } from '../lib/prisma.js';
import { num } from '../lib/folio.js';
import { config } from '../config.js';
import { requireGuest } from '../middleware/auth.middleware.js';

const errBody = (code: string, message: string) => ({ error: { code, message } });

const MenuQuerySchema = z.object({
  category: z.string().optional(),
  dietary: z.string().optional(),
  search: z.string().optional(),
  recommended: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

function isKitchenOpen(now: Date = new Date()): boolean {
  const hhmm = now.toTimeString().slice(0, 5);
  return hhmm >= config.kitchen.open && hhmm <= config.kitchen.close;
}

type MenuItemRow = Prisma.MenuItemGetPayload<Record<string, never>>;

function toDto(item: MenuItemRow) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: num(item.price),
    category: item.category,
    dietaryTags: item.dietaryTags,
    allergens: item.allergens,
    imageUrl: item.imageUrl,
    prepTimeMinutes: item.prepTimeMinutes,
    availableFrom: item.availableFrom,
    availableTo: item.availableTo,
  };
}

export async function menuRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', { preHandler: requireGuest }, async (request, reply) => {
    const user = request.user!;
    const parsed = MenuQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query',
            details: parsed.error.issues,
          },
        });
    }

    // Resolve propertyId via guest record (token may not include it).
    let propertyId = user.propertyId;
    if (!propertyId) {
      const guest = await prisma.guest.findUnique({
        where: { id: user.userId },
        select: { propertyId: true, dietaryFlags: true },
      });
      if (!guest) return reply.status(404).send(errBody('GUEST_NOT_FOUND', 'Guest not found'));
      propertyId = guest.propertyId;
    }

    const where: Prisma.MenuItemWhereInput = { propertyId, isAvailable: true };
    if (parsed.data.category) where.category = parsed.data.category;
    if (parsed.data.dietary) where.dietaryTags = { has: parsed.data.dietary };
    if (parsed.data.search) {
      where.OR = [
        { name: { contains: parsed.data.search, mode: 'insensitive' } },
        { description: { contains: parsed.data.search, mode: 'insensitive' } },
      ];
    }

    let items = await prisma.menuItem.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const categories = Array.from(new Set(items.map((i) => i.category))).sort();

    let recommended: MenuItemRow[] = [];
    if (parsed.data.recommended) {
      const guest = await prisma.guest.findUnique({
        where: { id: user.userId },
        select: { dietaryFlags: true },
      });
      const flags = guest?.dietaryFlags ?? [];
      if (flags.length > 0) {
        const matchesProfile = (i: MenuItemRow) => i.dietaryTags.some((t) => flags.includes(t));
        recommended = items.filter(matchesProfile).slice(0, 3);
        // Reorder: matching items first, then the rest (stable within each group).
        const matching = items.filter(matchesProfile);
        const rest = items.filter((i) => !matchesProfile(i));
        items = [...matching, ...rest];
      }
    }

    return reply.send({
      items: items.map(toDto),
      categories,
      recommended: recommended.map(toDto),
      kitchen_open: isKitchenOpen(),
      kitchen_hours: { open: config.kitchen.open, close: config.kitchen.close },
    });
  });
}
