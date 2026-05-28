import { useRouter } from 'expo-router';
import type { DiscoveryItem } from '../components/luxe/DiscoveryRail';

export function buildDiscoveryItems(
  router: ReturnType<typeof useRouter>,
): DiscoveryItem[] {
  const h = new Date().getHours();

  const diningItem: DiscoveryItem =
    h >= 6 && h < 11
      ? {
          kicker: 'Breakfast',
          title: 'In-suite\nmorning spread',
          meta: 'Until 11:00',
          byline: 'Pastries, fresh fruit and your preferred brew',
          tone: 'amber',
          onPress: () => router.push('/(app)/services'),
        }
      : h >= 17
        ? {
            kicker: 'Tonight',
            title: "Chef's tasting,\nkitchen open",
            meta: '7 courses',
            byline: 'Reserve a table or order straight to your suite',
            tone: 'amber',
            onPress: () => router.push('/(app)/services'),
          }
        : {
            kicker: 'Kitchen',
            title: 'Order to\nyour suite',
            meta: 'Open now',
            byline: 'From light bites to a full lunch menu',
            tone: 'amber',
            onPress: () => router.push('/(app)/services'),
          };

  return [
    diningItem,
    {
      kicker: 'Cellar',
      title: 'A pour from\nthe private list',
      meta: '6 vintages',
      byline: 'Curated by sommelier Hiroshi Tanaka',
      tone: 'bronze',
      onPress: () => router.push('/(app)/concierge'),
    },
    {
      kicker: 'Spa',
      title: 'Onsen ritual\nat moonrise',
      meta: h >= 20 ? '21:00 slot' : 'Book now',
      byline: 'Steam, cypress and stillness',
      tone: 'ink',
      onPress: () => router.push('/(app)/concierge'),
    },
    {
      kicker: 'The city',
      title: 'Lantern walk\nthrough the old quarter',
      meta: '12 min away',
      byline: 'After dinner — concierge will accompany',
      tone: 'ivory',
      onPress: () => router.push('/(app)/concierge'),
    },
    {
      kicker: 'Pool · West',
      title: 'Quiet waters\nand the skyline',
      meta: 'Open now',
      byline: 'Heated to 28°, open until 23:00',
      tone: 'deep',
      onPress: () => router.push('/(app)/concierge'),
    },
    {
      kicker: 'Suite',
      title: 'Turndown\nwhen you wish',
      meta: 'Anytime',
      byline: 'Pillows turned, the suite readied for the night',
      tone: 'amber',
      onPress: () => router.push('/(app)/housekeeping'),
    },
    {
      kicker: 'Laundry',
      title: 'Valet pressed,\nback by evening',
      meta: 'Same day',
      byline: 'Collected discreetly and returned before dinner',
      tone: 'bronze',
      onPress: () => router.push('/(app)/services'),
    },
    {
      kicker: 'Concierge',
      title: 'Anything,\narranged quietly',
      meta: '24 · 7',
      byline: 'Reservations, gifts, local guides and more',
      tone: 'ivory',
      onPress: () => router.push('/(app)/concierge'),
    },
  ];
}
