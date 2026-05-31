// Demo fallback data so the key + check-in screens render without live services.
import type { Reservation } from '../stores/reservation.store';
import type { KeyResponse } from '../stores/key.store';
import type { GuestProfile } from '../stores/auth.store';

const inOneDay = new Date(Date.now() + 86_400_000);
const inFourDays = new Date(Date.now() + 4 * 86_400_000);

export const DEMO_GUEST: GuestProfile = {
  id: 'demo-guest',
  phone: '',
  fullName: 'Arjun Mehta',
  email: 'arjun.mehta@example.com',
  loyaltyTier: 'GOLD',
  loyaltyPoints: 4800,
};

export const DEMO_RESERVATION: Reservation = {
  id: 'demo-reservation',
  pmsBookingRef: 'HKI-2026-0042',
  status: 'confirmed',
  room: {
    id: 'demo-room',
    roomNumber: '215',
    roomType: 'Deluxe Double',
    floor: 2,
    amenities: [],
  },
  checkInDate: inOneDay.toISOString().slice(0, 10),
  checkOutDate: inFourDays.toISOString().slice(0, 10),
  adults: 2,
  children: 0,
  ratePlan: 'Best Available',
  roomRate: 6250,
  totalAmount: 18750,
  paidAmount: 9375,
  balanceDue: 9375,
  mobileKeyStatus: 'pending_activation',
  isDnd: false,
  specialRequests: null,
};

export const DEMO_KEY: KeyResponse = {
  status: 'pending_activation',
  room_number: '215',
  activates_at: inOneDay.toISOString(),
  message: 'Your key activates when you arrive at the hotel.',
};
