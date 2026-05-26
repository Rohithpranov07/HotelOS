import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({ id: 'hotel-os' });

export const StorageKeys = {
  AccessToken: 'access_token',
  RefreshToken: 'refresh_token',
  Locale: 'locale',
} as const;
