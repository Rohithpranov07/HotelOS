// Room-service catalogue — the non-dining requests a guest can summon to the
// suite. Each item maps to an orders-service OrderType so requests flow through
// the same SLA + assignment engine as F&B orders.
import type { Ionicons } from '@expo/vector-icons';

export type ServiceOrderType =
  | 'laundry'
  | 'housekeeping'
  | 'maintenance'
  | 'amenity'
  | 'beverage'
  | 'transfer'
  | 'medical'
  | 'experience';

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
        name: 'Heater & climate',
        short: 'Heater',
        desc: 'Room heater, geyser or thermostat not behaving.',
        price: 0,
        etaMinutes: 20,
        type: 'maintenance',
        icon: 'thermometer-outline',
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
        id: 'svc-well-sauna',
        name: 'Steam & sauna',
        short: 'Sauna',
        desc: 'Reserve a slot at the spa — steam, sauna and a cold plunge.',
        price: 2200,
        etaMinutes: 30,
        type: 'amenity',
        icon: 'water-outline',
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
        id: 'svc-amen-hotbev',
        name: 'Hot tea or coffee',
        short: 'Tea / coffee',
        desc: 'Filter coffee, masala chai or cardamom tea — sent up warm.',
        price: 0,
        etaMinutes: 15,
        type: 'amenity',
        icon: 'cafe-outline',
      },
      {
        id: 'svc-amen-blanket',
        name: 'Extra heater & blanket',
        short: 'Heater',
        desc: 'A second blanket and the room heater turned up.',
        price: 0,
        etaMinutes: 15,
        type: 'amenity',
        icon: 'flame-outline',
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
  {
    key: 'transfers',
    kicker: 'Transfers',
    title: 'Transfers & Shuttle',
    tagline: 'A car at the porch, whenever you need to move.',
    icon: 'car-outline',
    tone: 'ink',
    items: [
      {
        id: 'svc-transfer-airport',
        name: 'Madurai airport transfer',
        short: 'Airport car',
        desc: 'Private sedan to MAA airport — approx. 3h via Dindigul.',
        price: 4500,
        etaMinutes: 30,
        type: 'transfer',
        icon: 'airplane-outline',
      },
      {
        id: 'svc-transfer-shuttle',
        name: 'In-town shuttle',
        short: 'Shuttle',
        desc: 'Drop to the lake, Coaker’s Walk or Bryant Park.',
        price: 0,
        etaMinutes: 15,
        type: 'transfer',
        icon: 'bus-outline',
      },
      {
        id: 'svc-transfer-sightseeing',
        name: 'Sightseeing cab',
        short: 'Sightseeing',
        desc: 'Half-day chauffeured loop — Pillar Rocks, Berijam, viewpoints.',
        price: 3200,
        etaMinutes: 30,
        type: 'transfer',
        icon: 'navigate-outline',
      },
    ],
  },
  {
    key: 'medical',
    kicker: 'On call',
    title: 'Doctor & Medical',
    tagline: 'Our in-house medical centre is on premise, day and night.',
    icon: 'medkit-outline',
    tone: 'ivory',
    items: [
      {
        id: 'svc-med-doctor',
        name: 'Doctor on call',
        short: 'Doctor',
        desc: 'A physician visits your suite within 30 minutes.',
        price: 1500,
        etaMinutes: 30,
        type: 'medical',
        icon: 'medkit-outline',
      },
      {
        id: 'svc-med-firstaid',
        name: 'First-aid kit',
        desc: 'Basic supplies — bandages, antiseptic, paracetamol.',
        price: 0,
        etaMinutes: 15,
        type: 'medical',
        icon: 'bandage-outline',
      },
      {
        id: 'svc-med-oxygen',
        name: 'Altitude support',
        short: 'Altitude',
        desc: 'Light oxygen and a check-in for high-altitude discomfort.',
        price: 0,
        etaMinutes: 20,
        type: 'medical',
        icon: 'pulse-outline',
      },
    ],
  },
  {
    key: 'experiences',
    kicker: 'On the grounds',
    title: 'Bonfire, Golf & Activities',
    tagline: 'The hills, the garden, the long evening — arranged for you.',
    icon: 'flame-outline',
    tone: 'amber',
    items: [
      {
        id: 'svc-exp-bonfire',
        name: 'Bonfire for the evening',
        short: 'Bonfire',
        desc: 'A private fire lit in the garden — wood, blankets and warm tea.',
        price: 2500,
        etaMinutes: 60,
        type: 'experience',
        icon: 'flame-outline',
      },
      {
        id: 'svc-exp-golf',
        name: 'Mini golf reservation',
        short: 'Mini golf',
        desc: 'A round on the course — clubs and balls provided.',
        price: 800,
        etaMinutes: 20,
        type: 'experience',
        icon: 'golf-outline',
      },
      {
        id: 'svc-exp-indoor',
        name: 'Indoor games access',
        short: 'Indoor games',
        desc: 'Carrom, table tennis, chess and board games in the lounge.',
        price: 0,
        etaMinutes: 10,
        type: 'experience',
        icon: 'game-controller-outline',
      },
      {
        id: 'svc-exp-garden',
        name: 'Garden tour',
        short: 'Garden walk',
        desc: 'A guided amble through the property gardens at golden hour.',
        price: 0,
        etaMinutes: 30,
        type: 'experience',
        icon: 'leaf-outline',
      },
    ],
  },
];

// A curated set surfaced in the "Most summoned" rail at the top of the screen.
export const QUICK_SUMMON_IDS = [
  'svc-exp-bonfire',
  'svc-amen-hotbev',
  'svc-amen-blanket',
  'svc-well-sauna',
  'svc-transfer-shuttle',
  'svc-med-doctor',
] as const;

export const ALL_SERVICES: ServiceItem[] = SERVICE_CATEGORIES.flatMap((c) => c.items);

export function serviceById(id: string): ServiceItem | undefined {
  return ALL_SERVICES.find((s) => s.id === id);
}
