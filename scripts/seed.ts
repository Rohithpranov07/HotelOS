/**
 * Hotel OS — basic seed (T-02)
 *
 * Inserts one demo property with a small amount of realistic data so the
 * services have something to query. The richer demo seed (full menu, multiple
 * guests, past stays, loyalty history) lands in T-19 as scripts/seed-demo.ts.
 *
 * Run: pnpm seed
 */
import { PrismaClient, type LoyaltyTier, type StaffRole } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ROOM_TYPES: Array<{ type: string; baseRate: number; max: number }> = [
  { type: 'Standard Twin', baseRate: 4500, max: 2 },
  { type: 'Deluxe King', baseRate: 6500, max: 2 },
  { type: 'Premium Suite', baseRate: 12000, max: 4 },
];

const MENU_ITEMS = [
  // ─── BREAKFAST ───
  { name: 'Masala Dosa', description: 'Crispy rice crepe with spiced potato filling, sambar and coconut chutney', price: 280, category: 'breakfast', dietaryTags: ['vegetarian', 'gluten-free'], allergens: [], prepTimeMinutes: 12 },
  { name: 'Idli Sambar (4 pcs)', description: 'Steamed rice cakes with lentil soup and coconut chutney', price: 220, category: 'breakfast', dietaryTags: ['vegetarian', 'gluten-free'], allergens: [], prepTimeMinutes: 8 },
  { name: 'English Breakfast', description: 'Eggs your way, toast, beans, grilled tomato, mushrooms', price: 480, category: 'breakfast', dietaryTags: [], allergens: ['gluten', 'eggs'], prepTimeMinutes: 18 },
  { name: 'Oats Porridge', description: 'Creamy oats with fresh fruits, honey and nuts', price: 180, category: 'breakfast', dietaryTags: ['vegetarian'], allergens: ['gluten', 'nuts', 'dairy'], prepTimeMinutes: 8 },
  { name: 'Poha', description: 'Flattened rice with onions, peanuts, curry leaves and lemon', price: 180, category: 'breakfast', dietaryTags: ['vegetarian', 'vegan', 'gluten-free'], allergens: ['nuts'], prepTimeMinutes: 10 },
  { name: 'Paratha Platter', description: 'Two stuffed parathas with curd, pickle and butter', price: 260, category: 'breakfast', dietaryTags: ['vegetarian'], allergens: ['gluten', 'dairy'], prepTimeMinutes: 15 },
  // ─── MAINS ───
  { name: 'Club Sandwich', description: 'Triple-decker with grilled chicken, bacon, egg, lettuce, tomato', price: 420, category: 'mains', dietaryTags: [], allergens: ['gluten', 'eggs'], prepTimeMinutes: 20 },
  { name: 'Paneer Butter Masala', description: 'Cottage cheese in rich tomato-butter gravy, served with naan', price: 380, category: 'mains', dietaryTags: ['vegetarian'], allergens: ['dairy', 'gluten'], prepTimeMinutes: 22 },
  { name: 'Chicken Biryani', description: 'Fragrant basmati rice with marinated chicken, served with raita', price: 460, category: 'mains', dietaryTags: [], allergens: ['dairy'], prepTimeMinutes: 28 },
  { name: 'Veg Hakka Noodles', description: 'Wok-tossed noodles with vegetables and Indo-Chinese sauces', price: 320, category: 'mains', dietaryTags: ['vegetarian', 'vegan'], allergens: ['gluten', 'soy'], prepTimeMinutes: 18 },
  { name: 'Margherita Pizza', description: 'Wood-fired pizza with San Marzano tomato, mozzarella and basil', price: 440, category: 'mains', dietaryTags: ['vegetarian'], allergens: ['gluten', 'dairy'], prepTimeMinutes: 22 },
  { name: 'Grilled Salmon', description: 'Atlantic salmon with lemon butter, mashed potato and greens', price: 880, category: 'mains', dietaryTags: ['gluten-free'], allergens: ['fish', 'dairy'], prepTimeMinutes: 25 },
  { name: 'Caesar Salad', description: 'Romaine, parmesan, croutons, classic Caesar dressing', price: 320, category: 'mains', dietaryTags: [], allergens: ['gluten', 'dairy', 'eggs', 'fish'], prepTimeMinutes: 10 },
  // ─── DESSERTS ───
  { name: 'Gulab Jamun (2 pcs)', description: 'Warm milk dumplings in rose-cardamom syrup', price: 160, category: 'desserts', dietaryTags: ['vegetarian'], allergens: ['dairy', 'gluten'], prepTimeMinutes: 6 },
  { name: 'Chocolate Brownie', description: 'Warm dark chocolate brownie with vanilla ice cream', price: 240, category: 'desserts', dietaryTags: ['vegetarian'], allergens: ['gluten', 'dairy', 'eggs'], prepTimeMinutes: 8 },
  { name: 'Tiramisu', description: 'Espresso-soaked ladyfingers, mascarpone, cocoa', price: 280, category: 'desserts', dietaryTags: ['vegetarian'], allergens: ['gluten', 'dairy', 'eggs'], prepTimeMinutes: 5 },
  { name: 'Fruit Platter', description: 'Seasonal Indian fruits, chilled', price: 220, category: 'desserts', dietaryTags: ['vegetarian', 'vegan', 'gluten-free'], allergens: [], prepTimeMinutes: 5 },
  // ─── BEVERAGES ───
  { name: 'Filter Coffee', description: 'South Indian decoction coffee with milk', price: 120, category: 'beverages', dietaryTags: ['vegetarian'], allergens: ['dairy'], prepTimeMinutes: 5 },
  { name: 'Masala Chai', description: 'Spiced Indian tea with cardamom, ginger and milk', price: 100, category: 'beverages', dietaryTags: ['vegetarian'], allergens: ['dairy'], prepTimeMinutes: 5 },
  { name: 'Fresh Lime Soda', description: 'Fresh-squeezed lime with soda, salt or sugar', price: 140, category: 'beverages', dietaryTags: ['vegetarian', 'vegan', 'gluten-free'], allergens: [], prepTimeMinutes: 3 },
];

const STAFF_SEED: Array<{ email: string; fullName: string; role: StaffRole }> = [
  { email: 'manager@grandchennai.com', fullName: 'Suresh Iyer', role: 'manager' },
  { email: 'frontdesk@grandchennai.com', fullName: 'Anita Kumar', role: 'front_desk' },
  { email: 'housekeeping@grandchennai.com', fullName: 'Lakshmi Rao', role: 'housekeeping' },
];

const GUEST_SEED: Array<{
  phone: string;
  fullName: string;
  loyaltyTier: LoyaltyTier;
  loyaltyPoints: number;
  totalStays: number;
  dietaryFlags: string[];
}> = [
  {
    phone: '+919876543210',
    fullName: 'Priya Mehta',
    loyaltyTier: 'gold',
    loyaltyPoints: 4820,
    totalStays: 8,
    dietaryFlags: ['vegetarian'],
  },
  {
    phone: '+919876543211',
    fullName: 'Arjun Sharma',
    loyaltyTier: 'silver',
    loyaltyPoints: 2100,
    totalStays: 4,
    dietaryFlags: [],
  },
];

async function main() {
  console.log('🌱 Seeding Hotel OS demo data…');

  // 1. Property
  const property = await prisma.property.upsert({
    where: { slug: 'grand-chennai' },
    update: {},
    create: {
      name: 'The Grand Chennai',
      slug: 'grand-chennai',
      address: '15 Anna Salai, Chennai 600002',
      city: 'Chennai',
      country: 'IN',
      pmsType: 'manual',
      subscriptionTier: 'growth',
    },
  });
  console.log(`  ✓ property: ${property.name}`);

  // 2. Rooms (10 rooms across 5 floors)
  await prisma.room.deleteMany({ where: { propertyId: property.id } });
  for (let i = 0; i < 10; i++) {
    const floor = Math.floor(i / 2) + 1;
    const roomType = ROOM_TYPES[i % ROOM_TYPES.length]!;
    await prisma.room.create({
      data: {
        propertyId: property.id,
        roomNumber: `${floor}0${(i % 2) + 1}`,
        roomType: roomType.type,
        floor,
        maxOccupancy: roomType.max,
        baseRate: roomType.baseRate,
        lockDeviceId: `MOCK_LOCK_${floor}0${(i % 2) + 1}`,
        amenities: floor >= 4 ? ['pool_view', 'balcony'] : ['city_view'],
      },
    });
  }
  console.log(`  ✓ 10 rooms`);

  // 3. Staff
  const passwordHash = await bcrypt.hash('demo1234', 10);
  for (const s of STAFF_SEED) {
    await prisma.staff.upsert({
      where: { email: s.email },
      update: {},
      create: { ...s, propertyId: property.id, passwordHash },
    });
  }
  console.log(`  ✓ ${STAFF_SEED.length} staff (password: demo1234)`);

  // 4. Menu items
  await prisma.menuItem.deleteMany({ where: { propertyId: property.id } });
  await prisma.menuItem.createMany({
    data: MENU_ITEMS.map((m, idx) => ({ ...m, propertyId: property.id, sortOrder: idx })),
  });
  console.log(`  ✓ ${MENU_ITEMS.length} menu items`);

  // 5. Guests + one active reservation each
  const rooms = await prisma.room.findMany({ where: { propertyId: property.id } });
  for (let i = 0; i < GUEST_SEED.length; i++) {
    const seed = GUEST_SEED[i]!;
    const guest = await prisma.guest.upsert({
      where: { phone: seed.phone },
      update: {},
      create: {
        phone: seed.phone,
        fullName: seed.fullName,
        loyaltyTier: seed.loyaltyTier,
        loyaltyPoints: seed.loyaltyPoints,
        lifetimePoints: seed.loyaltyPoints,
        totalStays: seed.totalStays,
        dietaryFlags: seed.dietaryFlags,
        propertyId: property.id,
        email: faker.internet.email({ firstName: seed.fullName.split(' ')[0] }).toLowerCase(),
        nationality: 'IN',
      },
    });

    // future-dated reservation
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 2);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 2);
    const room = rooms[i % rooms.length]!;

    await prisma.reservation.upsert({
      where: { pmsBookingRef: `DEMO-${seed.phone.slice(-4)}` },
      update: {},
      create: {
        guestId: guest.id,
        propertyId: property.id,
        roomId: room.id,
        pmsBookingRef: `DEMO-${seed.phone.slice(-4)}`,
        status: 'confirmed',
        checkInDate: checkIn,
        checkOutDate: checkOut,
        adults: 2,
        children: 0,
        ratePlan: 'CP',
        roomRate: room.baseRate,
        totalRoomAmount: Number(room.baseRate) * 2,
        totalAmount: Number(room.baseRate) * 2,
        source: 'direct',
      },
    });
  }
  console.log(`  ✓ ${GUEST_SEED.length} guests with reservations`);

  console.log('\n✅ Seed complete.');
  console.log('   Staff login: manager@grandchennai.com / demo1234');
  console.log('   Guest phone: +919876543210 (any 6-digit OTP in dev mode)');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
