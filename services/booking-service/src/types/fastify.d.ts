import type { TokenPayload } from '../lib/jwt.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
    rawBody?: string;
  }
}
