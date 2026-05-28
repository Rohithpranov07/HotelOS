import { useState } from 'react';
import {
  Dimensions,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
  eta: string;
  distance: string;
  rating: string;
  ratingCount: string;
  gradA: string;
  gradB: string;
  gradC: string;
  icon: IconName;
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

const SPOTS: Spot[] = [
  {
    id: 'marina',
    categories: ['nature', 'attractions'],
    name: 'Marina Beach',
    subtitle: 'The longest natural urban beach in India.',
    whyVisit:
      'Walk 6 km of golden seafront. Best at sunrise — the light on the water is extraordinary.',
    eta: '12 min',
    distance: '4.2 km',
    rating: '4.7',
    ratingCount: '12.4k',
    gradA: '#0A1E2E',
    gradB: '#163652',
    gradC: 'rgba(30,90,140,0.65)',
    icon: 'water-outline',
  },
  {
    id: 'kapaleeshwarar',
    categories: ['culture', 'attractions'],
    name: 'Kapaleeshwarar Temple',
    subtitle: 'Dravidian architecture and living tradition.',
    whyVisit:
      'A 7th-century Shiva temple of extraordinary beauty. Visit at dusk when the air fills with incense and chanting.',
    eta: '18 min',
    distance: '5.8 km',
    rating: '4.8',
    ratingCount: '8.9k',
    gradA: '#1E1005',
    gradB: '#3C2008',
    gradC: 'rgba(160,80,20,0.60)',
    icon: 'business-outline',
  },
  {
    id: 'phoenix',
    categories: ['shopping'],
    name: 'Phoenix MarketCity',
    subtitle: 'Premium retail and curated dining.',
    whyVisit:
      "Luxury brands, artisan food courts and rooftop dining — Chennai's finest under one roof.",
    eta: '9 min',
    distance: '3.1 km',
    rating: '4.5',
    ratingCount: '22.1k',
    gradA: '#0E0C16',
    gradB: '#161224',
    gradC: 'rgba(80,60,140,0.50)',
    icon: 'bag-handle-outline',
  },
  {
    id: 'mahabalipuram',
    categories: ['culture', 'hidden'],
    name: 'Mahabalipuram',
    subtitle: 'UNESCO World Heritage shore temples.',
    whyVisit:
      'Rock-cut Pallava dynasty temples set against the Bay of Bengal. Truly unmissable.',
    eta: '1 hr 10 min',
    distance: '58 km',
    rating: '4.9',
    ratingCount: '31.2k',
    gradA: '#141008',
    gradB: '#281E0C',
    gradC: 'rgba(160,120,40,0.55)',
    icon: 'trail-sign-outline',
  },
];

const TRANSPORT: Transport[] = [
  {
    id: 'cab',
    icon: 'car-outline',
    label: 'Book a Cab',
    sub: 'Arrives in ~4 min',
    fare: '₹120–180',
    gradFrom: 'rgba(244,201,126,0.16)',
    gradTo: 'rgba(139,111,71,0.03)',
    borderColor: 'rgba(244,201,126,0.28)',
  },
  {
    id: 'chauffeur',
    icon: 'car-sport-outline',
    label: 'Luxury Chauffeur',
    sub: 'Mercedes E-Class',
    fare: '₹1,200 / hr',
    gradFrom: 'rgba(139,111,71,0.22)',
    gradTo: 'rgba(244,201,126,0.04)',
    borderColor: 'rgba(212,168,87,0.28)',
  },
  {
    id: 'airport',
    icon: 'airplane-outline',
    label: 'Airport Ride',
    sub: '~35 min to MAA',
    fare: 'From ₹850',
    gradFrom: 'rgba(60,80,140,0.18)',
    gradTo: 'rgba(40,60,110,0.04)',
    borderColor: 'rgba(100,120,200,0.22)',
  },
  {
    id: 'rental',
    icon: 'key-outline',
    label: 'Rental Car',
    sub: 'BMW 5 Series & more',
    fare: 'From ₹3,500/day',
    gradFrom: 'rgba(92,89,79,0.18)',
    gradTo: 'rgba(70,68,60,0.04)',
    borderColor: 'rgba(154,147,138,0.22)',
  },
];

const GUIDES: Guide[] = [
  {
    id: 'cultural',
    icon: 'navigate-circle-outline',
    label: 'Cultural Guide',
    desc: 'Temples, heritage and living traditions',
    duration: '4–6 hr',
    price: '₹2,800',
    lang: 'EN · HI · TA',
    avail: true,
  },
  {
    id: 'food',
    icon: 'restaurant-outline',
    label: 'Food Tour Guide',
    desc: 'Street kitchens, spice bazaars, fine dining',
    duration: '3 hr',
    price: '₹1,800',
    lang: 'EN · TA',
    avail: true,
  },
  {
    id: 'photo',
    icon: 'camera-outline',
    label: 'Photography Guide',
    desc: 'Golden hour spots and architectural angles',
    duration: '3–4 hr',
    price: '₹3,200',
    lang: 'EN',
    avail: false,
  },
  {
    id: 'luxury',
    icon: 'diamond-outline',
    label: 'Luxury City Tour',
    desc: 'Private car, curated stops, white-glove service',
    duration: '6 hr',
    price: '₹6,500',
    lang: 'EN · TA',
    avail: true,
  },
  {
    id: 'shopper',
    icon: 'bag-handle-outline',
    label: 'Personal Shopper',
    desc: 'Boutiques, tailors and antique galleries',
    duration: '4 hr',
    price: '₹4,000',
    lang: 'EN',
    avail: true,
  },
];

const EXPERIENCES: Experience[] = [
  {
    id: 'sunset',
    kicker: 'Best Tonight',
    title: 'Golden Hour\nat the Seafront',
    desc: 'Marina Beach · 18:42 · Clear skies forecast',
    icon: 'sunny-outline',
    tag: 'Concierge Pick',
    gradA: '#0F2030',
    gradB: '#08121C',
  },
  {
    id: 'evening',
    kicker: 'Perfect Evening',
    title: 'Kathak\nPerformance',
    desc: 'Music Academy · 20:00 · Curated by the hotel',
    icon: 'musical-notes-outline',
    tag: 'Exclusive',
    gradA: '#1A1228',
    gradB: '#0E0C1A',
  },
  {
    id: 'rated',
    kicker: 'Guest Favourite',
    title: 'Dakshin\nRestaurant',
    desc: '4.9 stars · Best Fine Dining 2024',
    icon: 'star-outline',
    tag: 'Highly Rated',
    gradA: '#201205',
    gradB: '#120A03',
  },
  {
    id: 'walk',
    kicker: 'Local Secret',
    title: 'Mylapore\nMarket Walk',
    desc: 'Silk, antiques and spice bazaars with a guide',
    icon: 'navigate-outline',
    tag: 'Hidden Gem',
    gradA: '#141410',
    gradB: '#0C0C08',
  },
];

// ─── MAIN SCREEN ───────────────────────────────────────────────────────────────

export default function OtherServicesScreen() {
  void useLuxeFonts();
  const [activeCategory, setActiveCategory] = useState('all');
  const [savedSpots, setSavedSpots] = useState<Set<string>>(new Set());

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
        <TransportGrid />

        <SectionHeader kicker="With an expert" title="Local guide booking" hint="All guides vetted" />
        <GuidesSection />

        <SectionHeader kicker="Tonight" title="Recommended" hint="Curated for you" />
        <ExperiencesRail />

        <SaveAndPlanSection />

        <View style={styles.footnote}>
          <Text style={styles.footText}>Hôtel Octave · Chennai</Text>
          <Text style={styles.footText}>All arrangements on request</Text>
        </View>
      </ScrollView>

      <LinearGradient
        colors={['transparent', 'rgba(8,7,10,0.85)', Luxe.obsidian]}
        locations={[0, 0.5, 0.85]}
        pointerEvents="none"
        style={styles.dockFade}
      />
    </View>
  );
}

// ─── SUB-COMPONENTS ────────────────────────────────────────────────────────────

function HeroSection() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const hour = new Date().getHours();
  const conciergeRec =
    hour < 12
      ? 'Perfect morning for a temple visit'
      : hour < 16
      ? 'Perfect weather for sightseeing'
      : 'Top experiences near your hotel tonight';

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
          <Text style={styles.locationText}>Chennai · T. Nagar</Text>
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
          <Ionicons name="partly-sunny-outline" size={13} color={Luxe.goldBright} />
          <Text style={styles.weatherText}>28°C · Partly cloudy</Text>
        </View>
        <View style={styles.conciergeChip}>
          <Ionicons name="sparkles-outline" size={11} color={Luxe.gold} />
          <Text style={styles.conciergeText} numberOfLines={1}>{conciergeRec}</Text>
        </View>
      </View>

      {/* Stat strip */}
      <View style={styles.statStrip}>
        <HeroStat value="4" label="Landmarks nearby" />
        <View style={styles.statDivider} />
        <HeroStat value="12" label="Min to beach" />
        <View style={styles.statDivider} />
        <HeroStat value="24" unit="/7" label="Concierge" />
      </View>
    </View>
  );
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
  return (
    <View style={styles.spotCard}>
      {/* Photo panel — gradient simulating photography */}
      <View style={styles.spotPhoto}>
        <LinearGradient
          colors={[spot.gradC, spot.gradB, spot.gradA]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Depth vignette */}
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
            <Text style={styles.spotEtaText}>{spot.eta} from hotel</Text>
          </View>
        </View>
      </View>

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
            <Text style={styles.spotMetaText}>{spot.distance}</Text>
          </View>
          <View style={styles.spotMetaDot} />
          <View style={styles.spotMetaItem}>
            <Ionicons name="time-outline" size={11} color={Luxe.gold} />
            <Text style={styles.spotMetaText}>{spot.eta}</Text>
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
          <Pressable style={styles.spotActPrimary}>
            <LinearGradient
              colors={['#F4C97E', '#D4A857', '#9A7A3F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="navigate-outline" size={14} color="#1A1206" />
            <Text style={styles.spotActPrimaryLabel}>Get Directions</Text>
          </Pressable>
          <Pressable style={styles.spotActSecondary}>
            <Ionicons name="calendar-outline" size={14} color={Luxe.goldBright} />
            <Text style={styles.spotActSecondaryLabel}>Add to Plan</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function MapSection() {
  const mapW = SW - 48;
  const hx = mapW * 0.44;
  const hy = 108;
  const mapH = 216;

  const mapSpots = [
    { name: 'Marina', x: mapW * 0.78, y: 84, color: '#3A8FBF', label: '12 min' },
    { name: 'Temple', x: mapW * 0.24, y: 152, color: '#D4A857', label: '18 min' },
    { name: 'Mall', x: mapW * 0.17, y: 68, color: '#9A6FBF', label: '9 min' },
    { name: 'Shore', x: mapW * 0.62, y: 172, color: '#A0987A', label: '70 min' },
  ];

  const openMaps = () => {
    const url =
      Platform.OS === 'ios'
        ? 'maps://maps.apple.com/?ll=13.0827,80.2707&q=H%C3%B4tel+Octave+Chennai'
        : 'geo:13.0827,80.2707?q=Hotel+Octave+Chennai';
    void Linking.openURL(url);
  };

  return (
    <View style={styles.mapCard}>
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
          HÔTEL OCTAVE
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

function TransportGrid() {
  const cardW = (SW - 60) / 2;
  return (
    <View style={styles.transportGrid}>
      {TRANSPORT.map((t) => (
        <Pressable key={t.id} style={[styles.transportCard, { width: cardW }]}>
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
      ))}
    </View>
  );
}

function GuidesSection() {
  return (
    <View style={styles.guidesList}>
      {GUIDES.map((g, i) => (
        <View
          key={g.id}
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
        </View>
      ))}
    </View>
  );
}

function ExperiencesRail() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.expScroll}
      style={styles.expRail}
    >
      {EXPERIENCES.map((exp) => (
        <View key={exp.id} style={styles.expCard}>
          <LinearGradient
            colors={[exp.gradA, exp.gradB]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: LuxeRadii.xl }]}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: LuxeRadii.xl, borderWidth: 0.5, borderColor: 'rgba(255,240,210,0.09)' },
            ]}
            pointerEvents="none"
          />
          <View style={styles.expTop}>
            <View style={styles.expIconBox}>
              <Ionicons name={exp.icon} size={18} color={Luxe.goldBright} />
            </View>
            <View style={styles.expTagPill}>
              <Text style={styles.expTag}>{exp.tag}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }} />
          <Text style={styles.expKicker}>{exp.kicker}</Text>
          <Text style={styles.expTitle}>{exp.title}</Text>
          <Text style={styles.expDesc} numberOfLines={2}>{exp.desc}</Text>
          <View style={styles.expCta}>
            <Text style={styles.expCtaLabel}>Arrange →</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function SaveAndPlanSection() {
  const [saved, setSaved] = useState(false);
  const [inItinerary, setInItinerary] = useState(false);

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
      <Text style={styles.savePlanTitle}>Save & Plan Your Visit</Text>
      <Text style={styles.savePlanSub}>
        Collect your favourite spots and share your curated itinerary.
      </Text>
      <View style={styles.savePlanActions}>
        <Pressable onPress={() => setSaved((v) => !v)} style={styles.savePlanBtn}>
          <Ionicons
            name={saved ? 'heart' : 'heart-outline'}
            size={16}
            color={saved ? '#E84C6A' : Luxe.goldBright}
          />
          <Text style={styles.savePlanBtnLabel}>{saved ? 'Saved' : 'Save'}</Text>
        </Pressable>
        <Pressable onPress={() => setInItinerary((v) => !v)} style={styles.savePlanBtn}>
          <Ionicons
            name={inItinerary ? 'calendar' : 'calendar-outline'}
            size={16}
            color={Luxe.goldBright}
          />
          <Text style={styles.savePlanBtnLabel}>
            {inItinerary ? 'In Itinerary' : 'Add to Itinerary'}
          </Text>
        </Pressable>
        <Pressable style={styles.savePlanBtn}>
          <Ionicons name="share-outline" size={16} color={Luxe.goldBright} />
          <Text style={styles.savePlanBtnLabel}>Share Trip</Text>
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
  spotActSecondaryLabel: {
    fontFamily: LuxeFonts.sansMedium, fontSize: 13, color: Luxe.goldBright,
  },

  // ── MAP ───────────────────────────────────────────────────────────────────
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
    width: SW * 0.66, height: 224,
    borderRadius: LuxeRadii.xl, overflow: 'hidden',
    padding: 18,
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
  expTagPill: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999,
    backgroundColor: 'rgba(244,201,126,0.10)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.24)',
  },
  expTag: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 8.5,
    color: Luxe.gold, letterSpacing: 1.2, textTransform: 'uppercase',
  },
  expKicker: {
    fontFamily: LuxeFonts.monoMedium, fontSize: 9.5,
    color: Luxe.gold, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 5,
  },
  expTitle: {
    fontFamily: LuxeFonts.serif, fontSize: 22, lineHeight: 24,
    color: Luxe.ivory, letterSpacing: -0.4,
  },
  expDesc: {
    fontFamily: LuxeFonts.sansLight, fontSize: 11.5, lineHeight: 16.5,
    color: Luxe.ivoryDim, marginTop: 6,
  },
  expCta: {
    marginTop: 12, alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999,
    backgroundColor: 'rgba(244,201,126,0.10)',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.26)',
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
});
