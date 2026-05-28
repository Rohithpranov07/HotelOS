// Demo fallback data so the key + check-in screens render without live services.
import type { Reservation } from '../stores/reservation.store';
import type { KeyResponse } from '../stores/key.store';

const inOneDay = new Date(Date.now() + 86_400_000);
const inFourDays = new Date(Date.now() + 4 * 86_400_000);

export const DEMO_RESERVATION: Reservation = {
  id: 'demo-reservation',
  pmsBookingRef: 'HO-DEMO',
  status: 'confirmed',
  room: {
    id: 'demo-room',
    roomNumber: '1604',
    roomType: 'Deluxe King',
    floor: 16,
    amenities: [],
  },
  checkInDate: inOneDay.toISOString().slice(0, 10),
  checkOutDate: inFourDays.toISOString().slice(0, 10),
  adults: 2,
  children: 0,
  ratePlan: 'Best Available',
  roomRate: 24000,
  totalAmount: 72000,
  paidAmount: 36000,
  balanceDue: 36000,
  mobileKeyStatus: 'pending_activation',
  isDnd: false,
  specialRequests: null,
};

export const DEMO_KEY: KeyResponse = {
  status: 'pending_activation',
  room_number: '1604',
  activates_at: inOneDay.toISOString(),
  message: 'Your key activates when you arrive at the hotel.',
};
