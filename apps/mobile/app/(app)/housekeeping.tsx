import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';
import { useOrdersStore, type Order } from '../../src/stores/orders.store';
import { useReservationStore } from '../../src/stores/reservation.store';
import { useContentStore, type HkService } from '../../src/stores/content.store';

type IconName = keyof typeof Ionicons.glyphMap;

const FALLBACK_FEATURED: HkService = {
  id: 'hk-makeup',
  name: 'Make up the room',
  desc: 'A full tidy, fresh towels and a reset of the bath — sent as a priority.',
  icon: 'sparkles-outline',
  etaMinutes: 30,
  price: 0,
  type: 'housekeeping',
  image: require('../../assets/maidcare.jpg'),
};

const FALLBACK_NOW_SERVICES: HkService[] = [
  {
    id: 'hk-turndown',
    name: 'Turndown service',
    desc: 'Evening turndown with the lights set low.',
    icon: 'moon-outline',
    etaMinutes: 25,
    price: 0,
    type: 'housekeeping',
  },
  {
    id: 'hk-linen',
    name: 'Fresh linens',
    desc: 'A full bed change with crisp, pressed sheets.',
    icon: 'bed-outline',
    etaMinutes: 35,
    price: 0,
    type: 'housekeeping',
  },
  {
    id: 'hk-refresh',
    name: 'Quick refresh',
    desc: 'A light tidy and a reset of the bath.',
    icon: 'color-wand-outline',
    etaMinutes: 20,
    price: 0,
    type: 'housekeeping',
  },
];

const FALLBACK_COMFORTS: HkService[] = [
  { id: 'am-towels', name: 'Extra towels', desc: 'Bath & hand towels.', icon: 'browsers-outline', etaMinutes: 15, price: 0, type: 'amenity', image: require('../../assets/towels.jpg') },
  { id: 'am-bedding', name: 'Pillows & blankets', desc: 'Additional bedding.', icon: 'bed-outline', etaMinutes: 15, price: 0, type: 'amenity', image: require('../../assets/rooms/SuiteRoom1.jpg') },
  { id: 'am-toiletry', name: 'Toiletry kit', desc: 'A forgotten essential.', icon: 'cut-outline', etaMinutes: 15, price: 0, type: 'amenity', image: require('../../assets/toiletry.jpg') },
  { id: 'am-hangers', name: 'Hangers', desc: 'A set of wooden hangers.', icon: 'shirt-outline', etaMinutes: 15, price: 0, type: 'amenity', image: require('../../assets/hangers.jpg') },
  { id: 'am-adapter', name: 'Travel adapter', desc: 'USB-C, Lightning, universal.', icon: 'battery-charging-outline', etaMinutes: 15, price: 0, type: 'amenity', image: require('../../assets/adapter.jpg') },
  { id: 'am-water', name: 'Still & sparkling', desc: 'Two bottles, chilled.', icon: 'wine-outline', etaMinutes: 15, price: 0, type: 'amenity', image: require('../../assets/bar.webp') },
];

const FALLBACK_SPA_FEATURED: HkService = {
  id: 'spa-signature',
  name: 'Signature ritual',
  desc: 'A 90-minute full-body treatment — warm oil, hot stone therapy and a deep-tissue finish. A complete reset.',
  icon: 'flower-outline',
  etaMinutes: 90,
  price: 4800,
  type: 'spa',
  image: require('../../assets/spa.jpg'),
};

const FALLBACK_SPA_SERVICES: HkService[] = [
  { id: 'spa-massage', name: 'Deep tissue massage', desc: 'Full tension release and muscle reset.', icon: 'body-outline', etaMinutes: 60, price: 3200, type: 'spa' },
  { id: 'spa-facial', name: 'Luminous facial', desc: 'Brightening, hydration and a glow finish.', icon: 'sparkles-outline', etaMinutes: 50, price: 2800, type: 'spa' },
  { id: 'spa-steam', name: 'Steam & soak', desc: 'Private steam room, cedar-scented.', icon: 'cloud-outline', etaMinutes: 30, price: 1200, type: 'spa' },
  { id: 'spa-couple', name: "Couple's ritual", desc: 'Side-by-side 90-minute treatment.', icon: 'heart-outline', etaMinutes: 90, price: 8400, type: 'spa' },
  { id: 'spa-yoga', name: 'Private yoga session', desc: 'In-suite or on the terrace at your pace.', icon: 'leaf-outline', etaMinutes: 60, price: 1600, type: 'spa' },
];

const FALLBACK_RECREATION: HkService[] = [
  { id: 'rec-bonfire', name: 'Bonfire in the garden', desc: 'Lit at dusk · blankets & chai', icon: 'flame-outline', etaMinutes: 60, price: 2500, type: 'recreation', image: require('../../assets/bonfire.jpg') },
  { id: 'rec-gym', name: 'Fitness centre', desc: 'Open daily · 06:00 — 22:00', icon: 'barbell-outline', etaMinutes: 0, price: 0, type: 'recreation', image: require('../../assets/gym.jpg') },
  { id: 'rec-kids', name: "Kids' play area", desc: 'Supervised · ages 3–12', icon: 'happy-outline', etaMinutes: 0, price: 0, type: 'recreation', image: require('../../assets/kidsplay.jpg') },
  { id: 'rec-golf', name: 'Mini golf course', desc: 'On the lawn · clubs provided', icon: 'golf-outline', etaMinutes: 20, price: 800, type: 'recreation', image: require('../../assets/golf.webp') },
  { id: 'rec-garden', name: 'Garden lawn', desc: 'Sundowners & quiet hours', icon: 'leaf-outline', etaMinutes: 0, price: 0, type: 'recreation', image: require('../../assets/garden.webp') },
  { id: 'rec-indoor', name: 'Indoor games room', desc: 'Carrom · TT · chess · board games', icon: 'game-controller-outline', etaMinutes: 0, price: 0, type: 'recreation', image: require('../../assets/indoorgames.webp') },
];

const SLOTS = Array.from({ length: 9 }, (_, i) => {
  const h = 9 + i;
  return { id: String(h), label: `${String(h).padStart(2, '0')}:00`, hour: h };
});

const HK_TYPES = new Set(['housekeeping', 'amenity', 'spa', 'recreation']);

const TODAY_PLAN = [
  { time: '09:14', label: 'Morning make-up', done: true, current: false },
  { time: '13:30', label: 'Express refresh', done: false, current: true },
  { time: '19:30', label: 'Evening turndown', done: false, current: false },
] as const;

const STEPS = ['Requested', 'Accepted', 'On the way', 'Done'] as const;
const STEP_INDEX: Record<string, number> = {
  pending: 0,
  accepted: 1,
  in_progress: 2,
  completed: 3,
  cancelled: 0,
};

function priceLabel(price: number): string {
  return price <= 0 ? 'Complimentary' : `₹${price.toFixed(0)}`;
}

function SpaFeaturedCard({
  item,
  disabled,
  onPress,
}: {
  item: HkService;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      unstable_pressDelay={130}
      accessibilityRole="button"
      accessibilityLabel={item.name}
      style={[styles.spaFeatured, disabled && { opacity: 0.4 }]}
    >
      {item.image ? (
        <>
          <ExpoImage
            source={item.image}
            style={[StyleSheet.absoluteFill, { borderRadius: 26 }]}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
            transition={0}
            recyclingKey={`hk-${item.id}`}
          />
          <LinearGradient
            colors={['rgba(42,16,24,0.45)', 'rgba(28,10,18,0.85)', '#160814']}
            locations={[0, 0.6, 1]}
            style={[StyleSheet.absoluteFill, { borderRadius: 26 }]}
          />
        </>
      ) : (
        <LinearGradient
          colors={['#2A1018', '#1C0A12']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 26 }]}
        />
      )}
      <LinearGradient
        colors={['rgba(220,120,150,0.22)', 'transparent']}
        locations={[0, 0.75]}
        start={{ x: 0.95, y: 0 }}
        end={{ x: 0.1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 26 }]}
      />
      <View style={styles.featuredHead}>
        <View style={styles.spaFeaturedIcon}>
          <Ionicons name={item.icon} size={24} color="#E8B0C8" />
        </View>
        <View style={styles.spaTag}>
          <Ionicons name="star" size={10} color="#E8B0C8" />
          <Text style={styles.spaTagText}>Signature</Text>
        </View>
      </View>
      <Text style={styles.spaFeaturedTitle}>{item.name}</Text>
      <Text style={styles.spaFeaturedDesc}>{item.desc}</Text>
      <View style={styles.featuredFoot}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.spaFeaturedPrice}>{priceLabel(item.price)}</Text>
          <Text style={styles.featuredMetaText}>~{item.etaMinutes} min</Text>
        </View>
        <View style={styles.spaCta}>
          <LinearGradient
            colors={['#F4C97E', '#D4A857', '#9A7A3F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.featuredCtaLabel}>BOOK NOW</Text>
        </View>
      </View>
    </Pressable>
  );
}

function RecreationTile({
  item,
  disabled,
  onPress,
}: {
  item: HkService;
  disabled: boolean;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      unstable_pressDelay={130}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={item.name}
      style={[styles.recTile, disabled && { opacity: 0.4 }, pressed && { transform: [{ scale: 0.96 }] }]}
    >
      {item.image ? (
        <>
          <ExpoImage
            source={item.image}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
            transition={0}
            recyclingKey={`hk-${item.id}`}
          />
          <LinearGradient
            colors={['rgba(8,7,10,0.30)', 'rgba(8,7,10,0.68)', 'rgba(6,5,8,0.95)']}
            locations={[0, 0.5, 1]}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
          />
        </>
      ) : null}
      <LinearGradient
        colors={['rgba(60,80,140,0.18)', 'transparent']}
        locations={[0, 0.9]}
        start={{ x: 0.85, y: 0 }}
        end={{ x: 0.2, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
      />
      <View style={styles.recTileTop}>
        <View style={styles.recTileIcon}>
          <Ionicons name={item.icon} size={18} color={Luxe.goldBright} />
        </View>
        {item.price > 0 && (
          <View style={styles.recTileAdd}>
            <Ionicons name="add" size={14} color={Luxe.goldBright} />
          </View>
        )}
      </View>
      <Text style={styles.tileName} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.tileDesc} numberOfLines={1}>{item.desc}</Text>
      <Text style={[styles.tileMeta, item.price > 0 && { color: Luxe.ivoryDim }]}>
        {priceLabel(item.price)}
      </Text>
    </Pressable>
  );
}

export default function HousekeepingScreen() {
  void useLuxeFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const reservation = useReservationStore((s) => s.reservation);
  const updateDnd = useReservationStore((s) => s.updateDnd);
  const requestService = useOrdersStore((s) => s.requestService);
  const placing = useOrdersStore((s) => s.placing);
  const activeOrders = useOrdersStore((s) => s.activeOrders);
  const fetchActiveOrders = useOrdersStore((s) => s.fetchActiveOrders);
  const catalog = useContentStore((s) => s.housekeeping);
  const fetchHousekeeping = useContentStore((s) => s.fetchHousekeeping);

  const FEATURED = catalog?.featured ?? FALLBACK_FEATURED;
  const NOW_SERVICES = catalog?.now ?? FALLBACK_NOW_SERVICES;
  const COMFORTS = catalog?.comforts ?? FALLBACK_COMFORTS;
  const SPA_FEATURED = catalog?.spaFeatured ?? FALLBACK_SPA_FEATURED;
  const SPA_SERVICES = catalog?.spa ?? FALLBACK_SPA_SERVICES;
  const RECREATION = catalog?.recreation ?? FALLBACK_RECREATION;

  const [selected, setSelected] = useState<HkService | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [dndOverride, setDndOverride] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchActiveOrders();
      fetchHousekeeping();
    }, [fetchActiveOrders, fetchHousekeeping]),
  );

  const suite = reservation?.room?.roomNumber ?? '1604';
  // TEMP: bypass check-in gate for testing housekeeping features
  const checkedIn = true;
  const isDnd = dndOverride ?? reservation?.isDnd ?? false;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const activeHkOrders = useMemo(
    () => activeOrders.filter((o) => HK_TYPES.has(o.type)),
    [activeOrders],
  );

  const open = (item: HkService, schedule = false) => {
    if (!checkedIn) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNote('');
    setSlot(schedule ? (SLOTS[2]?.id ?? null) : null);
    setSelected(item);
  };

  const toggleDnd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = !isDnd;
    setDndOverride(next);
    if (reservation) updateDnd(next);
  };

  const send = async () => {
    if (!selected) return;
    const item = selected;
    const chosen = slot ? SLOTS.find((s) => s.id === slot) : null;
    let scheduledFor: string | null = null;
    if (chosen) {
      const d = new Date();
      d.setHours(chosen.hour, 0, 0, 0);
      if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
      scheduledFor = d.toISOString();
    }
    setSelected(null);
    setSlot(null);
    // Allow placing the request without a live reservation — requestService
    // falls back to a local fake order, and the staff queue still picks it up
    // via the cross-store bridge.
    const reservationId = reservation?.id ?? 'demo-reservation';
    await requestService(
      reservationId,
      item.type,
      { name: item.name, price: item.price, etaMinutes: item.etaMinutes },
      {
        ...(note.trim() ? { notes: note.trim() } : {}),
        ...(scheduledFor ? { scheduledFor } : {}),
      },
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToast(
      chosen
        ? `${item.name} — scheduled for ${chosen.label}, suite ${suite}`
        : `${item.name} — on its way to suite ${suite}`,
    );
    setTimeout(() => setToast(null), 3400);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* ───────── HERO ───────── */}
        <View style={[styles.hero, { paddingTop: insets.top + 14 }]}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Luxe.obsidian }]} />
          <LinearGradient
            colors={['rgba(244,201,126,0.26)', 'rgba(244,201,126,0.06)', 'transparent']}
            locations={[0, 0.42, 0.74]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.3, y: 0.72 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.ringOuter} />
          <View style={styles.ringInner}>
            <LinearGradient
              colors={['rgba(244,201,126,0.20)', 'transparent']}
              start={{ x: 0.25, y: 0.25 }}
              end={{ x: 0.85, y: 0.85 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="sparkles-outline" size={24} color={Luxe.goldBright} />
          </View>

          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.glassPill} hitSlop={8}>
              <Ionicons name="chevron-back" size={16} color={Luxe.ivory} />
            </Pressable>
            <View style={styles.suiteChip}>
              <PulsingDot isDnd={isDnd} />
              <Text style={styles.suiteChipText}>
                {isDnd ? 'Do not disturb' : `Suite ${suite}`}
              </Text>
            </View>
          </View>

          <View style={styles.heroTitleBlock}>
            <Text style={styles.heroKicker}>{greeting} · Housekeeping</Text>
            <Text style={styles.heroTitle}>
              A room <Text style={styles.heroTitleItalic}>refreshed.</Text>
            </Text>
            <Text style={styles.heroSub}>
              Turndown, fresh linen or a quiet moment to yourself — arranged on your
              schedule and never a knock unannounced.
            </Text>
          </View>

          {/* stat strip */}
          <View style={styles.statStrip}>
            <Stat value="~22" unit="min" label="Avg response" />
            <View style={styles.statDivider} />
            <Stat value="09:14" label="Last service" />
            <View style={styles.statDivider} />
            <Stat value="24" unit="/7" label="On call" />
          </View>
        </View>

        {/* ───────── SUITE STATUS ───────── */}
        <Rise delay={40}>
          <SuiteStatusCard suite={suite} isDnd={isDnd} freshness={0.82} />
        </Rise>

        {/* ───────── DND ───────── */}
        <Rise delay={90}>
          <DndCard enabled={isDnd} disabled={!checkedIn} onToggle={toggleDnd} />
        </Rise>

        {/* ───────── ROOM AMBIENT ───────── */}
        <Rise delay={110}>
          <RoomAmbientCard />
        </Rise>

        {/* ───────── CHECK-IN NOTICE ───────── */}
        {!checkedIn && (
          <View style={styles.notice}>
            <Ionicons name="information-circle-outline" size={15} color={Luxe.gold} />
            <Text style={styles.noticeText}>
              Housekeeping opens once you&apos;ve checked in.
            </Text>
          </View>
        )}

        {/* ───────── IN PROGRESS ───────── */}
        {activeHkOrders.length > 0 && (
          <Rise delay={120}>
            <View style={styles.progressWrap}>
              <LinearGradient
                colors={['rgba(244,201,126,0.12)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
              />
              <View style={styles.progressHeader}>
                <PulsingDot />
                <Text style={styles.progressLabel}>In progress</Text>
                <Text style={styles.progressCount}>{activeHkOrders.length} active</Text>
              </View>
              {activeHkOrders.map((o) => (
                <OrderStepper key={o.id} order={o} />
              ))}
            </View>
          </Rise>
        )}

        {/* ───────── TODAY'S PLAN ───────── */}
        <Rise delay={130}>
          <TodayPlanCard />
        </Rise>

        {/* ───────── FEATURED PRIMARY ───────── */}
        <Section kicker="Right now" title="Send someone up" hint="Priority" />
        <Rise delay={60}>
          <FeaturedAction
            item={FEATURED}
            disabled={!checkedIn}
            onPress={() => open(FEATURED)}
          />
        </Rise>
        <View style={[styles.list, { marginTop: 12 }]}>
          {NOW_SERVICES.map((item, i) => (
            <Rise key={item.id} delay={90 + i * 50}>
              <ServiceRow item={item} disabled={!checkedIn} onPress={() => open(item)} />
            </Rise>
          ))}
        </View>

        {/* ───────── SCHEDULE ───────── */}
        <Section kicker="Later" title="Schedule a make-up" hint="9:00 – 17:00" />
        <Rise delay={60}>
          <View style={styles.scheduleCard}>
            <LinearGradient
              colors={['rgba(244,201,126,0.14)', 'rgba(139,111,71,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
            />
            <View style={styles.scheduleHead}>
              <View style={styles.scheduleIcon}>
                <Ionicons name="time-outline" size={22} color={Luxe.goldBright} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.scheduleTitle}>Pick a time</Text>
                <Text style={styles.scheduleSub}>
                  We&apos;ll arrive at the hour you choose — no knock before.
                </Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.previewSlots}
            >
              {SLOTS.map((s) => (
                <Pressable
                  key={s.id}
                  disabled={!checkedIn}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSlot(s.id);
                    open(FEATURED, true);
                    setSlot(s.id);
                  }}
                  style={[styles.previewChip, !checkedIn && { opacity: 0.4 }]}
                >
                  <Text style={styles.previewChipText}>{s.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Rise>

        {/* ───────── EXTRA COMFORTS ───────── */}
        <Section kicker="Comforts" title="Bring me something" hint="Complimentary" />
        <View style={styles.grid}>
          {COMFORTS.map((item, i) => (
            <Rise key={item.id} delay={50 + i * 40} style={styles.gridCell}>
              <ComfortTile item={item} disabled={!checkedIn} onPress={() => open(item)} />
            </Rise>
          ))}
        </View>

        {/* ───────── SPA & WELLNESS ───────── */}
        <Section kicker="Wellness" title="Spa & treatments" hint="Book ahead" />
        <Rise delay={60}>
          <SpaFeaturedCard
            item={SPA_FEATURED}
            disabled={!checkedIn}
            onPress={() => open(SPA_FEATURED)}
          />
        </Rise>
        <View style={[styles.list, { marginTop: 12 }]}>
          {SPA_SERVICES.map((item, i) => (
            <Rise key={item.id} delay={80 + i * 45}>
              <ServiceRow item={item} disabled={!checkedIn} onPress={() => open(item)} />
            </Rise>
          ))}
        </View>

        {/* ───────── RECREATION & PLAY ───────── */}
        <Section kicker="Active" title="Recreation & play" hint="Complimentary" />
        <View style={styles.grid}>
          {RECREATION.map((item, i) => (
            <Rise key={item.id} delay={50 + i * 35} style={styles.gridCell}>
              <RecreationTile item={item} disabled={!checkedIn} onPress={() => open(item)} />
            </Rise>
          ))}
        </View>

        {/* ───────── ETIQUETTE ───────── */}
        <Rise delay={80}>
          <View style={styles.etiquette}>
            <View style={styles.etiquetteIcon}>
              <Ionicons name="shield-checkmark-outline" size={18} color={Luxe.gold} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.etiquetteTitle}>Discreet by default</Text>
              <Text style={styles.etiquetteText}>
                Our team only enters when invited. Charges, if any, are added quietly to
                your folio.
              </Text>
            </View>
          </View>
        </Rise>

        {/* ───────── FOOTNOTE ───────── */}
        <View style={styles.footnote}>
          <Text style={styles.footText}>Hotel Kodai International · Housekeeping</Text>
          <Text style={styles.footText}>Charged to folio</Text>
        </View>
      </ScrollView>

      {/* DOCK FADE */}
      <LinearGradient
        colors={['transparent', 'rgba(8,7,10,0.85)', Luxe.obsidian]}
        locations={[0, 0.5, 0.85]}
        pointerEvents="none"
        style={styles.dockFade}
      />

      {/* TOAST */}
      {toast && (
        <View style={[styles.toast, { bottom: insets.bottom + 40 }]} pointerEvents="none">
          <Ionicons name="checkmark-circle" size={16} color={Luxe.goldBright} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* CONFIRM SHEET */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setSelected(null)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + 22 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetGrip} />
            {selected && (
              <>
                <View style={styles.sheetTitleRow}>
                  <View style={styles.sheetIcon}>
                    <Ionicons name={selected.icon} size={22} color={Luxe.goldBright} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.sheetKicker}>
                      {slot ? 'Schedule request' : 'Confirm request'}
                    </Text>
                    <Text style={styles.sheetTitle}>{selected.name}</Text>
                  </View>
                </View>
                <Text style={styles.sheetDesc}>{selected.desc}</Text>

                {slot !== null && (
                  <View style={styles.slotsWrap}>
                    <Text style={styles.slotsLabel}>Arrival time</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.slotsRow}
                    >
                      {SLOTS.map((s) => {
                        const active = slot === s.id;
                        return (
                          <Pressable
                            key={s.id}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setSlot(s.id);
                            }}
                            style={[styles.slotChip, active && styles.slotChipActive]}
                          >
                            <Text style={[styles.slotText, active && styles.slotTextActive]}>
                              {s.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.sheetMetaRow}>
                  <View style={styles.sheetMetaCell}>
                    <Text style={styles.sheetMetaLabel}>To suite</Text>
                    <Text style={styles.sheetMetaValue}>{suite}</Text>
                  </View>
                  <View style={styles.sheetDivider} />
                  <View style={styles.sheetMetaCell}>
                    <Text style={styles.sheetMetaLabel}>{slot ? 'At' : 'ETA'}</Text>
                    <Text style={styles.sheetMetaValue}>
                      {slot
                        ? SLOTS.find((s) => s.id === slot)?.label ?? '—'
                        : `${selected.etaMinutes}`}
                      {!slot && <Text style={styles.sheetMetaUnit}>  min</Text>}
                    </Text>
                  </View>
                  <View style={styles.sheetDivider} />
                  <View style={styles.sheetMetaCell}>
                    <Text style={styles.sheetMetaLabel}>Charge</Text>
                    <Text style={styles.sheetMetaValue}>{priceLabel(selected.price)}</Text>
                  </View>
                </View>

                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Add a note for our team (optional)"
                  placeholderTextColor={Luxe.muted}
                  style={styles.noteInput}
                  multiline
                />

                <Pressable
                  onPress={send}
                  disabled={placing}
                  style={[styles.sendBtn, placing && { opacity: 0.6 }]}
                >
                  <LinearGradient
                    colors={['#F4C97E', '#D4A857', '#9A7A3F']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.sendBtnText}>
                    {placing ? 'Sending…' : slot ? 'Schedule it' : 'Send to suite'}
                  </Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/* ─────────────────────────── components ─────────────────────────── */

// Layout wrapper. Kept as a plain View pass-through (no transform/animation) so
// wrapped cards inherit normal flex layout and their marginHorizontal applies
// reliably. `delay` is accepted for call-site compatibility but unused.
function Rise({ style, children }: { delay?: number; style?: object; children: ReactNode }) {
  if (style) return <View style={style}>{children}</View>;
  return <>{children}</>;
}

function PulsingDot({ isDnd = false }: { isDnd?: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.65, 0.15, 0] });
  const dotColor = isDnd ? Luxe.titanium : Luxe.goldBright;
  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute', width: 10, height: 10, borderRadius: 5,
        backgroundColor: dotColor, transform: [{ scale: ringScale }], opacity: ringOpacity,
      }} />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor,
        shadowColor: isDnd ? Luxe.titanium : Luxe.amberGlow, shadowOpacity: 0.8, shadowRadius: 4 }} />
    </View>
  );
}

function RoomAmbientCard() {
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    }, 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={styles.ambientCard}>
      <LinearGradient
        colors={['rgba(14,22,42,0.9)', '#0C0F18']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
      />
      <LinearGradient
        colors={['rgba(80,120,220,0.13)', 'transparent']}
        start={{ x: 0.9, y: 0 }}
        end={{ x: 0.1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
      />
      <View style={styles.ambientRow}>
        <AmbientStat icon="time-outline" value={time} label="Local time" />
        <View style={styles.ambientDivider} />
        <AmbientStat icon="thermometer-outline" value="22°" label="Room" />
        <View style={styles.ambientDivider} />
        <AmbientStat icon="partly-sunny-outline" value="34°" label="Outside" />
        <View style={styles.ambientDivider} />
        <AmbientStat icon="water-outline" value="58%" label="Humidity" />
      </View>
      <View style={styles.ambientFooter}>
        <Ionicons name="bulb-outline" size={11} color={Luxe.gold} />
        <Text style={styles.ambientNote}>Blinds at 40%  ·  Lights dimmed  ·  AC set to 22°C</Text>
      </View>
    </View>
  );
}

function AmbientStat({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <View style={styles.ambientStat}>
      <Ionicons name={icon} size={13} color={Luxe.gold} style={{ marginBottom: 6 }} />
      <Text style={styles.ambientValue}>{value}</Text>
      <Text style={styles.ambientLabel}>{label}</Text>
    </View>
  );
}

function TodayPlanCard() {
  return (
    <View style={styles.planCard}>
      <LinearGradient
        colors={['rgba(244,201,126,0.07)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
      />
      <View style={styles.planHeader}>
        <Ionicons name="calendar-outline" size={13} color={Luxe.gold} />
        <Text style={styles.planHeaderText}>Today's visits</Text>
        <Text style={styles.planDate}>Wed 28 May</Text>
      </View>
      {TODAY_PLAN.map((item) => (
        <View key={item.time} style={styles.planRow}>
          <Text style={[styles.planTime, item.done && styles.planTimeDone]}>{item.time}</Text>
          <View style={[
            styles.planDot,
            item.done && styles.planDotDone,
            item.current && styles.planDotCurrent,
          ]} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[
              styles.planLabel,
              item.done && styles.planLabelDone,
              item.current && styles.planLabelCurrent,
            ]}>{item.label}</Text>
            {item.done && <Text style={styles.planStatus}>Completed</Text>}
            {item.current && <Text style={styles.planStatusActive}>On the way · ~13 min</Text>}
          </View>
          {item.done
            ? <Ionicons name="checkmark-circle" size={16} color={Luxe.gold} />
            : item.current
              ? <PulsingDot />
              : <View style={styles.planCircle} />
          }
        </View>
      ))}
    </View>
  );
}

function Stat({ value, unit, label }: { value: string; unit?: string; label: string }) {
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

function FreshnessRing({ value, size = 78, stroke = 6 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value);
  const cx = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="freshGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F4C97E" />
            <Stop offset="1" stopColor="#9A7A3F" />
          </SvgGradient>
        </Defs>
        <Circle cx={cx} cy={cx} r={r} stroke="rgba(255,240,210,0.10)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={cx}
          cy={cx}
          r={r}
          stroke="url(#freshGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringValue}>{Math.round(value * 100)}</Text>
        <Text style={styles.ringUnit}>fresh</Text>
      </View>
    </View>
  );
}

function StatusPill({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={styles.statusPill}>
      <Ionicons name={icon} size={12} color={Luxe.gold} />
      <Text style={styles.statusPillText}>{label}</Text>
    </View>
  );
}

function SuiteStatusCard({
  suite,
  isDnd,
  freshness,
}: {
  suite: string;
  isDnd: boolean;
  freshness: number;
}) {
  return (
    <View style={styles.statusCard}>
      <LinearGradient
        colors={['#2A2316', '#1C1710']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 26 }]}
      />
      <LinearGradient
        colors={['rgba(244,201,126,0.16)', 'transparent']}
        locations={[0, 0.7]}
        start={{ x: 0.9, y: 0 }}
        end={{ x: 0.1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 26 }]}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.statusKicker}>Suite {suite} · Status</Text>
        <Text style={styles.statusTitle}>
          {isDnd ? 'Privacy on' : 'Serviced & ready'}
        </Text>
        <View style={styles.statusPills}>
          <StatusPill icon="sparkles-outline" label="Serviced 09:14" />
          <StatusPill icon="moon-outline" label="Turndown 19:30" />
        </View>
      </View>
      <FreshnessRing value={freshness} />
    </View>
  );
}

function DndCard({
  enabled,
  disabled,
  onToggle,
}: {
  enabled: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const anim = useRef(new Animated.Value(enabled ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: enabled ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [enabled, anim]);

  const knobX = anim.interpolate({ inputRange: [0, 1], outputRange: [3, 25] });
  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,240,210,0.10)', 'rgba(244,201,126,0.55)'],
  });

  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled, disabled }}
      accessibilityLabel="Do not disturb"
      style={[styles.dndCard, disabled && { opacity: 0.4 }]}
    >
      <LinearGradient
        colors={
          enabled
            ? ['rgba(154,147,138,0.10)', 'transparent']
            : ['rgba(244,201,126,0.12)', 'transparent']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
      />
      <View style={styles.dndIcon}>
        <Ionicons
          name={enabled ? 'moon' : 'moon-outline'}
          size={22}
          color={enabled ? Luxe.ivoryDim : Luxe.goldBright}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.dndTitle}>Do not disturb</Text>
        <Text style={styles.dndSub}>
          {enabled
            ? 'Your privacy is on. Staff will not enter.'
            : 'Pause all housekeeping entry to your suite.'}
        </Text>
      </View>
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.knob, { transform: [{ translateX: knobX }] }]} />
      </Animated.View>
    </Pressable>
  );
}

function Section({ kicker, title, hint }: { kicker: string; title: string; hint: string }) {
  return (
    <View style={styles.section}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.sectionKicker}>{kicker}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.sectionHint}>{hint}</Text>
    </View>
  );
}

function FeaturedAction({
  item,
  disabled,
  onPress,
}: {
  item: HkService;
  disabled: boolean;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      unstable_pressDelay={130}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={item.name}
      style={[styles.featured, disabled && { opacity: 0.4 }, pressed && { transform: [{ scale: 0.97 }] }]}
    >
      {item.image ? (
        <>
          <ExpoImage
            source={item.image}
            style={[StyleSheet.absoluteFill, { borderRadius: 26 }]}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
            transition={0}
            recyclingKey={`hk-${item.id}`}
          />
          <LinearGradient
            colors={['rgba(58,46,24,0.45)', 'rgba(36,28,16,0.85)', '#1A140C']}
            locations={[0, 0.6, 1]}
            style={[StyleSheet.absoluteFill, { borderRadius: 26 }]}
          />
        </>
      ) : (
        <LinearGradient
          colors={['#3A2E18', '#241C10']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 26 }]}
        />
      )}
      <LinearGradient
        colors={['rgba(244,201,126,0.22)', 'transparent']}
        locations={[0, 0.75]}
        start={{ x: 0.95, y: 0 }}
        end={{ x: 0.1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 26 }]}
      />
      <View style={styles.featuredHead}>
        <View style={styles.featuredIcon}>
          <Ionicons name={item.icon} size={24} color={Luxe.goldBright} />
        </View>
        <View style={styles.featuredTag}>
          <Ionicons name="flash" size={10} color={Luxe.goldBright} />
          <Text style={styles.featuredTagText}>Priority</Text>
        </View>
      </View>
      <Text style={styles.featuredTitle}>{item.name}</Text>
      <Text style={styles.featuredDesc}>{item.desc}</Text>
      <View style={styles.featuredFoot}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.featuredMetaGold}>{priceLabel(item.price)}</Text>
          <Text style={styles.featuredMetaText}>~{item.etaMinutes} min</Text>
        </View>
        <View style={styles.featuredCta}>
          <LinearGradient
            colors={['#F4C97E', '#D4A857', '#9A7A3F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.featuredCtaLabel}>SEND UP</Text>
        </View>
      </View>
    </Pressable>
  );
}

function ServiceRow({
  item,
  disabled,
  onPress,
}: {
  item: HkService;
  disabled: boolean;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      unstable_pressDelay={130}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={item.name}
      style={[styles.row, disabled && { opacity: 0.4 }, pressed && { transform: [{ scale: 0.97 }] }]}
    >
      <LinearGradient
        colors={['rgba(244,201,126,0.10)', 'transparent']}
        locations={[0, 0.9]}
        start={{ x: 0.9, y: 0 }}
        end={{ x: 0.2, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
      />
      <View style={styles.rowIcon}>
        <Ionicons name={item.icon} size={20} color={Luxe.goldBright} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowName}>{item.name}</Text>
        <Text style={styles.rowDesc} numberOfLines={2}>
          {item.desc}
        </Text>
        <Text style={[styles.rowMeta, item.price <= 0 && { color: Luxe.gold }]}>
          {priceLabel(item.price)} · ~{item.etaMinutes} min
        </Text>
      </View>
      <View style={styles.rowAdd}>
        <Ionicons name="add" size={18} color={Luxe.goldBright} />
      </View>
    </Pressable>
  );
}

function ComfortTile({
  item,
  disabled,
  onPress,
}: {
  item: HkService;
  disabled: boolean;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      unstable_pressDelay={130}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={item.name}
      style={[styles.tile, disabled && { opacity: 0.4 }, pressed && { transform: [{ scale: 0.96 }] }]}
    >
      {item.image ? (
        <>
          <ExpoImage
            source={item.image}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
            transition={0}
            recyclingKey={`hk-${item.id}`}
          />
          <LinearGradient
            colors={['rgba(8,7,10,0.32)', 'rgba(8,7,10,0.72)', 'rgba(6,5,8,0.95)']}
            locations={[0, 0.5, 1]}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
          />
        </>
      ) : null}
      <LinearGradient
        colors={['rgba(244,201,126,0.10)', 'transparent']}
        locations={[0, 0.9]}
        start={{ x: 0.85, y: 0 }}
        end={{ x: 0.2, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
      />
      <View style={styles.tileTop}>
        <View style={styles.tileIcon}>
          <Ionicons name={item.icon} size={18} color={Luxe.goldBright} />
        </View>
        <View style={styles.tileAdd}>
          <Ionicons name="add" size={14} color={Luxe.goldBright} />
        </View>
      </View>
      <Text style={styles.tileName} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.tileDesc} numberOfLines={1}>{item.desc}</Text>
      <Text style={styles.tileMeta}>{priceLabel(item.price)}</Text>
    </Pressable>
  );
}

function OrderStepper({ order }: { order: Order }) {
  const label = order.items[0]?.name ?? 'Housekeeping';
  const idx = STEP_INDEX[order.status] ?? 0;
  const eta = order.estimated_delivery_minutes;
  return (
    <View style={styles.stepper}>
      <View style={styles.stepperHead}>
        <Text style={styles.stepperName} numberOfLines={1}>
          {label}
        </Text>
        {eta ? <Text style={styles.stepperEta}>~{eta} min</Text> : null}
      </View>
      <View style={styles.stepRow}>
        {STEPS.map((step, i) => {
          const done = i <= idx;
          const isLast = i === STEPS.length - 1;
          return (
            <View key={step} style={styles.stepCell}>
              <View style={styles.stepDotRow}>
                <View style={[styles.stepDot, done && styles.stepDotOn]} />
                {!isLast && <View style={[styles.stepLine, i < idx && styles.stepLineOn]} />}
              </View>
              <Text style={[styles.stepLabel, done && styles.stepLabelOn]} numberOfLines={1}>
                {step}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },

  // AMBIENT CARD
  ambientCard: {
    marginHorizontal: 24,
    marginTop: 14,
    padding: 18,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(80,120,220,0.20)',
  },
  ambientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ambientStat: { flex: 1, alignItems: 'center' },
  ambientValue: {
    fontFamily: LuxeFonts.serif,
    fontSize: 17,
    color: Luxe.ivory,
    letterSpacing: -0.3,
  },
  ambientLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 7.5,
    color: Luxe.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  ambientDivider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  ambientFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  ambientNote: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.muted,
    letterSpacing: 0.6,
  },

  // TODAY PLAN CARD
  planCard: {
    marginHorizontal: 24,
    marginTop: 18,
    padding: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.18)',
    backgroundColor: '#191510',
    gap: 14,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,240,210,0.06)',
  },
  planHeaderText: {
    flex: 1,
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  planDate: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.muted,
    letterSpacing: 0.6,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planTime: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 11,
    color: Luxe.ivoryDim,
    letterSpacing: 0.4,
    width: 38,
  },
  planTimeDone: { color: Luxe.muted },
  planDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: 'rgba(255,240,210,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.20)',
  },
  planDotDone: {
    backgroundColor: Luxe.gold,
    borderColor: 'transparent',
  },
  planDotCurrent: {
    backgroundColor: Luxe.goldBright,
    borderColor: 'transparent',
    shadowColor: Luxe.amberGlow,
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  planLabel: {
    fontFamily: LuxeFonts.sans,
    fontSize: 14,
    color: Luxe.ivoryDim,
  },
  planLabelDone: { color: Luxe.muted },
  planLabelCurrent: { fontFamily: LuxeFonts.sansSemibold, color: Luxe.ivory },
  planStatus: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.muted,
    letterSpacing: 0.6,
    marginTop: 3,
  },
  planStatusActive: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.gold,
    letterSpacing: 0.6,
    marginTop: 3,
  },
  planCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.18)',
  },

  // HERO
  hero: { overflow: 'hidden', paddingBottom: 26 },
  ringOuter: {
    position: 'absolute',
    right: -90,
    top: 4,
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.14)',
  },
  ringInner: {
    position: 'absolute',
    right: -10,
    top: 70,
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  glassPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(20,18,15,0.55)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suiteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: 'rgba(20,18,15,0.55)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.24)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Luxe.goldBright,
    shadowColor: Luxe.amberGlow,
    shadowOpacity: 0.7,
    shadowRadius: 5,
  },
  suiteChipText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.ivoryDim,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitleBlock: { paddingHorizontal: 24, marginTop: 26 },
  heroKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.gold,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  heroTitle: {
    fontFamily: LuxeFonts.serif,
    fontSize: 44,
    lineHeight: 46,
    color: Luxe.ivory,
    letterSpacing: -1,
  },
  heroTitleItalic: { fontFamily: LuxeFonts.serifItalic, color: Luxe.goldBright },
  heroSub: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 13.5,
    lineHeight: 20,
    color: Luxe.ivoryDim,
    marginTop: 14,
    maxWidth: 330,
  },
  statStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 28,
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: 'rgba(21,19,15,0.6)',
  },
  statCell: { flex: 1 },
  statValue: { fontFamily: LuxeFonts.serif, fontSize: 21, color: Luxe.ivory, letterSpacing: -0.5 },
  statUnit: { fontFamily: LuxeFonts.monoMedium, fontSize: 10, color: Luxe.gold },
  statLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8.5,
    color: Luxe.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 5,
  },
  statDivider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: Luxe.hairlineStrong },

  // SUITE STATUS CARD
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginHorizontal: 24,
    marginTop: 22,
    padding: 22,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(244,201,126,0.28)',
  },
  statusKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.gold,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  statusTitle: {
    fontFamily: LuxeFonts.serif,
    fontSize: 23,
    color: Luxe.ivory,
    letterSpacing: -0.4,
    marginBottom: 14,
  },
  statusPills: { gap: 8 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(244,201,126,0.07)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.2)',
  },
  statusPillText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.ivoryDim,
    letterSpacing: 0.6,
  },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringValue: { fontFamily: LuxeFonts.serif, fontSize: 22, color: Luxe.ivory, letterSpacing: -0.5 },
  ringUnit: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 7.5,
    color: Luxe.gold,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 1,
  },

  // DND
  dndCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginHorizontal: 24,
    marginTop: 14,
    padding: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.22)',
    backgroundColor: '#1B1610',
  },
  dndIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.07)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.2)',
  },
  dndTitle: { fontFamily: LuxeFonts.serif, fontSize: 19, color: Luxe.ivory, letterSpacing: -0.3 },
  dndSub: { fontFamily: LuxeFonts.sansLight, fontSize: 12.5, color: Luxe.ivoryDim, marginTop: 4 },
  track: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.12)',
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Luxe.ivory,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },

  // NOTICE
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 24,
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212,168,87,0.36)',
    backgroundColor: 'rgba(212,168,87,0.08)',
  },
  noticeText: { flex: 1, fontFamily: LuxeFonts.sansLight, fontSize: 12.5, color: Luxe.ivoryDim },

  // IN PROGRESS
  progressWrap: {
    marginHorizontal: 24,
    marginTop: 18,
    padding: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.24)',
    backgroundColor: Luxe.surfaceTop,
    gap: 18,
  },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressLabel: {
    flex: 1,
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  progressCount: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.ivoryDim,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ORDER STEPPER
  stepper: { gap: 12 },
  stepperHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepperName: { flex: 1, fontFamily: LuxeFonts.sans, fontSize: 14, color: Luxe.ivory },
  stepperEta: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 0.6,
  },
  stepRow: { flexDirection: 'row' },
  stepCell: { flex: 1 },
  stepDotRow: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: 'rgba(255,240,210,0.14)',
  },
  stepDotOn: {
    backgroundColor: Luxe.goldBright,
    shadowColor: Luxe.amberGlow,
    shadowOpacity: 0.7,
    shadowRadius: 5,
  },
  stepLine: { flex: 1, height: 1.5, marginHorizontal: 4, backgroundColor: 'rgba(255,240,210,0.12)' },
  stepLineOn: { backgroundColor: 'rgba(244,201,126,0.45)' },
  stepLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8,
    color: Luxe.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 7,
  },
  stepLabelOn: { color: Luxe.ivoryDim },

  // SECTION
  section: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 40,
    marginBottom: 16,
  },
  sectionKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sectionTitle: {
    fontFamily: LuxeFonts.serif,
    fontSize: 24,
    lineHeight: 26,
    color: Luxe.ivory,
    letterSpacing: -0.5,
  },
  sectionHint: { fontFamily: LuxeFonts.sansLight, fontSize: 11, color: Luxe.muted, marginBottom: 4 },

  // FEATURED
  featured: {
    marginHorizontal: 24,
    padding: 22,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(244,201,126,0.32)',
  },
  featuredHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  featuredIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.10)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.28)',
  },
  featuredTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(244,201,126,0.10)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.28)',
  },
  featuredTagText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.goldBright,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  featuredTitle: { fontFamily: LuxeFonts.serif, fontSize: 26, color: Luxe.ivory, letterSpacing: -0.5 },
  featuredDesc: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 13,
    lineHeight: 19,
    color: Luxe.ivoryDim,
    marginTop: 8,
  },
  featuredFoot: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: Luxe.hairlineStrong,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  featuredMetaGold: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  featuredMetaText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.ivoryDim,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 5,
  },
  featuredCta: {
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#D4A857',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  featuredCtaLabel: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 12,
    color: '#1A1410',
    letterSpacing: 0.6,
  },

  // ROW
  list: { paddingHorizontal: 24, gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#1B1610',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.18)',
  },
  rowIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.2)',
  },
  rowName: { fontFamily: LuxeFonts.serif, fontSize: 18, color: Luxe.ivory, letterSpacing: -0.3 },
  rowDesc: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 12,
    lineHeight: 17,
    color: Luxe.titanium,
    marginTop: 3,
  },
  rowMeta: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  rowAdd: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.28)',
    backgroundColor: 'rgba(244,201,126,0.06)',
  },

  // SCHEDULE
  scheduleCard: {
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.24)',
  },
  scheduleHead: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 18 },
  scheduleIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.22)',
  },
  scheduleTitle: { fontFamily: LuxeFonts.serif, fontSize: 19, color: Luxe.ivory, letterSpacing: -0.3 },
  scheduleSub: { fontFamily: LuxeFonts.sansLight, fontSize: 12.5, color: Luxe.ivoryDim, marginTop: 4 },
  previewSlots: { gap: 9, paddingRight: 4 },
  previewChip: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 13,
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: 'rgba(12,10,8,0.6)',
  },
  previewChipText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 12,
    color: Luxe.ivoryDim,
    letterSpacing: 0.5,
  },

  // COMFORTS GRID
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    rowGap: 12,
  },
  gridCell: { width: '48%' },
  tile: {
    padding: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1B1610',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.18)',
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.2)',
  },
  tileAdd: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.24)',
    backgroundColor: 'rgba(244,201,126,0.06)',
  },
  tileName: { fontFamily: LuxeFonts.serif, fontSize: 16, color: Luxe.ivory, letterSpacing: -0.3, lineHeight: 20 },
  tileDesc: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 10.5,
    color: Luxe.titanium,
    marginTop: 3,
    lineHeight: 14,
  },
  tileMeta: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8.5,
    color: Luxe.gold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 6,
  },

  // SPA
  spaFeatured: {
    marginHorizontal: 24,
    padding: 22,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(220,120,150,0.28)',
  },
  spaFeaturedIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220,120,150,0.10)',
    borderWidth: 0.5,
    borderColor: 'rgba(220,120,150,0.26)',
  },
  spaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(220,120,150,0.10)',
    borderWidth: 0.5,
    borderColor: 'rgba(220,120,150,0.26)',
  },
  spaTagText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: '#E8B0C8',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  spaFeaturedTitle: {
    fontFamily: LuxeFonts.serif,
    fontSize: 26,
    color: Luxe.ivory,
    letterSpacing: -0.5,
  },
  spaFeaturedDesc: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 13,
    lineHeight: 19,
    color: Luxe.ivoryDim,
    marginTop: 8,
  },
  spaFeaturedPrice: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: '#E8B0C8',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  spaCta: {
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#D4A857',
    shadowOpacity: 0.30,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },

  // RECREATION TILES
  recTile: {
    padding: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0E101A',
    borderWidth: 0.5,
    borderColor: 'rgba(100,120,200,0.20)',
  },
  recTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  recTileIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(60,80,140,0.14)',
    borderWidth: 0.5,
    borderColor: 'rgba(100,120,200,0.26)',
  },
  recTileAdd: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.24)',
    backgroundColor: 'rgba(244,201,126,0.06)',
  },

  // ETIQUETTE
  etiquette: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 24,
    marginTop: 32,
    padding: 18,
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: 'rgba(21,19,15,0.5)',
  },
  etiquetteIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.07)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.18)',
  },
  etiquetteTitle: { fontFamily: LuxeFonts.sansSemibold, fontSize: 13, color: Luxe.ivory },
  etiquetteText: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 12,
    lineHeight: 17,
    color: Luxe.titanium,
    marginTop: 3,
  },

  // FOOTNOTE
  footnote: {
    marginTop: 36,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.muted,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },

  dockFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 150, pointerEvents: 'none' },

  // TOAST
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(18,16,12,0.96)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.3)',
  },
  toastText: { flex: 1, fontFamily: LuxeFonts.sans, fontSize: 13, color: Luxe.ivory },

  // SHEET
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(4,3,5,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Luxe.graphite,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 26,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.18)',
  },
  sheetGrip: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: Luxe.muted,
    marginBottom: 20,
  },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  sheetIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.22)',
  },
  sheetKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sheetTitle: { fontFamily: LuxeFonts.serif, fontSize: 24, lineHeight: 27, color: Luxe.ivory, letterSpacing: -0.5 },
  sheetDesc: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 13.5,
    lineHeight: 20,
    color: Luxe.ivoryDim,
    marginTop: 14,
  },
  slotsWrap: { marginTop: 22 },
  slotsLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.muted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  slotsRow: { gap: 10, paddingRight: 8 },
  slotChip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: Luxe.surfaceBottom,
  },
  slotChipActive: {
    borderColor: 'rgba(244,201,126,0.5)',
    backgroundColor: 'rgba(244,201,126,0.12)',
  },
  slotText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 12,
    color: Luxe.ivoryDim,
    letterSpacing: 0.5,
  },
  slotTextActive: { color: Luxe.goldBright },
  sheetMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 20,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: Luxe.hairline,
  },
  sheetMetaCell: { flex: 1 },
  sheetMetaLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8.5,
    color: Luxe.muted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sheetMetaValue: { fontFamily: LuxeFonts.serif, fontSize: 18, color: Luxe.ivory },
  sheetMetaUnit: { fontFamily: LuxeFonts.monoMedium, fontSize: 9, color: Luxe.muted },
  sheetDivider: { width: StyleSheet.hairlineWidth, height: 30, backgroundColor: Luxe.hairlineStrong },
  noteInput: {
    marginTop: 24,
    minHeight: 60,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: Luxe.surfaceBottom,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    fontFamily: LuxeFonts.sans,
    fontSize: 13.5,
    lineHeight: 19,
    color: Luxe.ivory,
    textAlignVertical: 'top',
  },
  sendBtn: {
    marginTop: 22,
    height: 56,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 14,
    color: '#1A1206',
    letterSpacing: 0.4,
  },
});
