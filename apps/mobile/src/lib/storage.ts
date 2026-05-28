import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({ id: 'hotel-os' });

export const StorageKeys = {
  AccessToken: 'access_token',
  RefreshToken: 'refresh_token',
  Locale: 'locale',
  ConciergeMessages: 'concierge_messages',
  ConciergeSessionId: 'concierge_session_id',
  ConciergeReservationId: 'concierge_reservation_id',
} as const;
