import { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AnimatedExpoImage = Animated.createAnimatedComponent(ExpoImage);
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgLabel,
} from 'react-native-svg';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts, LuxeRadii } from '../../src/theme/luxe';
import { useWeather } from '../../src/lib/useWeather';
import { useContentStore, type Attraction } from '../../src/stores/content.store';
import {
  HOTEL_COORDS,
  estimateDriveMinutes,
  formatDuration,
  formatKm,
  haversineKm,
} from '../../src/lib/geo';
import { usePlanStore } from '../../src/stores/plan.store';
import { useOrdersStore } from '../../src/stores/orders.store';
import { useReservationStore } from '../../src/stores/reservation.store';

const { width: SW } = Dimensions.get('window');
type IconName = keyof typeof Ionicons.glyphMap;

// ─── DATA ──────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  label: string;
  icon: IconName;
}

interface Spot {
  id: string;
  categories: string[];
  name: string;
  subtitle: string;
  whyVisit: string;
  /** Real coordinates — distance & ETA are derived from these and the hotel. */
  lat: number;
  lng: number;
  rating: string;
  ratingCount: string;
  gradA: string;
  gradB: string;
  gradC: string;
  icon: IconName;
  backgroundImage?: number;
}

interface Transport {
  id: string;
  icon: IconName;
  label: string;
  sub: string;
  fare: string;
  gradFrom: string;
  gradTo: string;
  borderColor: string;
}

interface Guide {
  id: string;
  icon: IconName;
  label: string;
  desc: string;
  duration: string;
  price: string;
  lang: string;
  avail: boolean;
}

interface Experience {
  id: string;
  kicker: string;
  title: string;
  desc: string;
  icon: IconName;
  tag: string;
  gradA: string;
  gradB: string;
  backgroundImage?: number;
}

const CATEGORIES: Category[] = [
  { id: 'all', label: 'All', icon: 'compass-outline' },
  { id: 'attractions', label: 'Attractions', icon: 'camera-outline' },
  { id: 'dining', label: 'Food & Dining', icon: 'restaurant-outline' },
  { id: 'shopping', label: 'Shopping', icon: 'bag-handle-outline' },
  { id: 'nature', label: 'Nature', icon: 'leaf-outline' },
  { id: 'nightlife', label: 'Nightlife', icon: 'moon-outline' },
  { id: 'culture', label: 'Culture', icon: 'library-outline' },
  { id: 'hidden', label: 'Hidden Gems', icon: 'diamond-outline' },
  { id: 'family', label: 'Family Spots', icon: 'people-outline' },
];

const FALLBACK_SPOTS: Spot[] = [
  {
    id: 'lake',
    categories: ['nature', 'attractions', 'family'],
    name: 'Kodaikanal Lake',
    subtitle: 'The star-shaped lake at the heart of the town.',
    whyVisit:
      'A 5 km shoreline made for slow walks, paddle boats and rented cycles. Quiet at dawn, lively by mid-morning.',
    lat: 10.2378,
    lng: 77.4848,
    rating: '4.6',
    ratingCount: '38.2k',
    gradA: '#0A1E22',
    gradB: '#143038',
    gradC: 'rgba(40,120,130,0.60)',
    icon: 'water-outline',
    backgroundImage: require('../../assets/lake.jpg'),
  },
  {
    id: 'coakers',
    categories: ['nature', 'attractions'],
    name: "Coaker's Walk",
    subtitle: 'A 1 km promenade along the cliff edge.',
    whyVisit:
      "On clear days the valley opens all the way to Dolphin's Nose. Best at sunrise or just before sundown.",
    lat: 10.2335,
    lng: 77.4937,
    rating: '4.5',
    ratingCount: '18.7k',
    gradA: '#0E1A0E',
    gradB: '#1A2C1A',
    gradC: 'rgba(80,140,90,0.55)',
    icon: 'walk-outline',
    backgroundImage: require('../../assets/Coakers.jpg'),
  },
  {
    id: 'bryant',
    categories: ['nature', 'culture', 'family'],
    name: 'Bryant Park',
    subtitle: 'A 20-acre botanical garden by the lake.',
    whyVisit:
      'Hybrid roses, conifers and the annual May flower show. A peaceful afternoon stroll.',
    lat: 10.2363,
    lng: 77.4922,
    rating: '4.3',
    ratingCount: '12.4k',
    gradA: '#101A08',
    gradB: '#1C2C10',
    gradC: 'rgba(110,150,60,0.55)',
    icon: 'leaf-outline',
    backgroundImage: require('../../assets/Bryantpark.jpg'),
  },
  {
    id: 'pillar',
    categories: ['nature', 'attractions'],
    name: 'Pillar Rocks',
    subtitle: 'Three vertical granite shafts, 122 m tall.',
    whyVisit:
      'A dramatic viewpoint 8 km out of town. Often wreathed in mist — wait a minute, the curtain lifts.',
    lat: 10.2271,
    lng: 77.4528,
    rating: '4.4',
    ratingCount: '21.3k',
    gradA: '#15141A',
    gradB: '#23202C',
    gradC: 'rgba(120,110,150,0.45)',
    icon: 'triangle-outline',
    backgroundImage: require('../../assets/pillarrocks.jpg'),
  },
  {
    id: 'berijam',
    categories: ['nature', 'hidden'],
    name: 'Berijam Lake',
    subtitle: 'A protected forest lake, deeper into the shola.',
    whyVisit:
      'Permit required from the forest office. The drive winds through pristine shola jungle — bison and gaur are common sightings.',
    lat: 10.1843,
    lng: 77.3888,
    rating: '4.7',
    ratingCount: '7.8k',
    gradA: '#08160E',
    gradB: '#0E2418',
    gradC: 'rgba(40,110,70,0.55)',
    icon: 'trail-sign-outline',
    backgroundImage: require('../../assets/Berijam.jpg'),
  },
  {
    id: 'silver',
    categories: ['nature', 'hidden'],
    name: 'Silver Cascade',
    subtitle: 'A 55 m roadside waterfall on the ghat road.',
    whyVisit:
      'The first glimpse most visitors get of Kodai. Stop on the way in or out — best after the monsoon.',
    lat: 10.2630,
    lng: 77.5181,
    rating: '4.2',
    ratingCount: '15.6k',
    gradA: '#0A1620',
    gradB: '#14283A',
    gradC: 'rgba(70,130,180,0.50)',
    icon: 'rainy-outline',
    backgroundImage: require('../../assets/Silvercascade.jpg'),
  },
  {
    id: 'kurinji',
    categories: ['culture', 'attractions'],
    name: 'Kurinji Andavar Temple',
    subtitle: 'A hilltop Murugan temple, est. 1936.',
    whyVisit:
      'Named for the kurinji flower that blooms once every 12 years. Sweeping views over Palani and Vaigai dam.',
    lat: 10.2475,
    lng: 77.5081,
    rating: '4.5',
    ratingCount: '9.2k',
    gradA: '#1E1005',
    gradB: '#3C2008',
    gradC: 'rgba(180,110,40,0.55)',
    icon: 'business-outline',
    backgroundImage: require('../../assets/Kuruji.jpg'),
  },
  {
    id: 'bazaar',
    categories: ['shopping', 'culture'],
    name: 'Tibetan & Coronation Bazaar',
    subtitle: 'Hill-station markets for woollens and chocolate.',
    whyVisit:
      'Hand-knit shawls, jackets and pashminas at the Tibetan stalls; homemade chocolate, cheese and eucalyptus oil on Bazaar Road.',
    lat: 10.2389,
    lng: 77.4865,
    rating: '4.2',
    ratingCount: '6.4k',
    gradA: '#0E0C16',
    gradB: '#161224',
    gradC: 'rgba(120,80,160,0.50)',
    icon: 'bag-handle-outline',
  },
];

const TRANSPORT: Transport[] = [
  {
    id: 'cab',
    icon: 'car-outline',
    label: 'In-town cab',
    sub: 'Arrives in ~6 min',
    fare: '₹150–250',
    gradFrom: 'rgba(244,201,126,0.16)',
    gradTo: 'rgba(139,111,71,0.03)',
    borderColor: 'rgba(244,201,126,0.28)',
  },
  {
    id: 'chauffeur',
    icon: 'car-sport-outline',
    label: 'Sightseeing chauffeur',
    sub: 'Innova or Crysta — full day',
    fare: '₹3,800 / day',
    gradFrom: 'rgba(139,111,71,0.22)',
    gradTo: 'rgba(244,201,126,0.04)',
    borderColor: 'rgba(212,168,87,0.28)',
  },
  {
    id: 'airport',
    icon: 'airplane-outline',
    label: 'Madurai airport',
    sub: '~3 hr to MDU via Dindigul',
    fare: 'From ₹4,500',
    gradFrom: 'rgba(60,80,140,0.18)',
    gradTo: 'rgba(40,60,110,0.04)',
    borderColor: 'rgba(100,120,200,0.22)',
  },
  {
    id: 'rental',
    icon: 'key-outline',
    label: 'Self-drive SUV',
    sub: 'Compass or Scorpio — hill-tuned',
    fare: 'From ₹2,800/day',
    gradFrom: 'rgba(92,89,79,0.18)',
    gradTo: 'rgba(70,68,60,0.04)',
    borderColor: 'rgba(154,147,138,0.22)',
  },
];

const GUIDES: Guide[] = [
  {
    id: 'sightseeing',
    icon: 'navigate-circle-outline',
    label: 'Hill loop guide',
    desc: "Pillar Rocks, Guna Caves, Pine Forest, Dolphin's Nose",
    duration: '5 hr',
    price: '₹2,800',
    lang: 'EN · TA · HI',
    avail: true,
  },
  {
    id: 'shola',
    icon: 'leaf-outline',
    label: 'Shola trek guide',
    desc: 'Bombay Shola or Pambar — birds, gaur and dense forest',
    duration: '3–4 hr',
    price: '₹2,200',
    lang: 'EN · TA',
    avail: true,
  },
  {
    id: 'photo',
    icon: 'camera-outline',
    label: 'Photography guide',
    desc: 'Sunrise viewpoints, mist windows, architectural detail',
    duration: '3–4 hr',
    price: '₹3,200',
    lang: 'EN',
    avail: false,
  },
  {
    id: 'berijam',
    icon: 'compass-outline',
    label: 'Berijam permit & drive',
    desc: 'Forest entry permit arranged, with a guide for the drive',
    duration: '6 hr',
    price: '₹5,500',
    lang: 'EN · TA',
    avail: true,
  },
  {
    id: 'bazaar',
    icon: 'bag-handle-outline',
    label: 'Bazaar & chocolate walk',
    desc: 'Tibetan stalls, homemade chocolate, cheese and eucalyptus oil',
    duration: '2 hr',
    price: '₹1,400',
    lang: 'EN · TA',
    avail: true,
  },
];

const EXPERIENCES: Experience[] = [
  {
    id: 'sunset',
    kicker: 'Best Tonight',
    title: "Sunset on\nCoaker's Walk",
    desc: 'Cliff promenade · ~18:30 · Mist clearing forecast',
    icon: 'sunny-outline',
    tag: 'Concierge Pick',
    gradA: '#0F2030',
    gradB: '#08121C',
    backgroundImage: require('../../assets/Coakers.jpg'),
  },
  {
    id: 'bonfire',
    kicker: 'Perfect Evening',
    title: 'Bonfire\non the lawn',
    desc: 'Hotel garden · 19:30 · Blankets and warm masala chai',
    icon: 'flame-outline',
    tag: 'Exclusive',
    gradA: '#1F1208',
    gradB: '#120A03',
    backgroundImage: require('../../assets/bonfire.jpg'),
  },
  {
    id: 'sunrise',
    kicker: 'Worth the Alarm',
    title: "Sunrise at\nDolphin's Nose",
    desc: '~06:00 · 8 km drive, then a 1 km walk to the ledge',
    icon: 'partly-sunny-outline',
    tag: 'Photographer’s Pick',
    gradA: '#1A1220',
    gradB: '#0E0C1A',
    backgroundImage: require('../../assets/pillarrocks.jpg'),
  },
  {
    id: 'walk',
    kicker: 'Local Secret',
    title: 'Tibetan bazaar\n& chocolate trail',
    desc: 'Hand-knit woollens, homemade chocolate and cheese — with a guide',
    icon: 'navigate-outline',
    tag: 'Hidden Gem',
    gradA: '#141410',
    gradB: '#0C0C08',
    backgroundImage: require('../../assets/garden.webp'),
  },
];

// ─── MAIN SCREEN ───────────────────────────────────────────────────────────────

function attractionsToSpots(items: Attraction[]): Spot[] {
  return items.map((a) => ({
    id: a.id,
    categories: a.categories,
    name: a.name,
    subtitle: a.subtitle,
    whyVisit: a.whyVisit,
    lat: a.lat,
    lng: a.lng,
    rating: a.rating,
    ratingCount: a.ratingCount,
    gradA: a.gradA,
    gradB: a.gradB,
    gradC: a.gradC,
    icon: a.icon as IconName,
    backgroundImage: a.backgroundImage,
  }));
}

export interface ServiceBookingPayload {
  type: 'transport' | 'concierge' | 'maintenance';
  name: string;
  price: number;
  etaMinutes?: number;
  notes?: string;
}

export default function OtherServicesScreen() {
  void useLuxeFonts();
  const [activeCategory, setActiveCategory] = useState('all');
  const [savedSpots, setSavedSpots] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const apiAttractions = useContentStore((s) => s.attractions);
  const fetchAttractions = useContentStore((s) => s.fetchAttractions);
  const requestService = useOrdersStore((s) => s.requestService);
  const reservation = useReservationStore((s) => s.reservation);

  useEffect(() => {
    fetchAttractions();
  }, [fetchAttractions]);

  const bookService = async (payload: ServiceBookingPayload) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const reservationId = reservation?.id ?? 'demo-reservation';
    try {
      await requestService(
        reservationId,
        payload.type,
        { name: payload.name, price: payload.price, etaMinutes: payload.etaMinutes },
        payload.notes ? { notes: payload.notes } : undefined,
      );
      setToast(`${payload.name} — concierge confirming, you'll be notified.`);
    } catch {
      setToast(`${payload.name} — request queued, the concierge will call you back.`);
    }
    setTimeout(() => setToast(null), 3600);
  };

  const SPOTS: Spot[] =
    apiAttractions && apiAttractions.length > 0
      ? attractionsToSpots(apiAttractions)
      : FALLBACK_SPOTS;

  const filteredSpots =
    activeCategory === 'all'
      ? SPOTS
      : SPOTS.filter((s) => s.categories.includes(activeCategory));

  const toggleSave = (id: string) => {
    setSavedSpots((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        <HeroSection />
        <CategoryRail active={activeCategory} onSelect={setActiveCategory} />

        <SectionHeader kicker="Nearby" title="Top spots near you" hint={`${filteredSpots.length} places`} />
        {filteredSpots.map((spot) => (
          <SpotCard
            key={spot.id}
            spot={spot}
            saved={savedSpots.has(spot.id)}
            onSave={() => toggleSave(spot.id)}
          />
        ))}

        <SectionHeader kicker="Explore" title="City at a glance" />
        <MapSection />

        <SectionHeader kicker="Getting around" title="Book transport" hint="Concierge arranged" />
        <TransportGrid onBook={bookService} />

        <SectionHeader kicker="With an expert" title="Local guide booking" hint="All guides vetted" />
        <GuidesSection onBook={bookService} />

        <SectionHeader kicker="Tonight" title="Recommended" hint="Curated for you" />
        <ExperiencesRail onBook={bookService} />

        <SaveAndPlanSection />

        <View style={styles.footnote}>
          <Text style={styles.footText}>Hotel Kodai International · Kodaikanal</Text>
          <Text style={styles.footText}>All arrangements on request</Text>
        </View>
      </ScrollView>

      <LinearGradient
        colors={['transparent', 'rgba(8,7,10,0.85)', Luxe.obsidian]}
        locations={[0, 0.5, 0.85]}
        pointerEvents="none"
        style={styles.dockFade}
      />

      {toast ? (
        <View pointerEvents="none" style={styles.toastWrap}>
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={14} color={Luxe.goldBright} />
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

// ─── SUB-COMPONENTS ────────────────────────────────────────────────────────────

function HeroSection() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const hour = new Date().getHours();
  const weather = useWeather(HOTEL_COORDS.lat, HOTEL_COORDS.lng, {
    temperatureC: 17,
    label: 'Cool, pine mist',
  });
  const plannedCount = usePlanStore((s) => s.spotIds.length);

  const conciergeRec =
    hour < 12
      ? 'Misty morning — Coaker’s Walk before the crowd'
      : hour < 16
      ? 'Clear afternoon for Pillar Rocks or the lake'
      : 'Sundowner at the cliff, bonfire after dark';

  const weatherIcon: IconName = weatherIconFor(weather.label);

  return (
    <View style={[styles.hero, { paddingTop: insets.top + 14 }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: Luxe.obsidian }]} />
      <LinearGradient
        colors={['rgba(244,201,126,0.20)', 'rgba(244,201,126,0.04)', 'transparent']}
        locations={[0, 0.38, 0.72]}
        start={{ x: 0.92, y: 0 }}
        end={{ x: 0.2, y: 0.75 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Decorative rings */}
      <View style={styles.heroRingOuter} />
      <View style={styles.heroRingInner}>
        <LinearGradient
          colors={['rgba(244,201,126,0.18)', 'transparent']}
          start={{ x: 0.25, y: 0.25 }}
          end={{ x: 0.85, y: 0.85 }}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="compass-outline" size={24} color={Luxe.goldBright} />
      </View>
      <View style={styles.heroRingMid} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.glassPill} hitSlop={8}>
          <Ionicons name="chevron-back" size={16} color={Luxe.ivory} />
        </Pressable>
        <View style={styles.locationChip}>
          <Ionicons name="location" size={11} color={Luxe.goldBright} />
          <Text style={styles.locationText}>Kodaikanal · Lawsghat Road</Text>
        </View>
      </View>

      {/* Title */}
      <View style={styles.heroTitleBlock}>
        <Text style={styles.heroKicker}>Explore · Discover · Experience</Text>
        <Text style={styles.heroTitle}>
          Explore{'\n'}
          <Text style={styles.heroTitleItalic}>Nearby.</Text>
        </Text>
        <Text style={styles.heroSub}>Curated experiences around your stay.</Text>
      </View>

      {/* Context chips */}
      <View style={styles.heroChips}>
        <View style={styles.weatherChip}>
          <Ionicons name={weatherIcon} size={13} color={Luxe.goldBright} />
          <Text style={styles.weatherText}>
            {weather.temperatureC}°C · {weather.label}
          </Text>
        </View>
        <View style={styles.conciergeChip}>
          <Ionicons name="sparkles-outline" size={11} color={Luxe.gold} />
          <Text style={styles.conciergeText} numberOfLines={1}>{conciergeRec}</Text>
        </View>
      </View>

      {/* Stat strip */}
      <View style={styles.statStrip}>
        <HeroStat value={String(SPOTS.length)} label="Spots curated" />
        <View style={styles.statDivider} />
        <HeroStat value={String(plannedCount)} label="In your plan" />
        <View style={styles.statDivider} />
        <HeroStat value="24" unit="/7" label="Concierge" />
      </View>
    </View>
  );
}

function weatherIconFor(label: string): IconName {
  const l = label.toLowerCase();
  if (l.includes('thunder')) return 'thunderstorm-outline';
  if (l.includes('snow')) return 'snow-outline';
  if (l.includes('rain') || l.includes('shower') || l.includes('drizzle'))
    return 'rainy-outline';
  if (l.includes('mist') || l.includes('fog')) return 'cloudy-outline';
  if (l.includes('overcast') || l.includes('cloud')) return 'cloud-outline';
  if (l.includes('partly')) return 'partly-sunny-outline';
  return 'sunny-outline';
}

function HeroStat({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>
        {value}
        {unit ? <Text style={styles.statUnit}>{unit}</Text> : null}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function CategoryRail({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.catScroll}
      style={styles.catRail}
    >
      {CATEGORIES.map((cat) => {
        const isActive = cat.id === active;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            style={[styles.catChip, isActive && styles.catChipActive]}
          >
            <Ionicons
              name={cat.icon}
              size={13}
              color={isActive ? '#1A1206' : Luxe.titanium}
            />
            <Text style={[styles.catLabel, isActive && styles.catLabelActive]}>
              {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function SectionHeader({ kicker, title, hint }: { kicker: string; title: string; hint?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionKicker}>{kicker}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
    </View>
  );
}

function SpotCard({
  spot,
  saved,
  onSave,
}: {
  spot: Spot;
  saved: boolean;
  onSave: () => void;
}) {
  const planned = usePlanStore((s) => s.isPlanned(spot.id));
  const togglePlan = usePlanStore((s) => s.togglePlan);

  const { distanceLabel, etaLabel } = useMemo(() => {
    const km = haversineKm(HOTEL_COORDS, { lat: spot.lat, lng: spot.lng });
    return {
      distanceLabel: formatKm(km),
      etaLabel: formatDuration(estimateDriveMinutes(km)),
    };
  }, [spot.lat, spot.lng]);

  const openDirections = () => {
    void Haptics.selectionAsync();
    const label = encodeURIComponent(spot.name);
    const url =
      Platform.OS === 'ios'
        ? `maps://?daddr=${spot.lat},${spot.lng}&q=${label}`
        : `google.navigation:q=${spot.lat},${spot.lng}(${label})`;
    void Linking.openURL(url).catch(() => {
      void Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}&destination_name=${label}`,
      );
    });
  };

  const onAddToPlan = () => {
    const nowPlanned = togglePlan(spot.id);
    void Haptics.impactAsync(
      nowPlanned ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    );
  };

  return (
    <View style={styles.spotCard}>
      {/* Photo panel */}
      {spot.backgroundImage ? (
        <View style={styles.spotPhoto}>
          <ExpoImage
            source={spot.backgroundImage}
            style={[StyleSheet.absoluteFill, styles.spotPhotoBg]}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
            transition={180}
            recyclingKey={spot.id}
          />
          <LinearGradient
            colors={['rgba(6,5,3,0.10)', 'rgba(6,5,3,0.55)', 'rgba(4,3,1,0.88)']}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.spotPhotoContent}>
            <View style={styles.spotPhotoIcon}>
              <Ionicons name={spot.icon} size={22} color="rgba(255,240,210,0.70)" />
            </View>
            <View style={styles.spotEtaBadge}>
              <Ionicons name="navigate-outline" size={11} color={Luxe.gold} />
              <Text style={styles.spotEtaText}>{etaLabel} from hotel</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.spotPhoto}>
          <LinearGradient
            colors={[spot.gradC, spot.gradB, spot.gradA]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['transparent', 'rgba(8,7,10,0.78)']}
            locations={[0.25, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.spotPhotoContent}>
            <View style={styles.spotPhotoIcon}>
              <Ionicons name={spot.icon} size={22} color="rgba(255,240,210,0.70)" />
            </View>
            <View style={styles.spotEtaBadge}>
              <Ionicons name="navigate-outline" size={11} color={Luxe.gold} />
              <Text style={styles.spotEtaText}>{etaLabel} from hotel</Text>
            </View>
          </View>
        </View>
      )}

      {/* Body */}
      <View style={styles.spotBody}>
        <View style={styles.spotTitleRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.spotName}>{spot.name}</Text>
            <Text style={styles.spotSubtitle} numberOfLines={1}>{spot.subtitle}</Text>
          </View>
          <Pressable onPress={onSave} style={styles.saveBtn} hitSlop={8}>
            <Ionicons
              name={saved ? 'heart' : 'heart-outline'}
              size={18}
              color={saved ? '#E84C6A' : Luxe.titanium}
            />
          </Pressable>
        </View>

        {/* Meta strip */}
        <View style={styles.spotMeta}>
          <View style={styles.spotMetaItem}>
            <Ionicons name="location-outline" size={11} color={Luxe.gold} />
            <Text style={styles.spotMetaText}>{distanceLabel}</Text>
          </View>
          <View style={styles.spotMetaDot} />
          <View style={styles.spotMetaItem}>
            <Ionicons name="time-outline" size={11} color={Luxe.gold} />
            <Text style={styles.spotMetaText}>{etaLabel}</Text>
          </View>
          <View style={styles.spotMetaDot} />
          <View style={styles.spotMetaItem}>
            <Ionicons name="star" size={11} color={Luxe.gold} />
            <Text style={styles.spotMetaText}>{spot.rating} ({spot.ratingCount})</Text>
          </View>
        </View>

        {/* Why visit */}
        <View style={styles.whyBlock}>
          <Text style={styles.whyLabel}>WHY VISIT</Text>
          <Text style={styles.whyText}>{spot.whyVisit}</Text>
        </View>

        {/* Actions */}
        <View style={styles.spotActions}>
          <Pressable onPress={openDirections} style={styles.spotActPrimary}>
            <LinearGradient
              colors={['#F4C97E', '#D4A857', '#9A7A3F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="navigate-outline" size={14} color="#1A1206" />
            <Text style={styles.spotActPrimaryLabel}>Get Directions</Text>
          </Pressable>
          <Pressable
            onPress={onAddToPlan}
            style={[styles.spotActSecondary, planned && styles.spotActSecondaryActive]}
          >
            <Ionicons
              name={planned ? 'checkmark-circle' : 'calendar-outline'}
              size={14}
              color={Luxe.goldBright}
            />
            <Text style={styles.spotActSecondaryLabel}>
              {planned ? 'Added to plan' : 'Add to Plan'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ThreeDMapModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(6, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedX.value + e.translationX;
      translateY.value = savedY.value + e.translationY;
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const combined = Gesture.Simultaneous(pan, pinch);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleClose = () => {
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedX.value = 0;
    savedY.value = 0;
    onClose();
  };

  const resetZoom = () => {
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedX.value = 0;
    savedY.value = 0;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.modalBg}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalKicker}>3D Hotel Map</Text>
              <Text style={styles.modalTitle}>Hotel Kodai International</Text>
            </View>
            <View style={styles.modalHeaderActions}>
              <Pressable onPress={resetZoom} style={styles.modalActionBtn} hitSlop={8}>
                <Ionicons name="scan-outline" size={18} color={Luxe.ivoryDim} />
              </Pressable>
              <Pressable onPress={handleClose} style={styles.modalCloseBtn} hitSlop={8}>
                <Ionicons name="close" size={20} color={Luxe.ivory} />
              </Pressable>
            </View>
          </View>

          {/* Gesture image */}
          <GestureDetector gesture={combined}>
            <View style={styles.modalImageArea}>
              <AnimatedExpoImage
                source={require('../../assets/2-map.jpg')}
                style={[styles.modalImage, animStyle]}
                contentFit="contain"
                cachePolicy="memory-disk"
                priority="high"
                recyclingKey="hotel-map"
              />
            </View>
          </GestureDetector>

          {/* Hint footer */}
          <View style={styles.modalFooter}>
            <Ionicons name="hand-left-outline" size={12} color={Luxe.muted} />
            <Text style={styles.modalHint}>Pinch to zoom · Drag to pan · Double-tap reset</Text>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function MapSection() {
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const mapW = SW - 48;
  const hx = mapW * 0.44;
  const hy = 108;
  const mapH = 216;

  const labelFor = (id: string): string => {
    const spot = SPOTS.find((s) => s.id === id);
    if (!spot) return '';
    const km = haversineKm(HOTEL_COORDS, { lat: spot.lat, lng: spot.lng });
    return formatDuration(estimateDriveMinutes(km));
  };

  const mapSpots = [
    { name: 'Lake', x: mapW * 0.78, y: 84, color: '#3A8FBF', label: labelFor('lake') },
    { name: "Coaker's", x: mapW * 0.24, y: 152, color: '#D4A857', label: labelFor('coakers') },
    { name: 'Bryant', x: mapW * 0.17, y: 68, color: '#7FA85A', label: labelFor('bryant') },
    { name: 'Pillar Rocks', x: mapW * 0.62, y: 172, color: '#A0987A', label: labelFor('pillar') },
  ];

  const openMaps = () => {
    const url =
      Platform.OS === 'ios'
        ? 'maps://maps.apple.com/?ll=10.2404,77.4897&q=Kodai+International'
        : 'geo:10.2404,77.4897?q=Kodai+International';
    void Linking.openURL(url);
  };

  return (
    <View style={styles.mapCard}>
      {/* 3D hotel view — tap to expand */}
      <Pressable
        onPress={() => {
          void Haptics.selectionAsync();
          setMapModalVisible(true);
        }}
        style={styles.view3DBtn}
      >
        <ExpoImage
          source={require('../../assets/2-map.jpg')}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="high"
          recyclingKey="hotel-map"
        />
        <LinearGradient
          colors={['rgba(8,7,10,0.08)', 'rgba(8,7,10,0.72)']}
          locations={[0, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.view3DContent}>
          <View style={{ flex: 1 }}>
            <View style={styles.view3DBadge}>
              <Ionicons name="cube-outline" size={10} color={Luxe.goldBright} />
              <Text style={styles.view3DBadgeText}>3D Hotel Map</Text>
            </View>
            <Text style={styles.view3DTitle}>Hotel Kodai International</Text>
            <Text style={styles.view3DSub}>Tap to explore · Pinch & drag to navigate</Text>
          </View>
          <View style={styles.view3DExpandRing}>
            <Ionicons name="expand-outline" size={20} color={Luxe.goldBright} />
          </View>
        </View>
      </Pressable>

      <ThreeDMapModal visible={mapModalVisible} onClose={() => setMapModalVisible(false)} />

      <Svg width={mapW} height={mapH}>
        <Defs>
          <RadialGradient id="hotelGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={Luxe.goldBright} stopOpacity={0.5} />
            <Stop offset="100%" stopColor={Luxe.goldBright} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Background */}
        <Rect x={0} y={0} width={mapW} height={mapH} fill="#09080A" />

        {/* Grid lines */}
        {Array.from({ length: 9 }, (_, i) => (
          <Line
            key={`h${i}`}
            x1={0} y1={i * 27} x2={mapW} y2={i * 27}
            stroke="rgba(255,240,210,0.04)" strokeWidth={0.5}
          />
        ))}
        {Array.from({ length: 15 }, (_, i) => (
          <Line
            key={`v${i}`}
            x1={i * 28} y1={0} x2={i * 28} y2={mapH}
            stroke="rgba(255,240,210,0.04)" strokeWidth={0.5}
          />
        ))}

        {/* Roads */}
        <Line x1={0} y1={hy + 6} x2={mapW} y2={hy - 14} stroke="rgba(255,240,210,0.10)" strokeWidth={2} />
        <Line x1={hx - 18} y1={0} x2={hx + 18} y2={mapH} stroke="rgba(255,240,210,0.10)" strokeWidth={2} />
        <Line x1={0} y1={hy - 55} x2={mapW} y2={hy - 40} stroke="rgba(255,240,210,0.06)" strokeWidth={1} />
        <Line x1={0} y1={hy + 54} x2={mapW} y2={hy + 38} stroke="rgba(255,240,210,0.06)" strokeWidth={1} />
        <Line x1={hx - 85} y1={0} x2={hx - 55} y2={mapH} stroke="rgba(255,240,210,0.05)" strokeWidth={1} />

        {/* Dashed lines from hotel to each spot */}
        {mapSpots.map((s) => (
          <Line
            key={`dash-${s.name}`}
            x1={hx} y1={hy} x2={s.x} y2={s.y}
            stroke="rgba(255,240,210,0.07)"
            strokeWidth={0.8}
            strokeDasharray="4,5"
          />
        ))}

        {/* Spot dots + labels */}
        {mapSpots.map((s) => (
          <G key={`spot-${s.name}`}>
            <Circle cx={s.x} cy={s.y} r={9} fill={s.color} opacity={0.12} />
            <Circle cx={s.x} cy={s.y} r={4.5} fill={s.color} opacity={0.90} />
            <SvgLabel
              x={s.x + 9}
              y={s.y - 5}
              fontSize={8}
              fill="rgba(255,240,210,0.55)"
            >
              {s.name}
            </SvgLabel>
            <SvgLabel
              x={s.x + 9}
              y={s.y + 6}
              fontSize={7}
              fill={s.color}
            >
              {s.label}
            </SvgLabel>
          </G>
        ))}

        {/* Hotel glow */}
        <Circle cx={hx} cy={hy} r={28} fill="url(#hotelGlow)" />
        <Circle cx={hx} cy={hy} r={15} fill="rgba(244,201,126,0.12)" stroke={Luxe.goldBright} strokeWidth={0.8} />
        <Circle cx={hx} cy={hy} r={5} fill={Luxe.goldBright} />
        <SvgLabel
          x={hx}
          y={hy + 28}
          fontSize={7.5}
          fill={Luxe.gold}
          textAnchor="middle"
        >
          HKI · ANNA SALAI
        </SvgLabel>
      </Svg>

      {/* Map actions */}
      <View style={styles.mapActions}>
        <Pressable onPress={openMaps} style={styles.mapActPrimary}>
          <LinearGradient
            colors={['#F4C97E', '#D4A857', '#9A7A3F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="map-outline" size={14} color="#1A1206" />
          <Text style={styles.mapActPrimaryLabel}>Open in Maps</Text>
        </Pressable>
        <Pressable onPress={openMaps} style={styles.mapActSecondary}>
          <Ionicons name="navigate-outline" size={14} color={Luxe.goldBright} />
          <Text style={styles.mapActSecondaryLabel}>Directions</Text>
        </Pressable>
        <Pressable onPress={openMaps} style={styles.mapActSecondary}>
          <Ionicons name="location-outline" size={14} color={Luxe.goldBright} />
          <Text style={styles.mapActSecondaryLabel}>View Nearby</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TransportGrid({ onBook }: { onBook: (p: ServiceBookingPayload) => void }) {
  const cardW = (SW - 60) / 2;
  return (
    <View style={styles.transportGrid}>
      {TRANSPORT.map((t) => {
        const price = parseTransportPrice(t.fare);
        return (
        <Pressable
          key={t.id}
          onPress={() => onBook({ type: 'transport', name: t.label, price, etaMinutes: 15, notes: `${t.label} · ${t.sub} · ${t.fare}` })}
          style={[styles.transportCard, { width: cardW }]}
        >
          <LinearGradient
            colors={[t.gradFrom, t.gradTo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: LuxeRadii.lg }]}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: LuxeRadii.lg, borderWidth: 0.5, borderColor: t.borderColor },
            ]}
            pointerEvents="none"
          />
          <View style={styles.transportIcon}>
            <Ionicons name={t.icon} size={20} color={Luxe.goldBright} />
          </View>
          <Text style={styles.transportLabel}>{t.label}</Text>
          <Text style={styles.transportSub} numberOfLines={1}>{t.sub}</Text>
          <View style={styles.transportFareRow}>
            <Text style={styles.transportFare}>{t.fare}</Text>
            <View style={styles.transportArrow}>
              <Ionicons name="arrow-forward" size={11} color={Luxe.goldBright} />
            </View>
          </View>
        </Pressable>
        );
      })}
    </View>
  );
}

function parseTransportPrice(fare: string): number {
  // Pull the first integer out of strings like "₹150–250", "₹3,800 / day", "From ₹4,500".
  const cleaned = fare.replace(/,/g, '');
  const match = cleaned.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function GuidesSection({ onBook }: { onBook: (p: ServiceBookingPayload) => void }) {
  return (
    <View style={styles.guidesList}>
      {GUIDES.map((g, i) => (
        <Pressable
          key={g.id}
          disabled={!g.avail}
          onPress={() =>
            onBook({
              type: 'concierge',
              name: g.label,
              price: parseTransportPrice(g.price),
              etaMinutes: 30,
              notes: `${g.label} · ${g.desc} · ${g.duration}`,
            })
          }
          style={[
            styles.guideRow,
            i === 0 && { borderTopWidth: 0.5, borderTopColor: Luxe.hairlineStrong },
            !g.avail && { opacity: 0.45 },
          ]}
        >
          <View style={[styles.guideIcon, !g.avail && styles.guideIconDim]}>
            <Ionicons
              name={g.icon}
              size={18}
              color={g.avail ? Luxe.goldBright : Luxe.titanium}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.guideTitleRow}>
              <Text style={styles.guideLabel}>{g.label}</Text>
              {!g.avail && (
                <View style={styles.unavailPill}>
                  <Text style={styles.unavailText}>Unavailable</Text>
                </View>
              )}
            </View>
            <Text style={styles.guideDesc}>{g.desc}</Text>
            <View style={styles.guideMeta}>
              <Text style={styles.guideMetaItem}>{g.duration}</Text>
              <Text style={styles.guideSep}>·</Text>
              <Text style={styles.guideMetaItem}>{g.lang}</Text>
            </View>
          </View>
          <View style={styles.guideRight}>
            <Text style={styles.guidePrice}>{g.price}</Text>
            {g.avail && (
              <View style={styles.guideBookBtn}>
                <Text style={styles.guideBookLabel}>Book</Text>
              </View>
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function ExperiencesRail({ onBook }: { onBook: (p: ServiceBookingPayload) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.expScroll}
      style={styles.expRail}
    >
      {EXPERIENCES.map((exp) => (
        <Pressable
          key={exp.id}
          onPress={() =>
            onBook({
              type: 'concierge',
              name: exp.title,
              price: 0,
              etaMinutes: 45,
              notes: `${exp.title} · ${exp.desc} · ${exp.tag}`,
            })
          }
          style={styles.expCard}
        >
          {exp.backgroundImage ? (
            <ExpoImage
              source={exp.backgroundImage}
              style={[StyleSheet.absoluteFill, styles.expBgImage]}
              contentFit="cover"
              cachePolicy="memory-disk"
              priority="high"
              transition={180}
              recyclingKey={`exp-${exp.id}`}
            />
          ) : null}
          <LinearGradient
            colors={[exp.gradA, exp.gradB]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: LuxeRadii.xl, opacity: exp.backgroundImage ? 0.42 : 1 }]}
          />
          {exp.backgroundImage ? (
            <>
              {/* top scrim — keeps icon + tag chips legible */}
              <LinearGradient
                colors={['rgba(4,3,1,0.72)', 'rgba(4,3,1,0.22)', 'transparent']}
                locations={[0, 0.30, 0.58]}
                style={[StyleSheet.absoluteFill, { borderRadius: LuxeRadii.xl }]}
              />
              {/* bottom scrim — keeps title + desc + CTA legible */}
              <LinearGradient
                colors={['transparent', 'rgba(5,3,1,0.72)', 'rgba(3,2,0,0.96)']}
                locations={[0.32, 0.62, 1]}
                style={[StyleSheet.absoluteFill, { borderRadius: LuxeRadii.xl }]}
              />
            </>
          ) : null}
          {/* gold top hairline */}
          <View style={styles.expHairline} pointerEvents="none" />
          <View
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: LuxeRadii.xl, borderWidth: 0.5, borderColor: 'rgba(255,240,210,0.10)' },
            ]}
            pointerEvents="none"
          />
          <View style={styles.expTop}>
            <View style={[styles.expIconBox, exp.backgroundImage ? styles.expIconBoxOnImage : null]}>
              <Ionicons name={exp.icon} size={18} color={Luxe.goldBright} />
            </View>
            <View style={[styles.expTagPill, exp.backgroundImage ? styles.expTagPillOnImage : null]}>
              <Text style={[styles.expTag, exp.backgroundImage ? styles.expTextOnImage : null]}>{exp.tag}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }} />
          <Text style={[styles.expKicker, exp.backgroundImage ? styles.expTextOnImage : null]}>{exp.kicker}</Text>
          <Text style={[styles.expTitle, exp.backgroundImage ? styles.expTitleOnImage : null]}>{exp.title}</Text>
          <Text style={[styles.expDesc, exp.backgroundImage ? styles.expDescOnImage : null]} numberOfLines={2}>{exp.desc}</Text>
          <View style={[styles.expCta, exp.backgroundImage ? styles.expCtaOnImage : null]}>
            <Text style={styles.expCtaLabel}>Arrange →</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function SaveAndPlanSection() {
  const plannedIds = usePlanStore((s) => s.spotIds);
  const clearPlan = usePlanStore((s) => s.clearPlan);
  const plannedSpots = SPOTS.filter((s) => plannedIds.includes(s.id));
  const count = plannedSpots.length;

  const openRoute = () => {
    if (count === 0) return;
    void Haptics.selectionAsync();
    const origin = `${HOTEL_COORDS.lat},${HOTEL_COORDS.lng}`;
    const waypoints = plannedSpots
      .slice(0, -1)
      .map((s) => `${s.lat},${s.lng}`)
      .join('|');
    const dest = plannedSpots[plannedSpots.length - 1];
    const destStr = dest ? `${dest.lat},${dest.lng}` : origin;
    const params = new URLSearchParams({
      api: '1',
      origin,
      destination: destStr,
      travelmode: 'driving',
    });
    if (waypoints) params.append('waypoints', waypoints);
    void Linking.openURL(`https://www.google.com/maps/dir/?${params.toString()}`);
  };

  const onClear = () => {
    if (count === 0) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearPlan();
  };

  return (
    <View style={styles.savePlan}>
      <LinearGradient
        colors={['rgba(244,201,126,0.11)', 'rgba(139,111,71,0.04)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: LuxeRadii.xl }]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: LuxeRadii.xl, borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.20)' },
        ]}
        pointerEvents="none"
      />
      <Text style={styles.savePlanTitle}>
        {count === 0
          ? 'Build your day'
          : count === 1
            ? '1 spot in your plan'
            : `${count} spots in your plan`}
      </Text>
      <Text style={styles.savePlanSub}>
        {count === 0
          ? 'Tap “Add to Plan” on any spot to start your itinerary.'
          : plannedSpots.map((s) => s.name).join(' · ')}
      </Text>
      <View style={styles.savePlanActions}>
        <Pressable
          onPress={openRoute}
          disabled={count === 0}
          style={[styles.savePlanBtn, count === 0 && { opacity: 0.4 }]}
        >
          <Ionicons name="navigate-outline" size={16} color={Luxe.goldBright} />
          <Text style={styles.savePlanBtnLabel}>Open route</Text>
        </Pressable>
        <Pressable
          onPress={onClear}
          disabled={count === 0}
          style={[styles.savePlanBtn, count === 0 && { opacity: 0.4 }]}
        >
          <Ionicons name="trash-outline" size={16} color={Luxe.goldBright} />
          <Text style={styles.savePlanBtnLabel}>Clear plan</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },

  // ── HERO ──────────────────────────────────────────────────────────────────
  hero: { overflow: 'hidden', paddingBottom: 28 },

  heroRingOuter: {
    position: 'absolute', right: -90, top: 8,
    width: 240, height: 240, borderRadius: 120,
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.09)',
  },
  heroRingMid: {
    position: 'absolute', right: -30, top: 55,
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.07)',
  },
  heroRingInner: {
    position: 'absolute', right: -6, top: 74,
    width: 92, height: 92, borderRadius: 46,
    overflow: 'hidden',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20,
  },
  glassPill: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(20,18,15,0.55)',
    borderWidth: 0.5, borderColor: 'rgba(255,240,210,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  locationChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9999,
    backgroundColor: 'rgba(20,18,15,0.55)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.22)',
  },
  locationText: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 10,
    color: Luxe.ivoryDim, letterSpacing: 1, textTransform: 'uppercase',
  },
  heroTitleBlock: { paddingHorizontal: 24, marginTop: 28 },
  heroKicker: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 9.5,
    color: Luxe.gold, letterSpacing: 2.4,
    textTransform: 'uppercase', marginBottom: 14,
  },
  heroTitle: {
    fontFamily: LuxeFonts.serif, fontSize: 48,
    lineHeight: 50, color: Luxe.ivory, letterSpacing: -1.4,
  },
  heroTitleItalic: { fontFamily: LuxeFonts.serifItalic, color: Luxe.goldBright },
  heroSub: {
    fontFamily: LuxeFonts.sansLight, fontSize: 13.5,
    lineHeight: 20, color: Luxe.ivoryDim, marginTop: 12, maxWidth: 300,
  },
  heroChips: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 24, marginTop: 22, flexWrap: 'wrap',
  },
  weatherChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9999,
    backgroundColor: 'rgba(20,18,15,0.62)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.24)',
  },
  weatherText: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 11,
    color: Luxe.ivoryDim, letterSpacing: 0.4,
  },
  conciergeChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9999,
    backgroundColor: 'rgba(20,18,15,0.60)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.14)',
  },
  conciergeText: {
    fontFamily: LuxeFonts.sansLight, fontSize: 12, color: Luxe.titanium, flex: 1,
  },
  statStrip: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 24, marginTop: 24,
    paddingVertical: 18, paddingHorizontal: 22,
    borderRadius: 22, borderWidth: 0.5, borderColor: Luxe.hairlineStrong,
    backgroundColor: 'rgba(21,19,15,0.60)',
  },
  statCell: { flex: 1 },
  statValue: {
    fontFamily: LuxeFonts.serif, fontSize: 21,
    color: Luxe.ivory, letterSpacing: -0.5,
  },
  statUnit: { fontFamily: LuxeFonts.monoMedium, fontSize: 10, color: Luxe.gold },
  statLabel: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 8.5,
    color: Luxe.muted, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 5,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth, height: 30, backgroundColor: Luxe.hairlineStrong,
  },

  // ── CATEGORIES ────────────────────────────────────────────────────────────
  catRail: { flexGrow: 0, marginTop: 26 },
  catScroll: { gap: 9, paddingHorizontal: 20, paddingVertical: 2 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 9999,
    backgroundColor: 'rgba(21,19,15,0.85)',
    borderWidth: 0.5, borderColor: Luxe.hairlineStrong,
  },
  catChipActive: { backgroundColor: Luxe.goldBright, borderColor: Luxe.goldBright },
  catLabel: {
    fontFamily: LuxeFonts.sansMedium, fontSize: 12.5,
    color: Luxe.titanium, letterSpacing: 0.2,
  },
  catLabelActive: { color: '#1A1206' },

  // ── SECTION HEADER ────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 24, marginTop: 42, marginBottom: 18,
  },
  sectionKicker: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 9.5,
    color: Luxe.gold, letterSpacing: 2.2, textTransform: 'uppercase', marginBottom: 6,
  },
  sectionTitle: {
    fontFamily: LuxeFonts.serif, fontSize: 26,
    lineHeight: 28, color: Luxe.ivory, letterSpacing: -0.5,
  },
  sectionHint: {
    fontFamily: LuxeFonts.sansLight, fontSize: 11, color: Luxe.muted, marginBottom: 4,
  },

  // ── SPOT CARDS ────────────────────────────────────────────────────────────
  spotCard: {
    marginHorizontal: 24, marginBottom: 18,
    borderRadius: LuxeRadii.xl, overflow: 'hidden',
    backgroundColor: Luxe.softBlack,
    borderWidth: 0.5, borderColor: Luxe.hairlineStrong,
    ...Platform.select({
      ios: {
        shadowColor: '#000', shadowOpacity: 0.45,
        shadowRadius: 24, shadowOffset: { width: 0, height: 12 },
      },
      android: { elevation: 8 },
    }),
  },
  spotPhoto: {
    height: 188, overflow: 'hidden',
    borderTopLeftRadius: LuxeRadii.xl, borderTopRightRadius: LuxeRadii.xl,
  },
  spotPhotoBg: {
    borderTopLeftRadius: LuxeRadii.xl, borderTopRightRadius: LuxeRadii.xl,
    opacity: 0.78,
  },
  spotPhotoContent: {
    flex: 1, padding: 16,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  spotPhotoIcon: {
    width: 46, height: 46, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(8,7,10,0.48)',
    borderWidth: 0.5, borderColor: 'rgba(255,240,210,0.14)',
  },
  spotEtaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999,
    backgroundColor: 'rgba(8,7,10,0.58)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.28)',
  },
  spotEtaText: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 10, color: Luxe.gold, letterSpacing: 0.4,
  },
  spotBody: { padding: 20 },
  spotTitleRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 12,
  },
  spotName: {
    fontFamily: LuxeFonts.serif, fontSize: 24, color: Luxe.ivory, letterSpacing: -0.5,
  },
  spotSubtitle: {
    fontFamily: LuxeFonts.sansLight, fontSize: 12.5, color: Luxe.titanium, marginTop: 3,
  },
  saveBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,240,210,0.05)',
    borderWidth: 0.5, borderColor: Luxe.hairlineStrong, marginTop: 2,
  },
  spotMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  spotMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  spotMetaText: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 10, color: Luxe.ivoryDim, letterSpacing: 0.3,
  },
  spotMetaDot: {
    width: 3, height: 3, borderRadius: 1.5, backgroundColor: Luxe.muted,
  },
  whyBlock: {
    marginTop: 16, paddingTop: 14,
    borderTopWidth: 0.5, borderTopColor: Luxe.hairline,
  },
  whyLabel: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 8.5,
    color: Luxe.gold, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 7,
  },
  whyText: {
    fontFamily: LuxeFonts.sansLight, fontSize: 13, lineHeight: 19, color: Luxe.ivoryDim,
  },
  spotActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  spotActPrimary: {
    flex: 1, height: 46, borderRadius: 14, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
  },
  spotActPrimaryLabel: {
    fontFamily: LuxeFonts.sansSemibold, fontSize: 13, color: '#1A1206', letterSpacing: 0.3,
  },
  spotActSecondary: {
    flex: 1, height: 46, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: 'rgba(244,201,126,0.07)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.22)',
  },
  spotActSecondaryActive: {
    backgroundColor: 'rgba(244,201,126,0.18)',
    borderColor: 'rgba(244,201,126,0.55)',
  },
  spotActSecondaryLabel: {
    fontFamily: LuxeFonts.sansMedium, fontSize: 13, color: Luxe.goldBright,
  },

  // ── MAP ───────────────────────────────────────────────────────────────────
  view3DBtn: {
    height: 190, overflow: 'hidden',
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(244,201,126,0.12)',
  },
  view3DContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 16, gap: 12,
  },
  view3DBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9999,
    backgroundColor: 'rgba(8,7,10,0.60)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.28)',
    marginBottom: 8,
  },
  view3DBadgeText: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 8.5,
    color: Luxe.gold, letterSpacing: 1, textTransform: 'uppercase',
  },
  view3DTitle: {
    fontFamily: LuxeFonts.serif, fontSize: 17, color: Luxe.ivory, letterSpacing: -0.3,
  },
  view3DSub: {
    fontFamily: LuxeFonts.sansLight, fontSize: 11, color: Luxe.ivoryDim, marginTop: 3,
  },
  view3DExpandRing: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(8,7,10,0.55)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.38)',
  },

  // ── 3D MAP MODAL ─────────────────────────────────────────────────────────
  modalBg: {
    flex: 1, backgroundColor: 'rgba(6,5,8,0.96)',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,240,210,0.08)',
  },
  modalKicker: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 9.5,
    color: Luxe.gold, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4,
  },
  modalTitle: {
    fontFamily: LuxeFonts.serif, fontSize: 20, color: Luxe.ivory, letterSpacing: -0.4,
  },
  modalHeaderActions: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  modalActionBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,240,210,0.06)',
    borderWidth: 0.5, borderColor: 'rgba(255,240,210,0.10)',
  },
  modalCloseBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,240,210,0.08)',
    borderWidth: 0.5, borderColor: 'rgba(255,240,210,0.14)',
  },
  modalImageArea: {
    flex: 1, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  modalImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.72,
  },
  modalFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 18,
    borderTopWidth: 0.5, borderTopColor: 'rgba(255,240,210,0.08)',
  },
  modalHint: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 9.5,
    color: Luxe.muted, letterSpacing: 0.8,
  },

  mapCard: {
    marginHorizontal: 24, borderRadius: LuxeRadii.xl, overflow: 'hidden',
    backgroundColor: '#09080A',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.20)',
  },
  mapActions: {
    flexDirection: 'row', gap: 10, padding: 16,
    borderTopWidth: 0.5, borderTopColor: 'rgba(255,240,210,0.07)',
  },
  mapActPrimary: {
    flex: 1, height: 42, borderRadius: 12, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
  },
  mapActPrimaryLabel: {
    fontFamily: LuxeFonts.sansSemibold, fontSize: 12.5, color: '#1A1206', letterSpacing: 0.3,
  },
  mapActSecondary: {
    flex: 1, height: 42, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(244,201,126,0.07)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.20)',
  },
  mapActSecondaryLabel: {
    fontFamily: LuxeFonts.sansMedium, fontSize: 12, color: Luxe.goldBright,
  },

  // ── TRANSPORT ─────────────────────────────────────────────────────────────
  transportGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 24, gap: 12,
  },
  transportCard: {
    padding: 18, borderRadius: LuxeRadii.lg, overflow: 'hidden',
    backgroundColor: Luxe.softBlack,
  },
  transportIcon: {
    width: 46, height: 46, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.07)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.22)', marginBottom: 14,
  },
  transportLabel: {
    fontFamily: LuxeFonts.serif, fontSize: 16, color: Luxe.ivory, letterSpacing: -0.3,
  },
  transportSub: {
    fontFamily: LuxeFonts.sansLight, fontSize: 11.5, color: Luxe.titanium, marginTop: 3,
  },
  transportFareRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14, paddingTop: 12,
    borderTopWidth: 0.5, borderTopColor: 'rgba(255,240,210,0.07)',
  },
  transportFare: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 11, color: Luxe.gold, letterSpacing: 0.3,
  },
  transportArrow: {
    width: 28, height: 28, borderRadius: 9999,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.08)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.22)',
  },

  // ── GUIDES ────────────────────────────────────────────────────────────────
  guidesList: { paddingHorizontal: 24 },
  guideRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingVertical: 18,
    borderBottomWidth: 0.5, borderBottomColor: Luxe.hairlineStrong,
  },
  guideIcon: {
    width: 48, height: 48, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.07)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.18)',
  },
  guideIconDim: {
    backgroundColor: 'rgba(92,89,79,0.08)',
    borderColor: 'rgba(92,89,79,0.18)',
  },
  guideTitleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap',
  },
  guideLabel: {
    fontFamily: LuxeFonts.serif, fontSize: 18, color: Luxe.ivory, letterSpacing: -0.3,
  },
  guideDesc: {
    fontFamily: LuxeFonts.sansLight, fontSize: 12, color: Luxe.titanium, marginTop: 3,
  },
  guideMeta: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 7 },
  guideMetaItem: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 9.5, color: Luxe.muted, letterSpacing: 0.5,
  },
  guideSep: {
    fontFamily: LuxeFonts.mono, fontSize: 9.5, color: Luxe.muted,
  },
  unavailPill: {
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9999,
    backgroundColor: 'rgba(92,89,79,0.12)',
    borderWidth: 0.5, borderColor: 'rgba(92,89,79,0.24)',
  },
  unavailText: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 8,
    color: Luxe.muted, letterSpacing: 0.8, textTransform: 'uppercase',
  },
  guideRight: { alignItems: 'flex-end', gap: 8 },
  guidePrice: {
    fontFamily: LuxeFonts.serif, fontSize: 18, color: Luxe.gold, letterSpacing: -0.3,
  },
  guideBookBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999,
    backgroundColor: 'rgba(244,201,126,0.10)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.28)',
  },
  guideBookLabel: {
    fontFamily: LuxeFonts.sansMedium, fontSize: 12, color: Luxe.goldBright,
  },

  // ── EXPERIENCES ───────────────────────────────────────────────────────────
  expRail: { flexGrow: 0 },
  expScroll: { gap: 14, paddingHorizontal: 24, paddingBottom: 2 },
  expCard: {
    width: SW * 0.66, height: 240,
    borderRadius: LuxeRadii.xl, overflow: 'hidden',
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000', shadowOpacity: 0.45,
        shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 6 },
    }),
  },
  expBgImage: {
    borderRadius: LuxeRadii.xl,
    opacity: 0.95,
  },
  expHairline: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 1, backgroundColor: 'rgba(244,201,126,0.45)',
    zIndex: 2,
  },
  expTop: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
  },
  expIconBox: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.09)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.22)',
  },
  expIconBoxOnImage: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderColor: 'rgba(244,201,126,0.38)',
  },
  expTagPill: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999,
    backgroundColor: 'rgba(244,201,126,0.10)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.24)',
  },
  expTagPillOnImage: {
    backgroundColor: 'rgba(0,0,0,0.50)',
    borderColor: 'rgba(244,201,126,0.40)',
  },
  expTag: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 8.5,
    color: Luxe.gold, letterSpacing: 1.2, textTransform: 'uppercase',
  },
  expTextOnImage: {
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  expKicker: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 9.5,
    color: Luxe.gold, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 5,
  },
  expTitle: {
    fontFamily: LuxeFonts.serif, fontSize: 22, lineHeight: 24,
    color: Luxe.ivory, letterSpacing: -0.4,
  },
  expTitleOnImage: {
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  expDesc: {
    fontFamily: LuxeFonts.sansLight, fontSize: 11.5, lineHeight: 16.5,
    color: Luxe.ivoryDim, marginTop: 6,
  },
  expDescOnImage: {
    color: 'rgba(245,239,224,0.86)',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  expCta: {
    marginTop: 12, alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999,
    backgroundColor: 'rgba(244,201,126,0.10)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.26)',
  },
  expCtaOnImage: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderColor: 'rgba(244,201,126,0.48)',
  },
  expCtaLabel: {
    fontFamily: LuxeFonts.sansMedium, fontSize: 12, color: Luxe.goldBright,
  },

  // ── SAVE & PLAN ───────────────────────────────────────────────────────────
  savePlan: {
    marginHorizontal: 24, marginTop: 42,
    padding: 24, borderRadius: LuxeRadii.xl, overflow: 'hidden',
  },
  savePlanTitle: {
    fontFamily: LuxeFonts.serif, fontSize: 22, color: Luxe.ivory, letterSpacing: -0.4,
  },
  savePlanSub: {
    fontFamily: LuxeFonts.sansLight, fontSize: 13, lineHeight: 19,
    color: Luxe.ivoryDim, marginTop: 7,
  },
  savePlanActions: {
    flexDirection: 'row', gap: 10, marginTop: 20, flexWrap: 'wrap',
  },
  savePlanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 11, borderRadius: 13,
    backgroundColor: 'rgba(244,201,126,0.08)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.22)',
  },
  savePlanBtnLabel: {
    fontFamily: LuxeFonts.sansMedium, fontSize: 13, color: Luxe.goldBright,
  },

  // ── COMMON ────────────────────────────────────────────────────────────────
  footnote: {
    marginTop: 36, paddingHorizontal: 24,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  footText: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 9,
    color: Luxe.muted, letterSpacing: 1.6, textTransform: 'uppercase',
  },
  dockFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 180 },
  toastWrap: { position: 'absolute', left: 0, right: 0, bottom: 110, alignItems: 'center', paddingHorizontal: 24 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: 'rgba(20,18,15,0.94)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.30)',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  toastText: {
    fontFamily: LuxeFonts.sans,
    fontSize: 12.5,
    color: Luxe.ivory,
    letterSpacing: 0.2,
    flexShrink: 1,
  },
});
