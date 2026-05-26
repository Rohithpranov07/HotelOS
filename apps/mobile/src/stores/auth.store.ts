import { create } from 'zustand';

interface GuestProfile {
  id: string;
  phone: string;
  fullName: string;
  loyaltyTier: string;
  loyaltyPoints: number;
}

interface AuthState {
  guest: GuestProfile | null;
  isAuthenticated: boolean;
  setGuest: (g: GuestProfile | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  guest: null,
  isAuthenticated: false,
  setGuest: (g) => set({ guest: g, isAuthenticated: g !== null }),
  reset: () => set({ guest: null, isAuthenticated: false }),
}));
