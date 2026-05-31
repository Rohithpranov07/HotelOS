import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({ id: 'hotel-os' });

export const StorageKeys = {
  AccessToken: 'access_token',
  RefreshToken: 'refresh_token',
  Locale: 'locale',
  ConciergeMessages: 'concierge_messages',
  ConciergeSessionId: 'concierge_session_id',
  ConciergeReservationId: 'concierge_reservation_id',
  ConciergeVersion: 'concierge_version',
} as const;

// Bump this string whenever the greeting or message schema changes.
// Any stored data with a different version is discarded and regenerated.
export const CONCIERGE_STORE_VERSION = 'hki-v3';
