import { io, type Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { storage, StorageKeys } from './storage';
import { useOrdersStore } from '../stores/orders.store';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

function ordersWsUrl(): string {
  const fromEnv =
    process.env.EXPO_PUBLIC_ORDERS_WS_URL ??
    extra.EXPO_PUBLIC_ORDERS_WS_URL ??
    process.env.EXPO_PUBLIC_ORDERS_API_URL;
  if (fromEnv) return fromEnv.replace(/^http/, 'ws').replace(/\/api\/v1\/?$/, '');
  const root = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
  return root.replace(/:\d+(\/.*)?$/, ':3003').replace(/^http/, 'ws');
}

let socket: Socket | null = null;
let joinedReservationId: string | null = null;

export function connectSocket(reservationId: string): Socket {
  if (socket?.connected && joinedReservationId === reservationId) return socket;
  if (socket?.connected) socket.disconnect();

  const token = storage.getString(StorageKeys.AccessToken);
  socket = io(ordersWsUrl(), {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    socket?.emit('join:reservation', { reservationId });
    joinedReservationId = reservationId;
  });

  socket.on('order:status_update', (data: { orderId: string; status: string }) => {
    useOrdersStore.getState().updateOrderStatus(data.orderId, data.status);
  });

  socket.on('order:created', () => {
    void useOrdersStore.getState().fetchActiveOrders();
  });

  socket.on('disconnect', () => {
    joinedReservationId = null;
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  joinedReservationId = null;
}

let staffSocket: Socket | null = null;

export function connectStaffSocket(propertyId: string): Socket {
  if (staffSocket?.connected) return staffSocket;
  const token = storage.getString(StorageKeys.AccessToken);
  staffSocket = io(ordersWsUrl(), {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
  });
  staffSocket.on('connect', () => {
    staffSocket?.emit('join:property', { propertyId });
  });
  return staffSocket;
}

export interface StaffSocketHandlers {
  onTaskNew?: (task: unknown) => void;
  onTaskStatus?: (payload: { orderId: string; status: string }) => void;
  onSlaWarning?: (payload: { orderId: string }) => void;
  onSlaBreach?: (payload: { orderId: string }) => void;
}

export function subscribeStaffTasks(
  propertyId: string,
  handlers: StaffSocketHandlers,
): () => void {
  const s = connectStaffSocket(propertyId);
  const onNew = (t: unknown) => handlers.onTaskNew?.(t);
  const onStatus = (p: { orderId: string; status: string }) => handlers.onTaskStatus?.(p);
  const onWarn = (p: { orderId: string }) => handlers.onSlaWarning?.(p);
  const onBreach = (p: { orderId: string }) => handlers.onSlaBreach?.(p);

  s.on('task:new', onNew);
  s.on('order:status_update', onStatus);
  s.on('task:sla_warning', onWarn);
  s.on('task:sla_breach', onBreach);

  return () => {
    s.off('task:new', onNew);
    s.off('order:status_update', onStatus);
    s.off('task:sla_warning', onWarn);
    s.off('task:sla_breach', onBreach);
  };
}

export function disconnectStaffSocket(): void {
  staffSocket?.disconnect();
  staffSocket = null;
}

export interface ConciergeSocketHandlers {
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  onAssistantMessage?: (payload: {
    id?: string;
    content: string;
    actions?: Array<Record<string, unknown>>;
    suggestions?: string[];
    needs_human?: boolean;
  }) => void;
}

export function subscribeConcierge(
  reservationId: string,
  handlers: ConciergeSocketHandlers,
): () => void {
  const s = connectSocket(reservationId);
  const onStart = () => handlers.onTypingStart?.();
  const onStop = () => handlers.onTypingStop?.();
  const onMsg = (p: Parameters<NonNullable<ConciergeSocketHandlers['onAssistantMessage']>>[0]) =>
    handlers.onAssistantMessage?.(p);

  s.on('concierge:typing_start', onStart);
  s.on('concierge:typing_stop', onStop);
  s.on('concierge:message', onMsg);

  return () => {
    s.off('concierge:typing_start', onStart);
    s.off('concierge:typing_stop', onStop);
    s.off('concierge:message', onMsg);
  };
}
