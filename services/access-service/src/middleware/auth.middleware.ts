import type { FastifyReply, FastifyRequest } from 'fastify';
import { verifyToken } from '../lib/jwt.js';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    reply
      .status(401)
      .send({ error: { code: 'AUTH_REQUIRED', message: 'Authorization header missing' } });
    return;
  }
  const token = header.slice(7);
  try {
    request.user = await verifyToken(token);
  } catch {
    reply
      .status(401)
      .send({ error: { code: 'TOKEN_INVALID', message: 'Invalid or expired token' } });
  }
}

export function requireRole(...roles: string[]) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    await requireAuth(request, reply);
    if (reply.sent) return;
    const role = request.user?.role ?? '';
    if (!roles.includes(role)) {
      reply
        .status(403)
        .send({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    }
  };
}

/**
 * Internal-service auth: requires either an `X-Internal-Secret` header that
 * matches INTERNAL_SECRET, or a staff JWT with manager/admin role.
 */
export function requireInternal(secret: string | null) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const provided = request.headers['x-internal-secret'];
    if (secret && provided === secret) return;
    await requireRole('manager', 'admin')(request, reply);
  };
}
