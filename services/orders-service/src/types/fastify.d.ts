import type { TokenPayload } from '../lib/jwt.js';
import type { AppIO } from '../lib/socket.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
  }
  interface FastifyInstance {
    io: AppIO;
  }
}
