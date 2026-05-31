import { create } from 'zustand';
import type { Ionicons } from '@expo/vector-icons';
import { bookingApi, ordersApi } from '../lib/api';
import { resolveAsset } from '../lib/assetMap';

/* ─── Housekeeping catalog ─────────────────────────────────────── */
export type HkServiceType = 'housekeeping' | 'amenity' | 'spa' | 'recreation';

export type HkIconName = keyof typeof Ionicons.glyphMap;

export interface HkService {
  id: string;
  name: string;
  desc: string;
  icon: HkIconName;
  etaMinutes: number;
  price: number;
  type: HkServiceType;
  image?: number;
}

export interface HousekeepingCatalog {
  featured: HkService;
  now: HkService[];
  comforts: HkService[];
  spaFeatured: HkService;
  spa: HkService[];
  recreation: HkService[];
}

function hkFromApi(raw: Record<string, unknown>): HkService {
  return {
    id: String(raw.id),
    name: String(raw.name),
    desc: String(raw.desc),
    // The API returns an Ionicons glyph name; the catalog is curated, so we
    // trust the string and surface it as the typed icon key.
    icon: String(raw.icon) as HkIconName,
    etaMinutes: Number(raw.eta_minutes ?? 0),
    price: Number(raw.price ?? 0),
    type: (raw.type as HkServiceType) ?? 'housekeeping',
    image: resolveAsset(raw.image_key as string | undefined),
  };
}

/* ─── Attractions ──────────────────────────────────────────────── */
export interface Attraction {
  id: string;
  categories: string[];
  name: string;
  subtitle: string;
  whyVisit: string;
  lat: number;
  lng: number;
  rating: string;
  ratingCount: string;
  gradA: string;
  gradB: string;
  gradC: string;
  icon: string;
  backgroundImage?: number;
}

function attractionFromApi(raw: Record<string, unknown>): Attraction {
  return {
    id: String(raw.id),
    categories: Array.isArray(raw.categories) ? (raw.categories as string[]) : [],
    name: String(raw.name),
    subtitle: String(raw.subtitle ?? ''),
    whyVisit: String(raw.why_visit ?? ''),
    lat: Number(raw.lat ?? 0),
    lng: Number(raw.lng ?? 0),
    rating: String(raw.rating ?? ''),
    ratingCount: String(raw.rating_count ?? ''),
    gradA: String(raw.grad_a ?? '#0A1620'),
    gradB: String(raw.grad_b ?? '#14283A'),
    gradC: String(raw.grad_c ?? 'rgba(70,130,180,0.5)'),
    icon: String(raw.icon ?? 'compass-outline'),
    backgroundImage: resolveAsset(raw.image_key as string | undefined),
  };
}

/* ─── Rooms catalog ────────────────────────────────────────────── */
export interface RoomFacility { icon: string; label: string }
export interface RoomCatalogItem {
  id: string;
  name: string;
  category: string;
  description: string;
  sizeSqFt: number;
  bedType: string;
  maxGuests: number;
  view: string;
  priceFrom: number;
  gradA: string;
  gradB: string;
  gradC: string;
  icon: string;
  highlights: string[];
  facilities: RoomFacility[];
  images: number[];
  imageCount: number;
}

function roomFromApi(raw: Record<string, unknown>): RoomCatalogItem {
  const imageKeys = (raw.image_keys as string[] | undefined) ?? [];
  const images = imageKeys
    .map((k) => resolveAsset(k))
    .filter((n): n is number => typeof n === 'number');
  return {
    id: String(raw.id),
    name: String(raw.name),
    category: String(raw.category),
    description: String(raw.description),
    sizeSqFt: Number(raw.size_sqft ?? 0),
    bedType: String(raw.bed_type),
    maxGuests: Number(raw.max_guests ?? 2),
    view: String(raw.view),
    priceFrom: Number(raw.price_from ?? 0),
    gradA: String(raw.grad_a),
    gradB: String(raw.grad_b),
    gradC: String(raw.grad_c),
    icon: String(raw.icon),
    highlights: Array.isArray(raw.highlights) ? (raw.highlights as string[]) : [],
    facilities: Array.isArray(raw.facilities) ? (raw.facilities as RoomFacility[]) : [],
    images,
    imageCount: images.length,
  };
}

/* ─── Past stays ───────────────────────────────────────────────── */
export interface PastStay {
  id: string;
  room: string;
  dates: string;
  nights: number;
  spend: number;
}

/* ─── Store ────────────────────────────────────────────────────── */
interface ContentState {
  housekeeping: HousekeepingCatalog | null;
  attractions: Attraction[] | null;
  rooms: RoomCatalogItem[] | null;
  pastStays: PastStay[] | null;
  fetchHousekeeping: () => Promise<void>;
  fetchAttractions: () => Promise<void>;
  fetchRooms: () => Promise<void>;
  fetchPastStays: () => Promise<void>;
}

export const useContentStore = create<ContentState>((set, get) => ({
  housekeeping: null,
  attractions: null,
  rooms: null,
  pastStays: null,

  fetchHousekeeping: async () => {
    if (get().housekeeping) return;
    try {
      const { data } = await ordersApi.get('/housekeeping/services');
      set({
        housekeeping: {
          featured: hkFromApi(data.featured),
          now: (data.now ?? []).map(hkFromApi),
          comforts: (data.comforts ?? []).map(hkFromApi),
          spaFeatured: hkFromApi(data.spa_featured),
          spa: (data.spa ?? []).map(hkFromApi),
          recreation: (data.recreation ?? []).map(hkFromApi),
        },
      });
    } catch {
      // demo fallback handled by the screen if state stays null
    }
  },

  fetchAttractions: async () => {
    if (get().attractions) return;
    try {
      const { data } = await bookingApi.get('/content/attractions');
      const items = (data?.data ?? []).map(attractionFromApi);
      set({ attractions: items });
    } catch {
      /* demo fallback */
    }
  },

  fetchRooms: async () => {
    if (get().rooms) return;
    try {
      const { data } = await bookingApi.get('/content/rooms');
      const items = (data?.data ?? []).map(roomFromApi);
      set({ rooms: items });
    } catch {
      /* demo fallback */
    }
  },

  fetchPastStays: async () => {
    try {
      const { data } = await bookingApi.get('/reservations/history');
      const items: PastStay[] = (data?.data ?? []).map((r: Record<string, unknown>) => ({
        id: String(r.id),
        room: String(r.room),
        dates: String(r.dates),
        nights: Number(r.nights ?? 1),
        spend: Number(r.spend ?? 0),
      }));
      set({ pastStays: items });
    } catch {
      /* demo fallback */
    }
  },
}));
