import { create } from 'zustand';
import { bookingApi } from '../lib/api';

export type ReservationStatus =
  | 'confirmed'
  | 'pre_checked_in'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show';

export interface ReservationRoom {
  id: string;
  roomNumber: string;
  roomType: string;
  floor: number | null;
  amenities: string[];
}

export interface Reservation {
  id: string;
  pmsBookingRef: string | null;
  status: ReservationStatus;
  room: ReservationRoom | null;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  ratePlan: string | null;
  roomRate: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  mobileKeyStatus: string | null;
  isDnd: boolean;
  specialRequests: string | null;
}

export type FolioLineItem = {
  id: string;
  description: string;
  type: 'room' | 'food' | 'laundry' | 'amenity' | 'other';
  amount: number;
  date: string;
  order_id?: string;
};

export interface FolioResponse {
  reservation_id: string;
  guest_name: string;
  room_number: string | null;
  check_in: string;
  check_out: string;
  line_items: FolioLineItem[];
  subtotals: { room: number; fnb: number; other: number };
  total_amount: number;
  paid_amount: number;
  balance_due: number;
}

interface ReservationState {
  reservation: Reservation | null;
  folio: FolioResponse | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  fetchActiveReservation: (opts?: { force?: boolean }) => Promise<void>;
  fetchFolio: (reservationId: string) => Promise<void>;
  updateDnd: (enabled: boolean) => Promise<void>;
  markSettled: () => void;
  reset: () => void;
}

const FRESH_MS = 5 * 60 * 1000;

export const useReservationStore = create<ReservationState>((set, get) => ({
  reservation: null,
  folio: null,
  isLoading: false,
  error: null,
  lastFetched: null,

  fetchActiveReservation: async (opts) => {
    const { lastFetched, isLoading } = get();
    if (isLoading) return;
    if (
      !opts?.force &&
      lastFetched &&
      Date.now() - lastFetched < FRESH_MS &&
      get().reservation !== null
    ) {
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const { data } = await bookingApi.get<Reservation | null>('/reservations/active');
      set({ reservation: data ?? null, isLoading: false, lastFetched: Date.now() });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load reservation',
      });
    }
  },

  fetchFolio: async (reservationId) => {
    try {
      const { data } = await bookingApi.get<FolioResponse>(
        `/reservations/${reservationId}/folio`,
      );
      set({ folio: data });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load folio' });
    }
  },

  updateDnd: async (enabled) => {
    const res = get().reservation;
    if (!res) return;
    // Local-first: keep the optimistic update even if the backend is unreachable
    // (demo / offline), so the toggle stays responsive. We don't roll back.
    set({ reservation: { ...res, isDnd: enabled } });
    try {
      await bookingApi.patch(`/reservations/${res.id}/dnd`, { enabled });
    } catch {
      // Backend not reachable — the optimistic state stands.
    }
  },

  markSettled: () => {
    const { reservation, folio } = get();
    if (reservation) {
      set({
        reservation: {
          ...reservation,
          paidAmount: reservation.totalAmount,
          balanceDue: 0,
        },
      });
    }
    if (folio) {
      set({
        folio: { ...folio, paid_amount: folio.total_amount, balance_due: 0 },
      });
    }
  },

  reset: () =>
    set({ reservation: null, folio: null, isLoading: false, error: null, lastFetched: null }),
}));
