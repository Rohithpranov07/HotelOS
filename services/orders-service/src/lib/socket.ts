import type { Server as HttpServer } from 'node:http';
import { Server as IOServer, type Socket } from 'socket.io';
import { verifyToken, type TokenPayload } from './jwt.js';

export type AppIO = IOServer;

export function createSocketServer(httpServer: HttpServer): AppIO {
  const io = new IOServer(httpServer, {
    cors: { origin: '*' },
    transports: ['websocket', 'polling'],
  });

  io.use(async (socket: Socket, next) => {
    try {
      const token = (socket.handshake.auth?.token as string | undefined) ?? '';
      if (!token) throw new Error('missing token');
      const payload = await verifyToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as TokenPayload;
    if (user.userType === 'guest' && user.reservationId) {
      socket.join(`reservation:${user.reservationId}`);
    }
    if (user.userType === 'staff' && user.propertyId) {
      socket.join(`property:${user.propertyId}`);
      if (user.userId) socket.join(`staff:${user.userId}`);
    }
  });

  return io;
}

export function emitOrderUpdate(io: AppIO, reservationId: string, data: object): void {
  io.to(`reservation:${reservationId}`).emit('order:status_update', data);
}

export function emitNewTask(io: AppIO, propertyId: string, data: object): void {
  io.to(`property:${propertyId}`).emit('task:new', data);
}

export function emitSlaWarning(io: AppIO, propertyId: string, data: object): void {
  io.to(`property:${propertyId}`).emit('task:sla_warning', data);
}

export function emitSlaBreach(io: AppIO, propertyId: string, data: object): void {
  io.to(`property:${propertyId}`).emit('task:sla_breach', data);
}

export function emitDndChange(io: AppIO, propertyId: string, data: object): void {
  io.to(`property:${propertyId}`).emit('reservation:dnd_change', data);
}
