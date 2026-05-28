// Room-service catalogue — the non-dining requests a guest can summon to the
// suite. Each item maps to an orders-service OrderType so requests flow through
// the same SLA + assignment engine as F&B orders.
import type { Ionicons } from '@expo/vector-icons';

export type ServiceOrderType =
  | 'laundry'
  | 'housekeeping'
  | 'maintenance'
  | 'amenity'
  | 'beverage';

export type ServiceTone = 'amber' | 'bronze' | 'ink' | 'ivory';

export interface ServiceItem {
  id: string;
  name: string;
  /** Compact label for tight surfaces like the "Most summoned" rail. */
  short?: string;
  desc: string;
  /** 0 = complimentary, on the house. */
  price: number;
  etaMinutes: number;
  type: ServiceOrderType;
  icon: keyof typeof Ionicons.glyphMap;
}

export interface ServiceCategory {
  key: string;
  kicker: string;
  title: string;
  tagline: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: ServiceTone;
  items: ServiceItem[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    key: 'laundry',
    kicker: 'Valet',
    title: 'Laundry & Pressing',
    tagline: 'Collected from your suite, returned within the day.',
    icon: 'shirt-outline',
    tone: 'bronze',
    items: [
      {
        id: 'svc-laundry-wash',
        name: 'Wash & fold',
        desc: 'Same-day laundering, pressed and returned by 18:00.',
        price: 1200,
        etaMinutes: 240,
        type: 'laundry',
        icon: 'shirt-outline',
      },
      {
        id: 'svc-laundry-dryclean',
        name: 'Dry cleaning',
        desc: 'Delicate garments, suits and eveningwear.',
        price: 1800,
        etaMinutes: 300,
        type: 'laundry',
        icon: 'glasses-outline',
      },
      {
        id: 'svc-laundry-press',
        name: 'Express press',
        short: 'Express press',
        desc: 'A single garment, steamed and returned within the hour.',
        price: 600,
        etaMinutes: 45,
        type: 'laundry',
        icon: 'thermometer-outline',
      },
      {
        id: 'svc-laundry-shoe',
        name: 'Shoe shine',
        desc: 'Leather cleaned, conditioned and buffed.',
        price: 500,
        etaMinutes: 90,
        type: 'laundry',
        icon: 'footsteps-outline',
      },
    ],
  },
  {
    key: 'maintenance',
    kicker: 'Engineering',
    title: 'Maintenance & Technical Support',
    tagline: 'An engineer at your door, quietly and quickly.',
    icon: 'construct-outline',
    tone: 'ink',
    items: [
      {
        id: 'svc-maint-climate',
        name: 'Climate & air conditioning',
        short: 'Climate control',
        desc: 'Temperature, airflow or thermostat not behaving.',
        price: 0,
        etaMinutes: 20,
        type: 'maintenance',
        icon: 'snow-outline',
      },
      {
        id: 'svc-maint-lighting',
        name: 'Lighting & electrical',
        desc: 'A bulb, switch or outlet that needs attention.',
        price: 0,
        etaMinutes: 20,
        type: 'maintenance',
        icon: 'bulb-outline',
      },
      {
        id: 'svc-maint-plumbing',
        name: 'Plumbing & bath',
        desc: 'Water pressure, drainage or fixtures.',
        price: 0,
        etaMinutes: 25,
        type: 'maintenance',
        icon: 'water-outline',
      },
      {
        id: 'svc-maint-tech',
        name: 'TV, Wi-Fi & devices',
        desc: 'Connectivity, the in-suite tablet or entertainment.',
        price: 0,
        etaMinutes: 15,
        type: 'maintenance',
        icon: 'wifi-outline',
      },
      {
        id: 'svc-maint-safe',
        name: 'In-room safe reset',
        desc: 'Locked out of the safe — we will reset it for you.',
        price: 0,
        etaMinutes: 15,
        type: 'maintenance',
        icon: 'lock-closed-outline',
      },
    ],
  },
  {
    key: 'wellness',
    kicker: 'The spa, in-suite',
    title: 'Wellness & Personal Care',
    tagline: 'Stillness, brought to your room.',
    icon: 'flower-outline',
    tone: 'amber',
    items: [
      {
        id: 'svc-well-massage',
        name: 'In-suite massage',
        short: 'Massage',
        desc: '60 minutes — Swedish, deep tissue or aromatherapy.',
        price: 6500,
        etaMinutes: 40,
        type: 'amenity',
        icon: 'hand-left-outline',
      },
      {
        id: 'svc-well-yoga',
        name: 'Yoga & meditation kit',
        desc: 'Mat, blocks and a guided session on the tablet.',
        price: 0,
        etaMinutes: 20,
        type: 'amenity',
        icon: 'leaf-outline',
      },
      {
        id: 'svc-well-pillow',
        name: 'Pillow menu',
        desc: 'Buckwheat, down, memory foam or cooling gel.',
        price: 0,
        etaMinutes: 25,
        type: 'amenity',
        icon: 'moon-outline',
      },
      {
        id: 'svc-well-toiletry',
        name: 'Toiletry & grooming kit',
        desc: 'Razor, dental, comb or a forgotten essential.',
        price: 0,
        etaMinutes: 15,
        type: 'amenity',
        icon: 'cut-outline',
      },
    ],
  },
  {
    key: 'amenities',
    kicker: 'Comforts',
    title: 'Amenities & In-Suite Comforts',
    tagline: 'The small things, brought without asking twice.',
    icon: 'gift-outline',
    tone: 'ivory',
    items: [
      {
        id: 'svc-amen-pillows',
        name: 'Extra pillows & blankets',
        desc: 'Additional bedding, brought to your suite.',
        price: 0,
        etaMinutes: 15,
        type: 'amenity',
        icon: 'bed-outline',
      },
      {
        id: 'svc-amen-robe',
        name: 'Robe & slippers',
        desc: 'A fresh set in your size.',
        price: 0,
        etaMinutes: 20,
        type: 'amenity',
        icon: 'body-outline',
      },
      {
        id: 'svc-amen-charger',
        name: 'Charger & adapter',
        short: 'Charger',
        desc: 'USB-C, Lightning or a universal travel adapter.',
        price: 0,
        etaMinutes: 15,
        type: 'amenity',
        icon: 'battery-charging-outline',
      },
      {
        id: 'svc-amen-water',
        name: 'Still & sparkling water',
        short: 'Sparkling water',
        desc: 'Two bottles, chilled and delivered.',
        price: 0,
        etaMinutes: 15,
        type: 'amenity',
        icon: 'wine-outline',
      },
      {
        id: 'svc-amen-minibar',
        name: 'Mini-bar restock',
        desc: 'Replenish the in-suite bar to full.',
        price: 0,
        etaMinutes: 30,
        type: 'amenity',
        icon: 'beer-outline',
      },
    ],
  },
  {
    key: 'housekeeping',
    kicker: 'Housekeeping',
    title: 'Housekeeping & Linen',
    tagline: 'A refreshed room, on your schedule.',
    icon: 'sparkles-outline',
    tone: 'bronze',
    items: [
      {
        id: 'svc-house-refresh',
        name: 'Room refresh',
        desc: 'A light tidy, fresh towels and turndown.',
        price: 0,
        etaMinutes: 30,
        type: 'housekeeping',
        icon: 'sparkles-outline',
      },
      {
        id: 'svc-house-linen',
        name: 'Fresh linens',
        desc: 'Full bed change with crisp, pressed sheets.',
        price: 0,
        etaMinutes: 35,
        type: 'housekeeping',
        icon: 'bed-outline',
      },
      {
        id: 'svc-house-towels',
        name: 'Extra towels',
        short: 'Extra towels',
        desc: 'Additional bath and hand towels.',
        price: 0,
        etaMinutes: 15,
        type: 'housekeeping',
        icon: 'browsers-outline',
      },
      {
        id: 'svc-house-turndown',
        name: 'Turndown service',
        desc: 'Evening turndown with the lights set low.',
        price: 0,
        etaMinutes: 25,
        type: 'housekeeping',
        icon: 'moon-outline',
      },
    ],
  },
];

// A curated set surfaced in the "Most summoned" rail at the top of the screen.
export const QUICK_SUMMON_IDS = [
  'svc-amen-water',
  'svc-house-towels',
  'svc-maint-climate',
  'svc-well-massage',
  'svc-laundry-press',
  'svc-amen-charger',
] as const;

export const ALL_SERVICES: ServiceItem[] = SERVICE_CATEGORIES.flatMap((c) => c.items);

export function serviceById(id: string): ServiceItem | undefined {
  return ALL_SERVICES.find((s) => s.id === id);
}
