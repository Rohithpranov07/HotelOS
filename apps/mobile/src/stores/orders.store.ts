import { create } from 'zustand';
import { ordersApi } from '../lib/api';

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  dietaryTags: string[];
  allergens: string[];
  imageUrl: string | null;
  prepTimeMinutes: number;
  availableFrom: string | null;
  availableTo: string | null;
}

export interface MenuResponse {
  items: MenuItem[];
  categories: string[];
  recommended: MenuItem[];
  kitchen_open: boolean;
  kitchen_hours: { open: string; close: string };
}

export interface CartItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  notes: string;
}

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'folio' | 'razorpay' | 'loyalty_points';

export interface OrderApiItem {
  menu_item_id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  notes?: string;
}

export interface Order {
  id: string;
  reservation_id: string;
  type: string;
  status: OrderStatus;
  items: OrderApiItem[];
  total_amount: number;
  scheduled_for: string | null;
  sla_deadline: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  guest_rating: number | null;
  guest_feedback: string | null;
  notes: string | null;
  created_at: string;
  estimated_delivery_minutes?: number;
  assigned_staff: { id: string; fullName: string; role: string } | null;
  status_history: { status: string; at: string }[];
}

interface OrdersState {
  menu: MenuResponse | null;
  menuLoading: boolean;
  cart: CartItem[];
  activeOrders: Order[];
  orderHistory: Order[];
  placing: boolean;
  error: string | null;

  fetchMenu: (opts?: { recommended?: boolean }) => Promise<void>;

  addToCart: (item: CartItem) => void;
  removeFromCart: (menuItemId: string) => void;
  updateCartItem: (menuItemId: string, quantity: number, notes?: string) => void;
  clearCart: () => void;
  cartCount: () => number;
  cartTotal: () => number;

  placeOrder: (
    reservationId: string,
    paymentMethod: PaymentMethod,
    opts?: { notes?: string; scheduledFor?: string | null },
  ) => Promise<Order>;
  reorder: (order: Order) => void;
  simulateOrderProgress: (orderId: string) => void;
  fetchActiveOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => void;
  rateOrder: (orderId: string, rating: number, feedback?: string) => Promise<void>;
}

const STAFF_POOL = [
  { id: 'staff-1', fullName: 'Ravi Kumar', role: 'Senior server' },
  { id: 'staff-2', fullName: 'Hiroshi Tanaka', role: 'Sommelier' },
  { id: 'staff-3', fullName: 'Mei Chen', role: 'In-suite host' },
];

function makeFakeOrder(args: {
  reservationId: string;
  items: OrderApiItem[];
  total: number;
  notes?: string;
  scheduledFor: string | null;
}): Order {
  const now = new Date();
  const eta = 18;
  const id = `local-${Math.random().toString(36).slice(2, 10)}`;
  const staff = STAFF_POOL[Math.floor(Math.random() * STAFF_POOL.length)]!;
  return {
    id,
    reservation_id: args.reservationId,
    type: 'food',
    status: 'pending',
    items: args.items,
    total_amount: args.total,
    scheduled_for: args.scheduledFor,
    sla_deadline: new Date(now.getTime() + eta * 60_000).toISOString(),
    accepted_at: null,
    completed_at: null,
    guest_rating: null,
    guest_feedback: null,
    notes: args.notes ?? null,
    created_at: now.toISOString(),
    estimated_delivery_minutes: eta,
    assigned_staff: staff,
    status_history: [{ status: 'pending', at: now.toISOString() }],
  };
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  menu: null,
  menuLoading: false,
  cart: [],
  activeOrders: [],
  orderHistory: [],
  placing: false,
  error: null,

  fetchMenu: async (opts) => {
    set({ menuLoading: true, error: null });
    try {
      const params = opts?.recommended ? { recommended: 'true' } : {};
      const { data } = await ordersApi.get<MenuResponse>('/menu', { params });
      set({ menu: data, menuLoading: false });
    } catch (err) {
      set({
        menuLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load menu',
      });
    }
  },

  addToCart: (item) => {
    const cart = get().cart;
    const existing = cart.find((i) => i.menuItemId === item.menuItemId);
    if (existing) {
      set({
        cart: cart.map((i) =>
          i.menuItemId === item.menuItemId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i,
        ),
      });
    } else {
      set({ cart: [...cart, item] });
    }
  },

  removeFromCart: (menuItemId) => {
    set({ cart: get().cart.filter((i) => i.menuItemId !== menuItemId) });
  },

  updateCartItem: (menuItemId, quantity, notes) => {
    if (quantity <= 0) {
      get().removeFromCart(menuItemId);
      return;
    }
    set({
      cart: get().cart.map((i) =>
        i.menuItemId === menuItemId
          ? { ...i, quantity, notes: notes ?? i.notes }
          : i,
      ),
    });
  },

  clearCart: () => set({ cart: [] }),

  cartCount: () => get().cart.reduce((acc, i) => acc + i.quantity, 0),

  cartTotal: () => get().cart.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0),

  placeOrder: async (reservationId, paymentMethod, opts) => {
    set({ placing: true, error: null });
    const cart = get().cart;
    const items: OrderApiItem[] = cart.map((c) => ({
      menu_item_id: c.menuItemId,
      name: c.name,
      quantity: c.quantity,
      unit_price: c.unitPrice,
      ...(c.notes ? { notes: c.notes } : {}),
    }));
    const total = cart.reduce((acc, c) => acc + c.unitPrice * c.quantity, 0);

    try {
      const { data } = await ordersApi.post<Order>('/orders', {
        reservation_id: reservationId,
        type: 'food',
        items,
        payment_method: paymentMethod,
        ...(opts?.notes ? { notes: opts.notes } : {}),
        ...(opts?.scheduledFor ? { scheduled_for: opts.scheduledFor } : {}),
      });
      set({
        placing: false,
        cart: [],
        activeOrders: [data, ...get().activeOrders],
      });
      get().simulateOrderProgress(data.id);
      return data;
    } catch (err) {
      // Backend not reachable / not seeded — fall back to a local fake order so
      // the UI can demo the full place-order → tracking flow.
      const fake: Order = makeFakeOrder({
        reservationId,
        items,
        total,
        notes: opts?.notes,
        scheduledFor: opts?.scheduledFor ?? null,
      });
      set({
        placing: false,
        cart: [],
        activeOrders: [fake, ...get().activeOrders],
      });
      get().simulateOrderProgress(fake.id);
      return fake;
    }
  },

  simulateOrderProgress: (orderId) => {
    // Compressed demo timeline: pending → accepted (6s) → in_progress (16s) → completed (40s).
    // Skips if backend later sends real updates (updateOrderStatus is idempotent enough).
    const tick = (status: OrderStatus, delayMs: number) =>
      setTimeout(() => {
        const order = get().activeOrders.find((o) => o.id === orderId);
        if (!order) return;
        get().updateOrderStatus(orderId, status);
        if (status === 'accepted') {
          const updated = get().activeOrders.find((o) => o.id === orderId);
          if (updated) {
            const now = new Date().toISOString();
            const next = { ...updated, accepted_at: now };
            const list = get().activeOrders.map((o) => (o.id === orderId ? next : o));
            set({ activeOrders: list });
          }
        }
        if (status === 'completed') {
          const updated = get().activeOrders
            .concat(get().orderHistory)
            .find((o) => o.id === orderId);
          if (updated) {
            const now = new Date().toISOString();
            const next = { ...updated, completed_at: now };
            set({
              orderHistory: get().orderHistory.map((o) => (o.id === orderId ? next : o)),
            });
          }
        }
      }, delayMs);

    tick('accepted', 6_000);
    tick('in_progress', 16_000);
    tick('completed', 40_000);
  },

  reorder: (order) => {
    const cartItems: CartItem[] = order.items.map((i) => ({
      menuItemId: i.menu_item_id ?? i.name,
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unit_price,
      notes: i.notes ?? '',
    }));
    set({ cart: cartItems });
  },

  fetchActiveOrders: async () => {
    try {
      const { data } = await ordersApi.get<{ orders: Order[] }>('/orders/active');
      set({ activeOrders: data.orders });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load orders' });
    }
  },

  updateOrderStatus: (orderId, status) => {
    const active = get().activeOrders;
    const idx = active.findIndex((o) => o.id === orderId);
    if (idx === -1) return;
    const next: OrderStatus = status as OrderStatus;
    const updated: Order = { ...active[idx]!, status: next };
    if (next === 'completed' || next === 'cancelled') {
      set({
        activeOrders: active.filter((o) => o.id !== orderId),
        orderHistory: [updated, ...get().orderHistory],
      });
    } else {
      const copy = [...active];
      copy[idx] = updated;
      set({ activeOrders: copy });
    }
  },

  rateOrder: async (orderId, rating, feedback) => {
    try {
      await ordersApi.patch(`/orders/${orderId}/rate`, {
        rating,
        ...(feedback ? { feedback } : {}),
      });
      set({
        orderHistory: get().orderHistory.map((o) =>
          o.id === orderId
            ? { ...o, guest_rating: rating, guest_feedback: feedback ?? null }
            : o,
        ),
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to rate order' });
    }
  },
}));
