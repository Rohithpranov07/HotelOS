import { create } from 'zustand';
import { accessApi } from '../lib/api';
import { unlockWithBle, MockBleUnlock } from '../lib/ble';

export type KeyStatus = 'active' | 'pending_activation' | 'revoked' | 'not_applicable';
export type UnlockStatus =
  | 'idle'
  | 'scanning'
  | 'connecting'
  | 'unlocking'
  | 'success'
  | 'error';

export interface KeyResponse {
  status: KeyStatus;
  key_token?: string;
  room_number?: string;
  lock_device_id?: string;
  lock_type?: string;
  valid_from?: string;
  valid_until?: string;
  activates_at?: string;
  message?: string;
}

interface KeyState {
  keyData: KeyResponse | null;
  unlockStatus: UnlockStatus;
  error: string | null;
  lastFetched: number | null;

  fetchKey: (reservationId: string) => Promise<void>;
  unlockDoor: () => Promise<void>;
  resetUnlock: () => void;
  reset: () => void;
}

const USE_MOCK_BLE = (process.env.EXPO_PUBLIC_BLE_MOCK ?? 'true') !== 'false';

export const useKeyStore = create<KeyState>((set, get) => ({
  keyData: null,
  unlockStatus: 'idle',
  error: null,
  lastFetched: null,

  fetchKey: async (reservationId) => {
    try {
      const { data } = await accessApi.get<KeyResponse>(
        `/reservations/${reservationId}/key`,
      );
      set({ keyData: data, lastFetched: Date.now(), error: null });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load key',
        keyData: { status: 'not_applicable' },
      });
    }
  },

  unlockDoor: async () => {
    const key = get().keyData;
    if (!key || key.status !== 'active' || !key.key_token) {
      set({ unlockStatus: 'error', error: 'Key not active' });
      return;
    }
    set({ unlockStatus: 'scanning', error: null });
    try {
      if (USE_MOCK_BLE || !key.lock_device_id) {
        set({ unlockStatus: 'connecting' });
        await MockBleUnlock(key.key_token);
        set({ unlockStatus: 'success' });
      } else {
        set({ unlockStatus: 'connecting' });
        await unlockWithBle(key.key_token, key.lock_device_id);
        set({ unlockStatus: 'success' });
      }
    } catch (err) {
      set({
        unlockStatus: 'error',
        error: err instanceof Error ? err.message : 'Could not connect to lock',
      });
    }
  },

  resetUnlock: () => set({ unlockStatus: 'idle', error: null }),

  reset: () =>
    set({ keyData: null, unlockStatus: 'idle', error: null, lastFetched: null }),
}));
