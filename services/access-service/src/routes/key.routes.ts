import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { getKeyProvider } from '../providers/index.js';
import { KeyService } from '../services/key.service.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const errBody = (code: string, message: string) => ({ error: { code, message } });

const ProvisionSchema = z.object({
  reservation_id: z.string().uuid(),
});

export async function keyRoutes(app: FastifyInstance): Promise<void> {
  const service = new KeyService(prisma, getKeyProvider());

  // ─── GET /reservations/:id/key (guest JWT) ──────────────────────
  app.get<{ Params: { id: string } }>(
    '/reservations/:id/key',
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = request.user!;
      const reservation = await prisma.reservation.findUnique({
        where: { id: request.params.id },
        select: { id: true, guestId: true },
      });
      if (!reservation) return reply.status(404).send(errBody('NOT_FOUND', 'Reservation not found'));
      if (user.userType === 'guest' && reservation.guestId !== user.userId) {
        return reply.status(403).send(errBody('FORBIDDEN', 'Not your reservation'));
      }

      const view = await service.getKeyView(reservation.id);
      switch (view.kind) {
        case 'active':
          return reply.send({
            status: 'active',
            key_token: view.keyToken,
            room_number: view.roomNumber,
            lock_device_id: view.lockDeviceId,
            lock_type: view.lockType,
            valid_from: view.validFrom,
            valid_until: view.validUntil,
          });
        case 'pending_activation':
          return reply.send({
            status: 'pending_activation',
            activates_at: view.activatesAt,
            message: 'Your key will activate on your check-in date',
          });
        case 'revoked':
          return reply.send({
            status: 'revoked',
            message: 'Your stay has ended. Thank you for staying with us!',
          });
        case 'not_applicable':
        default:
          return reply.send({ status: 'not_applicable' });
      }
    },
  );

  // ─── POST /keys/provision (internal — staff manager/admin) ──────
  app.post(
    '/keys/provision',
    { preHandler: requireRole('manager', 'admin') },
    async (request, reply) => {
      const parsed = ProvisionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid body',
              details: parsed.error.issues,
            },
          });
      }
      try {
        const cached = await service.provisionKeyForReservation(parsed.data.reservation_id);
        return reply.status(201).send({
          status: 'active',
          provider_key_id: cached.providerKeyId,
          key_token: cached.keyToken,
          room_number: cached.roomNumber,
          lock_device_id: cached.lockDeviceId,
          lock_type: cached.lockType,
          valid_from: cached.validFrom,
          valid_until: cached.validUntil,
        });
      } catch (err) {
        request.log.error({ err }, 'Force-provision failed');
        return reply.status(500).send(errBody('PROVISION_FAILED', (err as Error).message));
      }
    },
  );

  // ─── POST /keys/revoke/:reservationId (internal — manager/admin) ─
  app.post<{ Params: { reservationId: string } }>(
    '/keys/revoke/:reservationId',
    { preHandler: requireRole('manager', 'admin') },
    async (request, reply) => {
      try {
        await service.revokeKey(request.params.reservationId);
        return reply.send({ success: true });
      } catch (err) {
        request.log.error({ err }, 'Force-revoke failed');
        return reply.status(500).send(errBody('REVOKE_FAILED', (err as Error).message));
      }
    },
  );
}
