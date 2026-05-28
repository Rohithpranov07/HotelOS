import { create } from 'zustand';
import type { IdDocumentType, OcrResult } from '../lib/ocr';
import { bookingApi } from '../lib/api';

export type PillowType = 'soft' | 'medium' | 'firm';
export type FloorPreference = 'high' | 'low' | 'none';

export interface CheckinPreferences {
  roomTempCelsius: number;
  pillowType: PillowType;
  floorPreference: FloorPreference;
  dietary: string[];
  specialNotes: string;
  earlyCheckinRequest: boolean;
}

export interface CheckinIdState extends OcrResult {
  documentType: IdDocumentType;
}

interface CheckinState {
  step: 1 | 2 | 3;
  id: CheckinIdState | null;
  preferences: CheckinPreferences;
  isSubmitting: boolean;
  error: string | null;
  result: { mobileKeyStatus: string; roomNumber: string | null } | null;

  setStep: (step: 1 | 2 | 3) => void;
  next: () => void;
  back: () => void;
  setId: (id: CheckinIdState) => void;
  updatePreferences: (patch: Partial<CheckinPreferences>) => void;
  submit: (reservationId: string) => Promise<boolean>;
  reset: () => void;
}

const DEFAULT_PREFS: CheckinPreferences = {
  roomTempCelsius: 22,
  pillowType: 'medium',
  floorPreference: 'none',
  dietary: [],
  specialNotes: '',
  earlyCheckinRequest: false,
};

export const useCheckinStore = create<CheckinState>((set, get) => ({
  step: 1,
  id: null,
  preferences: DEFAULT_PREFS,
  isSubmitting: false,
  error: null,
  result: null,

  setStep: (step) => set({ step }),
  next: () => set((s) => ({ step: (Math.min(3, s.step + 1) as 1 | 2 | 3) })),
  back: () => set((s) => ({ step: (Math.max(1, s.step - 1) as 1 | 2 | 3) })),

  setId: (id) => set({ id }),
  updatePreferences: (patch) =>
    set((s) => ({ preferences: { ...s.preferences, ...patch } })),

  submit: async (reservationId) => {
    const { id, preferences } = get();
    if (!id) {
      set({ error: 'ID scan missing' });
      return false;
    }
    set({ isSubmitting: true, error: null });
    try {
      const body = {
        id_scan: {
          document_type: id.documentType,
          full_name: id.full_name,
          date_of_birth: id.date_of_birth,
          document_number_hash: id.document_number_hash,
        },
        preferences: {
          room_temp_celsius: preferences.roomTempCelsius,
          pillow_type: preferences.pillowType,
          floor_preference: preferences.floorPreference,
          early_checkin_request: preferences.earlyCheckinRequest,
          special_notes: preferences.specialNotes
            ? [preferences.specialNotes, ...preferences.dietary.map((d) => `diet:${d}`)].join(' · ')
            : preferences.dietary.length
              ? preferences.dietary.map((d) => `diet:${d}`).join(' · ')
              : undefined,
        },
      };
      const { data } = await bookingApi.post<{
        success: boolean;
        mobile_key_status: string;
        room_assigned: { id: string; roomNumber: string } | null;
      }>(`/reservations/${reservationId}/pre-checkin`, body);
      set({
        isSubmitting: false,
        result: {
          mobileKeyStatus: data.mobile_key_status,
          roomNumber: data.room_assigned?.roomNumber ?? null,
        },
      });
      return true;
    } catch (err) {
      set({
        isSubmitting: false,
        error: err instanceof Error ? err.message : 'Pre-checkin failed',
      });
      return false;
    }
  },

  reset: () =>
    set({
      step: 1,
      id: null,
      preferences: DEFAULT_PREFS,
      isSubmitting: false,
      error: null,
      result: null,
    }),
}));
