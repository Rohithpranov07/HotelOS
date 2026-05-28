import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts, LuxeRadii } from '../../src/theme/luxe';

interface ServiceCard {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  kicker: string;
  title: string;
  titleItalic: string;
  desc: string;
  meta: string;
  href: '/(app)/dining' | '/(app)/housekeeping' | '/(app)/other-services' | '/(app)/complaints' | null;
  accentFrom: string;
  accentTo: string;
  borderColor: string;
  available: boolean;
}

const CARDS: ServiceCard[] = [
  {
    id: 'housekeeping',
    icon: 'sparkles-outline',
    kicker: 'Your suite',
    title: 'Housekeeping',
    titleItalic: '& Care',
    desc: 'Turndown, fresh linen, extra comforts — arranged discreetly on your schedule.',
    meta: '~22 min avg',
    href: '/(app)/housekeeping',
    accentFrom: 'rgba(244,201,126,0.22)',
    accentTo: 'rgba(139,111,71,0.06)',
    borderColor: 'rgba(244,201,126,0.30)',
    available: true,
  },
  {
    id: 'dining',
    icon: 'restaurant-outline',
    kicker: 'In-room dining',
    title: 'Dining',
    titleItalic: '& Food',
    desc: "Chef's table, in-room orders, tonight's pairings — all delivered to your door.",
    meta: 'Kitchen open · 02:00',
    href: '/(app)/dining',
    accentFrom: 'rgba(180,120,60,0.20)',
    accentTo: 'rgba(120,80,40,0.05)',
    borderColor: 'rgba(212,168,87,0.28)',
    available: true,
  },
  {
    id: 'other',
    icon: 'compass-outline',
    kicker: 'The city awaits',
    title: 'Explore',
    titleItalic: 'Nearby',
    desc: 'Top spots, transport, local guides and curated experiences around your stay.',
    meta: 'Explore · Discover · Experience',
    href: '/(app)/other-services',
    accentFrom: 'rgba(60,80,140,0.18)',
    accentTo: 'rgba(40,60,110,0.04)',
    borderColor: 'rgba(100,120,200,0.24)',
    available: true,
  },
  {
    id: 'complaints',
    icon: 'alert-circle-outline',
    kicker: 'Something off?',
    title: 'Report an',
    titleItalic: 'Issue',
    desc: "Tell us about a problem with your room or service — we'll make it right, fast.",
    meta: 'Priority response · 24/7',
    href: '/(app)/complaints',
    accentFrom: 'rgba(226,122,110,0.20)',
    accentTo: 'rgba(150,70,60,0.05)',
    borderColor: 'rgba(226,122,110,0.30)',
    available: true,
  },
];

export default function ServicesScreen() {
  void useLuxeFonts();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: 160 },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* ─── HEADER ─── */}
        <View style={styles.header}>
          <Text style={styles.headerKicker}>Hôtel Octave · Services</Text>
          <Text style={styles.headerTitle}>
            What would you{'\n'}like{' '}
            <Text style={styles.headerItalic}>arranged?</Text>
          </Text>
          <Text style={styles.headerSub}>
            Everything at your suite, on your schedule and never a knock unannounced.
          </Text>
        </View>

        {/* ─── SERVICE CARDS ─── */}
        <View style={styles.cards}>
          {CARDS.map((card, i) => (
            <ServiceHubCard
              key={card.id}
              card={card}
              index={i}
              onPress={() => {
                if (card.href) router.push(card.href);
              }}
            />
          ))}
        </View>

        {/* ─── FOOTNOTE ─── */}
        <View style={styles.footnote}>
          <Text style={styles.footText}>Hôtel Octave · All charges to folio</Text>
          <Text style={styles.footText}>24 / 7</Text>
        </View>
      </ScrollView>

      {/* DOCK FADE */}
      <LinearGradient
        colors={['transparent', 'rgba(8,7,10,0.85)', Luxe.obsidian]}
        locations={[0, 0.5, 0.85]}
        pointerEvents="none"
        style={styles.dockFade}
      />
    </View>
  );
}

function ServiceHubCard({
  card,
  index,
  onPress,
}: {
  card: ServiceCard;
  index: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!card.available}
      accessibilityRole="button"
      accessibilityLabel={card.title + ' ' + card.titleItalic}
      style={[styles.card, !card.available && styles.cardDimmed]}
    >
      {/* gradient background */}
      <LinearGradient
        colors={[card.accentFrom, card.accentTo]}
        start={{ x: 0.85, y: 0 }}
        end={{ x: 0.1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: LuxeRadii.xl }]}
      />
      {/* border overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: LuxeRadii.xl,
            borderWidth: 1,
            borderColor: card.borderColor,
          },
        ]}
        pointerEvents="none"
      />

      {/* top row: icon + arrow */}
      <View style={styles.cardTop}>
        <View style={[styles.iconBox, { borderColor: card.borderColor }]}>
          <Ionicons
            name={card.icon}
            size={22}
            color={card.available ? Luxe.goldBright : Luxe.titanium}
          />
        </View>
        <View style={styles.cardTopRight}>
          {!card.available && (
            <View style={styles.soonPill}>
              <Text style={styles.soonText}>SOON</Text>
            </View>
          )}
          {card.available && (
            <View style={styles.arrowBox}>
              <Ionicons name="arrow-forward" size={15} color={Luxe.goldBright} />
            </View>
          )}
        </View>
      </View>

      {/* text block */}
      <View style={styles.cardBody}>
        <Text style={styles.cardKicker}>{card.kicker}</Text>
        <Text style={styles.cardTitle}>
          {card.title}{' '}
          <Text style={styles.cardTitleItalic}>{card.titleItalic}</Text>
        </Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {card.desc}
        </Text>
      </View>

      {/* footer strip */}
      <View style={styles.cardFoot}>
        <View style={styles.cardDivider} />
        <View style={styles.cardFootRow}>
          <Ionicons
            name="time-outline"
            size={11}
            color={card.available ? Luxe.gold : Luxe.muted}
          />
          <Text style={[styles.cardMeta, !card.available && { color: Luxe.muted }]}>
            {card.meta}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },

  scroll: { paddingHorizontal: 20 },

  header: { marginBottom: 32 },
  headerKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.gold,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  headerTitle: {
    fontFamily: LuxeFonts.serif,
    fontSize: 42,
    lineHeight: 44,
    color: Luxe.ivory,
    letterSpacing: -1,
    marginBottom: 14,
  },
  headerItalic: {
    fontFamily: LuxeFonts.serifItalic,
    color: Luxe.goldBright,
  },
  headerSub: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 13.5,
    lineHeight: 20,
    color: Luxe.ivoryDim,
    maxWidth: 320,
  },

  cards: { gap: 14 },

  card: {
    borderRadius: LuxeRadii.xl,
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    backgroundColor: Luxe.softBlack,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 6 },
    }),
  },
  cardDimmed: { opacity: 0.55 },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardTopRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.07)',
    borderWidth: 0.5,
  },
  arrowBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.24)',
  },
  soonPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(154,147,138,0.10)',
    borderWidth: 0.5,
    borderColor: 'rgba(154,147,138,0.22)',
  },
  soonText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8.5,
    color: Luxe.titanium,
    letterSpacing: 1.4,
  },

  cardBody: { gap: 6 },
  cardKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontFamily: LuxeFonts.serif,
    fontSize: 30,
    lineHeight: 33,
    color: Luxe.ivory,
    letterSpacing: -0.6,
  },
  cardTitleItalic: {
    fontFamily: LuxeFonts.serifItalic,
    color: Luxe.goldBright,
  },
  cardDesc: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 13,
    lineHeight: 19,
    color: Luxe.ivoryDim,
    marginTop: 4,
  },

  cardFoot: { marginTop: 18 },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,240,210,0.10)',
    marginBottom: 14,
  },
  cardFootRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cardMeta: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  footnote: {
    marginTop: 36,
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

  dockFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
    pointerEvents: 'none',
  },
});
