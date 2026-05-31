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
          backgroundImage: require('../../assets/dining.webp'),
          onPress: () => router.push('/(app)/services'),
        }
      : h >= 17
        ? {
            kicker: 'Tonight',
            title: "Chef's tasting,\nkitchen open",
            meta: '7 courses',
            byline: 'Reserve a table or order straight to your suite',
            tone: 'amber',
            backgroundImage: require('../../assets/Smess.jpg'),
            onPress: () => router.push('/(app)/services'),
          }
        : {
            kicker: 'Kitchen',
            title: 'Order to\nyour suite',
            meta: 'Open now',
            byline: 'From light bites to a full lunch menu',
            tone: 'amber',
            backgroundImage: require('../../assets/bar.webp'),
            onPress: () => router.push('/(app)/services'),
          };

  return [
    diningItem,
    {
      kicker: 'The garden',
      title: 'Bonfire lit\nfor the evening',
      meta: h >= 18 ? 'Tonight · 19:30' : 'Reserve for tonight',
      byline: 'A private fire, blankets and warm masala chai',
      tone: 'amber',
      backgroundImage: require('../../assets/bonfire.jpg'),
      onPress: () => router.push('/(app)/services'),
    },
    {
      kicker: 'Spa',
      title: 'Steam, sauna\nand a long massage',
      meta: h >= 20 ? 'Last slot 21:00' : 'Book now',
      byline: 'Eucalyptus steam, dry sauna, deep-tissue ritual',
      tone: 'ink',
      backgroundImage: require('../../assets/spa.jpg'),
      onPress: () => router.push('/(app)/concierge'),
    },
    {
      kicker: "Coaker's Walk",
      title: 'A walk along\nthe cliff at dusk',
      meta: '8 min from the porch',
      byline: 'The valley fills with mist as the sun drops',
      tone: 'ivory',
      backgroundImage: require('../../assets/Coakers.jpg'),
      onPress: () => router.push('/(app)/concierge'),
    },
    {
      kicker: 'On the lawn',
      title: 'Mini golf\nand indoor games',
      meta: 'Open all day',
      byline: 'A round on the green, or carrom and chess in the lounge',
      tone: 'deep',
      backgroundImage: require('../../assets/golf.webp'),
      onPress: () => router.push('/(app)/concierge'),
    },
    {
      kicker: 'Suite',
      title: 'Turndown\nwhen you wish',
      meta: 'Anytime',
      byline: 'Pillows turned, the heater set, the room readied for night',
      tone: 'amber',
      backgroundImage: require('../../assets/housekeeping.jpg'),
      onPress: () => router.push('/(app)/housekeeping'),
    },
    {
      kicker: 'Valet',
      title: 'Laundry pressed,\nback by evening',
      meta: 'Same day',
      byline: 'Collected discreetly and returned before dinner',
      tone: 'bronze',
      backgroundImage: require('../../assets/garden.webp'),
      onPress: () => router.push('/(app)/services'),
    },
    {
      kicker: 'Concierge',
      title: 'Anything,\narranged quietly',
      meta: '24 · 7',
      byline: 'Sightseeing, airport cars, local guides and more',
      tone: 'ivory',
      backgroundImage: require('../../assets/facade.jpg'),
      onPress: () => router.push('/(app)/concierge'),
    },
  ];
}
