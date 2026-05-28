import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { api } from '../lib/api';
import { storage, StorageKeys } from '../lib/storage';

export interface GuestProfile {
  id: string;
  phone: string;
  fullName: string;
  email?: string;
  loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  loyaltyPoints: number;
}

export interface StaffUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  propertyId: string;
  userType: 'staff';
}

interface OtpSendResult {
  expiresInSeconds: number;
}

interface AuthState {
  guest: GuestProfile | null;
  staffUser: StaffUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  sendOtp: (phone: string) => Promise<OtpSendResult>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  staffLogin: (email: string, password: string, totpCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hydrateFromStorage: () => void;
  clearError: () => void;
}

const zustandMmkvStorage = createJSONStorage(() => ({
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
}));

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      guest: null,
      staffUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      sendOtp: async (phone) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/otp/send', { phone });
          set({ isLoading: false });
          const expiresIn =
            typeof data?.expires_in === 'number'
              ? data.expires_in
              : typeof data?.expires_in_seconds === 'number'
                ? data.expires_in_seconds
                : 60;
          return { expiresInSeconds: expiresIn };
        } catch (err) {
          const message = extractError(err, 'Failed to send OTP');
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      verifyOtp: async (phone, otp) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/otp/verify', { phone, otp });
          if (data?.access_token) {
            storage.set(StorageKeys.AccessToken, data.access_token);
          }
          if (data?.refresh_token) {
            storage.set(StorageKeys.RefreshToken, data.refresh_token);
          }
          set({
            guest: normalizeGuest(data?.guest),
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          const message = extractError(err, 'Incorrect OTP');
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      staffLogin: async (email, password, totpCode) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/staff/login', {
            email,
            password,
            ...(totpCode ? { totp_code: totpCode } : {}),
          });
          if (data?.access_token) storage.set(StorageKeys.AccessToken, data.access_token);
          if (data?.refresh_token) storage.set(StorageKeys.RefreshToken, data.refresh_token);
          const s = data?.staff ?? {};
          const staffUser: StaffUser = {
            id: String(s.id ?? ''),
            email: String(s.email ?? email),
            fullName: String(s.full_name ?? s.fullName ?? ''),
            role: String(s.role ?? 'staff'),
            propertyId: String(s.property_id ?? s.propertyId ?? ''),
            userType: 'staff',
          };
          set({
            staffUser,
            guest: null,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          const message = extractError(err, 'Login failed');
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {
          // best-effort
        }
        storage.delete(StorageKeys.AccessToken);
        storage.delete(StorageKeys.RefreshToken);
        set({ guest: null, staffUser: null, isAuthenticated: false, error: null });
      },

      refreshProfile: async () => {
        const { data } = await api.get('/guests/me');
        set({ guest: normalizeGuest(data) });
      },

      hydrateFromStorage: () => {
        const token = storage.getString(StorageKeys.AccessToken);
        if (!token) set({ isAuthenticated: false, guest: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-store',
      storage: zustandMmkvStorage,
      partialize: (s) => ({
        guest: s.guest,
        staffUser: s.staffUser,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
);

function normalizeGuest(raw: unknown): GuestProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const g = raw as Record<string, unknown>;
  return {
    id: String(g.id ?? ''),
    phone: String(g.phone ?? ''),
    fullName: String(g.full_name ?? g.fullName ?? ''),
    email: g.email ? String(g.email) : undefined,
    loyaltyTier: ((g.loyalty_tier ?? g.loyaltyTier ?? 'BRONZE') as GuestProfile['loyaltyTier']),
    loyaltyPoints: Number(g.loyalty_points ?? g.loyaltyPoints ?? 0),
  };
}

function extractError(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err && 'response' in err) {
    const res = (err as { response?: { data?: { error?: { message?: string } } } }).response;
    const msg = res?.data?.error?.message;
    if (msg) return msg;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
