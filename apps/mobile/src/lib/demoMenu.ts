import type { MenuItem, MenuResponse } from '../stores/orders.store';

const IMG = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&q=80&fit=crop&auto=format`;

const items: MenuItem[] = [
  // ─── BREAKFAST (3) ───────────────────────────────

  {
    id: 'breakfast-south-indian-set',
    name: 'South Indian Breakfast Set',
    description:
      'Idli, Vada, Pongal or Dosa served with juice and tea/coffee.',
    price: 285,
    category: 'breakfast',
    dietaryTags: ['vegetarian'],
    allergens: [],
    imageUrl: IMG('1743615467363-250466982515'),
    prepTimeMinutes: 15,
    availableFrom: '07:30',
    availableTo: '10:30',
  },

  {
    id: 'breakfast-fluffy-omelette',
    name: 'Fluffy Omelette',
    description:
      'Choice of Cheese, Masala or Spanish stuffing.',
    price: 120,
    category: 'breakfast',
    dietaryTags: ['vegetarian'],
    allergens: ['eggs', 'dairy'],
    imageUrl: IMG('1510693206972-df098062cb71'),
    prepTimeMinutes: 10,
    availableFrom: '07:30',
    availableTo: '10:30',
  },

  {
    id: 'breakfast-dosa-delight',
    name: 'Dosa Delight',
    description:
      'Choice of Plain, Masala, Paneer or Cheese dosa.',
    price: 130,
    category: 'breakfast',
    dietaryTags: ['vegetarian'],
    allergens: ['dairy'],
    imageUrl: IMG('1743615467204-8fdaa85ff2db'),
    prepTimeMinutes: 12,
    availableFrom: '07:30',
    availableTo: '10:30',
  },

  // ─── SOUPS & SALADS (2) ──────────────────────────

  {
    id: 'soup-hot-sour-chicken',
    name: 'Hot and Sour Soup — Chicken',
    description:
      'Spicy Indo-Chinese chicken soup.',
    price: 115,
    category: 'soup',
    dietaryTags: [],
    allergens: ['soy'],
    imageUrl: IMG('1527976746453-f363eac4d889'),
    prepTimeMinutes: 12,
    availableFrom: '12:00',
    availableTo: '22:30',
  },

  {
    id: 'salad-caesar',
    name: 'Chicken Caesar Salad',
    description:
      'Classic Caesar salad topped with grilled chicken.',
    price: 150,
    category: 'salad',
    dietaryTags: [],
    allergens: ['dairy', 'eggs', 'gluten'],
    imageUrl: IMG('1550304943-4f24f54ddde9'),
    prepTimeMinutes: 10,
    availableFrom: '12:00',
    availableTo: '22:30',
  },

  // ─── PREMIUM STARTERS (4) ────────────────────────

  {
    id: 'starter-paneer-tikka',
    name: 'Paneer Tikka Ajwaini',
    description:
      'Ajwain flavoured cottage cheese tikka.',
    price: 165,
    category: 'starters',
    dietaryTags: ['vegetarian'],
    allergens: ['dairy'],
    imageUrl: IMG('1567188040759-fb8a883dc6d8'),
    prepTimeMinutes: 25,
    availableFrom: '12:00',
    availableTo: '22:30',
  },

  {
    id: 'starter-cheese-mushroom',
    name: 'Cheese Stuffed Mushrooms',
    description:
      'Mushrooms stuffed with gooey cheese.',
    price: 175,
    category: 'starters',
    dietaryTags: ['vegetarian'],
    allergens: ['dairy'],
    imageUrl: IMG('1640456604089-cc18763be2b5'),
    prepTimeMinutes: 20,
    availableFrom: '12:00',
    availableTo: '22:30',
  },

  {
    id: 'starter-tandoori-prawn',
    name: 'Tandoori Prawn',
    description:
      'Prawns marinated in tandoori spices and cooked in clay oven.',
    price: 300,
    category: 'starters',
    dietaryTags: ['pescatarian'],
    allergens: ['shellfish', 'dairy'],
    imageUrl: IMG('1559742811-822873691df8'),
    prepTimeMinutes: 25,
    availableFrom: '12:00',
    availableTo: '22:30',
  },

  {
    id: 'starter-murgh-tikka',
    name: 'Murgh Tikka',
    description:
      'Succulent boneless chicken kebab marinated in tikka spices.',
    price: 215,
    category: 'starters',
    dietaryTags: [],
    allergens: ['dairy'],
    imageUrl: IMG('1555939594-58d7cb561ad1'),
    prepTimeMinutes: 25,
    availableFrom: '12:00',
    availableTo: '22:30',
  },

  // ─── INDIAN VEG MAINS (3) ────────────────────────

  {
    id: 'main-paneer-makhani',
    name: 'Paneer Makhani',
    description:
      'Paneer in creamy buttery tomato gravy.',
    price: 210,
    category: 'mains',
    dietaryTags: ['vegetarian'],
    allergens: ['dairy'],
    imageUrl: IMG('1772730064951-89b427965dbc'),
    prepTimeMinutes: 20,
    availableFrom: '12:00',
    availableTo: '22:30',
  },

  {
    id: 'main-malai-kofta',
    name: 'Malai Kofta Curry',
    description:
      'Soft koftas simmered in rich saffron cashew gravy.',
    price: 210,
    category: 'mains',
    dietaryTags: ['vegetarian'],
    allergens: ['dairy', 'nuts'],
    imageUrl: IMG('1750190624930-3728a6ed1642'),
    prepTimeMinutes: 25,
    availableFrom: '12:00',
    availableTo: '22:30',
  },

  {
    id: 'main-dal-makhani',
    name: 'Dal Makhani',
    description:
      'Slow-cooked black lentils in creamy tomato gravy.',
    price: 200,
    category: 'mains',
    dietaryTags: ['vegetarian'],
    allergens: ['dairy'],
    imageUrl: IMG('1512010151537-2cf5c638ad51'),
    prepTimeMinutes: 25,
    availableFrom: '12:00',
    availableTo: '22:30',
  },

  // ─── INDIAN NON VEG MAINS (4) ────────────────────

  {
    id: 'main-rogan-josh',
    name: 'Rogan Josh',
    description:
      'Rich Kashmiri mutton preparation.',
    price: 320,
    category: 'mains',
    dietaryTags: [],
    allergens: ['dairy'],
    imageUrl: IMG('1710091691780-c7eb0dc50cf8'),
    prepTimeMinutes: 30,
    availableFrom: '12:00',
    availableTo: '22:30',
  },

  {
    id: 'main-murgh-makhani',
    name: 'Murgh Makhani',
    description:
      'Creamy butter chicken curry.',
    price: 280,
    category: 'mains',
    dietaryTags: [],
    allergens: ['dairy'],
    imageUrl: IMG('1603894584373-5ac82b2ae398'),
    prepTimeMinutes: 25,
    availableFrom: '12:00',
    availableTo: '22:30',
  },

  {
    id: 'main-chicken-chettinad',
    name: 'Chicken Chettinad',
    description:
      'Classic South Indian chicken curry with Chettinad spices.',
    price: 300,
    category: 'mains',
    dietaryTags: [],
    allergens: [],
    imageUrl: IMG('1757445060056-6d6aeec73de4'),
    prepTimeMinutes: 25,
    availableFrom: '12:00',
    availableTo: '22:30',
  },

  {
    id: 'main-prawn-masala',
    name: 'Prawn Masala',
    description:
      'Fresh prawns in spicy masala gravy.',
    price: 345,
    category: 'mains',
    dietaryTags: ['pescatarian'],
    allergens: ['shellfish'],
    imageUrl: IMG('1750190622950-4b7153f5ecce'),
    prepTimeMinutes: 25,
    availableFrom: '12:00',
    availableTo: '22:30',
  },

  // ─── RICE (2) ────────────────────────────────────

  {
    id: 'rice-mutton-biryani',
    name: 'Mutton Biryani',
    description:
      'Classic aromatic mutton biryani.',
    price: 290,
    category: 'rice',
    dietaryTags: [],
    allergens: [],
    imageUrl: IMG('1589302168068-964664d93dc0'),
    prepTimeMinutes: 30,
    availableFrom: '12:00',
    availableTo: '22:30',
  },

  {
    id: 'rice-dum-murgh-biryani',
    name: 'Dum Murgh Biryani',
    description:
      'Chicken biryani slow cooked on dum.',
    price: 280,
    category: 'rice',
    dietaryTags: [],
    allergens: ['dairy'],
    imageUrl: IMG('1559528896-c5310744cce8'),
    prepTimeMinutes: 35,
    availableFrom: '12:00',
    availableTo: '22:30',
  },

  // ─── INDIAN BREADS (2) ───────────────────────────

  {
    id: 'bread-orchard-naan',
    name: 'Orchard Naan',
    description:
      'Signature naan topped with nuts and dry fruits.',
    price: 130,
    category: 'bread',
    dietaryTags: ['vegetarian'],
    allergens: ['gluten', 'dairy', 'nuts'],
    imageUrl: IMG('1756821752957-00bfcadc3748'),
    prepTimeMinutes: 12,
    availableFrom: '12:00',
    availableTo: '22:30',
  },

  {
    id: 'bread-garlic-naan',
    name: 'Garlic Naan',
    description:
      'Classic garlic naan baked in tandoor.',
    price: 75,
    category: 'bread',
    dietaryTags: ['vegetarian'],
    allergens: ['gluten', 'dairy'],
    imageUrl: IMG('1756821753151-0879e7862e50'),
    prepTimeMinutes: 10,
    availableFrom: '12:00',
    availableTo: '22:30',
  },

  // ─── PAN ASIAN (2) ───────────────────────────────

  {
    id: 'asian-dragon-prawns',
    name: 'Dragon Prawns',
    description:
      'Crispy prawns tossed in fiery dragon sauce.',
    price: 375,
    category: 'pan_asian',
    dietaryTags: ['pescatarian'],
    allergens: ['shellfish', 'soy'],
    imageUrl: IMG('1688084468401-4938b073aef2'),
    prepTimeMinutes: 20,
    availableFrom: '12:00',
    availableTo: '22:30',
  },

  {
    id: 'asian-chilli-paneer',
    name: 'Chilli Paneer',
    description:
      'Paneer tossed in Indo-Chinese chilli sauce.',
    price: 200,
    category: 'pan_asian',
    dietaryTags: ['vegetarian'],
    allergens: ['dairy', 'soy', 'gluten'],
    imageUrl: IMG('1756821753481-31183e985c76'),
    prepTimeMinutes: 18,
    availableFrom: '12:00',
    availableTo: '22:30',
  },

  // ─── CONTINENTAL (1) ─────────────────────────────

  {
    id: 'continental-grilled-prawns',
    name: 'Grilled Prawns with Garlic Butter',
    description:
      'Premium grilled prawns served with garlic butter.',
    price: 425,
    category: 'continental',
    dietaryTags: ['pescatarian'],
    allergens: ['shellfish', 'dairy'],
    imageUrl: IMG('1708184528305-69dc91d8e9d5'),
    prepTimeMinutes: 25,
    availableFrom: '12:00',
    availableTo: '22:30',
  },

  // ─── DESSERTS (1) ────────────────────────────────

  {
    id: 'dessert-lava-cake',
    name: 'Molten Chocolate Lava Cake',
    description:
      'Warm gooey chocolate lava cake.',
    price: 125,
    category: 'dessert',
    dietaryTags: ['vegetarian'],
    allergens: ['gluten', 'dairy', 'eggs'],
    imageUrl: IMG('1511911063855-2bf39afa5b2e'),
    prepTimeMinutes: 15,
    availableFrom: '12:00',
    availableTo: '22:30',
  },

  // ─── BEVERAGES (1) ───────────────────────────────

  {
    id: 'beverage-filter-coffee',
    name: 'South Indian Filter Coffee',
    description:
      'Authentic South Indian filter coffee.',
    price: 65,
    category: 'beverage',
    dietaryTags: ['vegetarian'],
    allergens: ['dairy'],
    imageUrl: IMG('1757918391899-1341f7b285fb'),
    prepTimeMinutes: 5,
    availableFrom: null,
    availableTo: null,
  },
];

export const DEMO_MENU: MenuResponse = {
  items,
  categories: Array.from(new Set(items.map((i) => i.category))),
  recommended: [
    items.find((i) => i.id === 'main-prawn-masala')!,
    items.find((i) => i.id === 'main-rogan-josh')!,
    items.find((i) => i.id === 'continental-grilled-prawns')!,
  ],
  kitchen_open: true,
  kitchen_hours: { open: '07:30', close: '22:30' },
};
