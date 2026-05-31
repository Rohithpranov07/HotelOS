import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts, LuxeRadii } from '../../src/theme/luxe';
import { PremiumScreen } from '../../src/components/luxe/PremiumScreen';

interface ServiceCard {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  kicker: string;
  title: string;
  titleItalic: string;
  desc: string;
  meta: string;
  href: '/(app)/dining' | '/(app)/housekeeping' | '/(app)/other-services' | '/(app)/complaints' | '/(app)/rooms' | null;
  accentFrom: string;
  accentTo: string;
  borderColor: string;
  available: boolean;
  backgroundImage?: number;
  tags?: string[];
  presence?: string;
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
    backgroundImage: require('../../assets/housekeeping.jpg'),
    tags: ['24 / 7', 'Discreet'],
    presence: '3 attendants on call',
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
    backgroundImage: require('../../assets/restraunt.jpg'),
    tags: ['Open · 02:00', 'In-suite'],
    presence: 'Kitchen open · chef on duty',
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
    backgroundImage: require('../../assets/lake.jpg'),
    tags: ['Curated', 'Local guides'],
    presence: 'Concierge desk · 06 — 23h',
  },
  {
    id: 'rooms',
    icon: 'bed-outline',
    kicker: 'Our property',
    title: 'Rooms',
    titleItalic: '& Suites',
    desc: 'Browse all 5 room categories — from garden-view Executive Rooms to panoramic Suites. Rates from ₹5,000 / night.',
    meta: '5 room types · From ₹5,000',
    href: '/(app)/rooms',
    accentFrom: 'rgba(180,140,60,0.20)',
    accentTo: 'rgba(120,90,30,0.04)',
    borderColor: 'rgba(212,175,90,0.28)',
    available: true,
    backgroundImage: require('../../assets/rooms/SuiteRoom2.jpg'),
    tags: ['5 categories', 'From ₹5,000'],
    presence: 'Real-time availability',
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
    tags: ['Priority', 'Confidential'],
    presence: 'Resolved within 30 min · avg',
  },
];

function formatTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ServicesScreen() {
  void useLuxeFonts();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [time, setTime] = useState(formatTime);

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime()), 30_000);
    return () => clearInterval(id);
  }, []);

  const availableCount = CARDS.filter((c) => c.available).length;

  return (
    <View style={styles.root}>
      <PremiumScreen>
      {/* Ambient amber glow behind the header area */}
      <LinearGradient
        colors={['rgba(244,201,126,0.22)', 'rgba(244,201,126,0.05)', 'transparent']}
        locations={[0, 0.35, 0.72]}
        start={{ x: 0.92, y: 0 }}
        end={{ x: 0.15, y: 0.6 }}
        style={styles.heroAmbient}
        pointerEvents="none"
      />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 8, paddingBottom: 160 },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* ─── STATUS STRIP ─── */}
        <View style={styles.statusStrip}>
          <View style={styles.statusLeft}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(app)/home'))}
              style={styles.backPill}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={16} color={Luxe.ivory} />
            </Pressable>
            <View style={styles.liveDot} />
            <Text style={styles.statusLabel}>Hotel Kodai International</Text>
          </View>
          <View style={styles.statusRight}>
            <Text style={styles.statusLabel}>Live</Text>
            <View style={styles.statusDivider} />
            <Text style={styles.statusTime}>{time}</Text>
          </View>
        </View>

        {/* ─── HEADER ─── */}
        <View style={styles.header}>
          <View style={styles.headerAccent} />
          <Text style={styles.headerKicker}>Services · Tonight</Text>
          <Text style={styles.headerTitle}>
            What would you{'\n'}like{' '}
            <Text style={styles.headerItalic}>arranged?</Text>
          </Text>
          <Text style={styles.headerSub}>
            Everything at your suite, on your schedule and never a knock unannounced.
          </Text>
        </View>

        {/* ─── CONCIERGE QUICK PROMPT ─── */}
        <Pressable
          onPress={() => router.push('/(app)/concierge')}
          unstable_pressDelay={130}
          style={styles.quickPrompt}
        >
          <LinearGradient
            colors={['rgba(244,201,126,0.14)', 'rgba(212,168,87,0.04)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
          />
          <View style={styles.quickPromptIcon}>
            <Ionicons name="sparkles" size={14} color={Luxe.goldBright} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.quickPromptKicker}>Ask Concierge</Text>
            <Text style={styles.quickPromptText}>Plan my evening, quietly</Text>
          </View>
          <Text style={styles.quickPromptArrow}>→</Text>
        </Pressable>

        {/* ─── SECTION HEADER ─── */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionRule} />
          <Text style={styles.sectionLabel}>All Services</Text>
          <View style={styles.sectionRule} />
          <Text style={styles.sectionCount}>
            {String(availableCount).padStart(2, '0')}
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

        {/* ─── ASK CONCIERGE CTA ─── */}
        <Pressable
          onPress={() => router.push('/(app)/concierge')}
          unstable_pressDelay={130}
          style={styles.ctaCard}
        >
          <LinearGradient
            colors={['#1d1814', '#14110d', '#0e0c09']}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: LuxeRadii.xl }]}
          />
          <LinearGradient
            colors={['rgba(244,201,126,0.20)', 'transparent']}
            locations={[0, 0.55]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 0.6 }}
            style={[StyleSheet.absoluteFill, { borderRadius: LuxeRadii.xl }]}
          />
          <View style={styles.ctaHairline} />
          <View style={styles.ctaTop}>
            <Text style={styles.ctaKicker}>Anything else</Text>
            <View style={styles.ctaLiveDot} />
          </View>
          <Text style={styles.ctaTitle}>
            Your concierge,{'\n'}
            <Text style={styles.ctaTitleItalic}>always listening.</Text>
          </Text>
          <Text style={styles.ctaSub}>
            Tell us what you need — ordered, arranged or simply answered.
          </Text>
          <View style={styles.ctaFoot}>
            <View style={styles.ctaChannelRow}>
              <View style={styles.ctaChannel}>
                <Ionicons name="chatbubble-outline" size={11} color={Luxe.goldBright} />
                <Text style={styles.ctaChannelText}>Chat</Text>
              </View>
              <View style={styles.ctaChannel}>
                <Ionicons name="call-outline" size={11} color={Luxe.goldBright} />
                <Text style={styles.ctaChannelText}>Call</Text>
              </View>
              <View style={styles.ctaChannel}>
                <Ionicons name="mic-outline" size={11} color={Luxe.goldBright} />
                <Text style={styles.ctaChannelText}>Voice</Text>
              </View>
            </View>
            <View style={styles.ctaArrow}>
              <Ionicons name="arrow-forward" size={14} color={Luxe.goldBright} />
            </View>
          </View>
        </Pressable>

        {/* ─── FOOTNOTE ─── */}
        <View style={styles.footnote}>
          <Text style={styles.footText}>Hotel Kodai International</Text>
          <Text style={styles.footText}>All charges to folio · 24 / 7</Text>
        </View>
      </ScrollView>

      {/* DOCK FADE */}
      <LinearGradient
        colors={['transparent', 'rgba(8,7,10,0.85)', Luxe.obsidian]}
        locations={[0, 0.5, 0.85]}
        pointerEvents="none"
        style={styles.dockFade}
      />
      </PremiumScreen>
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
      unstable_pressDelay={130}
      accessibilityRole="button"
      accessibilityLabel={card.title + ' ' + card.titleItalic}
      style={[styles.card, !card.available && styles.cardDimmed]}
    >
      {/* photo */}
      {card.backgroundImage ? (
        <Image
          source={card.backgroundImage}
          style={[StyleSheet.absoluteFill, styles.cardBgImage]}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="high"
          transition={180}
          recyclingKey={`service-${card.id}`}
        />
      ) : null}

      {/* tonal wash (very light — keeps image visible) */}
      <LinearGradient
        colors={[card.accentFrom, card.accentTo]}
        start={{ x: 0.85, y: 0 }}
        end={{ x: 0.1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: LuxeRadii.xl, opacity: card.backgroundImage ? 0.5 : 1 }]}
      />

      {/* graceful bottom gradient — holds the text */}
      {card.backgroundImage ? (
        <LinearGradient
          colors={['transparent', 'rgba(6,4,2,0.55)', 'rgba(4,3,1,0.94)']}
          locations={[0.18, 0.55, 1]}
          style={[StyleSheet.absoluteFill, { borderRadius: LuxeRadii.xl }]}
        />
      ) : null}

      {/* delicate top vignette so the photo edge feels framed, not raw */}
      {card.backgroundImage ? (
        <LinearGradient
          colors={['rgba(4,3,1,0.45)', 'transparent']}
          locations={[0, 0.30]}
          style={[StyleSheet.absoluteFill, { borderRadius: LuxeRadii.xl }]}
        />
      ) : null}

      {/* gold top-edge hairline — a stamp of quality */}
      <View style={styles.cardHairline} pointerEvents="none" />

      {/* border */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: LuxeRadii.xl,
            borderWidth: 0.5,
            borderColor: card.borderColor,
          },
        ]}
        pointerEvents="none"
      />

      {/* top row: refined outline icon + numeral */}
      <View style={styles.cardTop}>
        <View style={[styles.iconRing, { borderColor: card.borderColor }]}>
          <Ionicons
            name={card.icon}
            size={20}
            color={card.available ? Luxe.goldBright : Luxe.titanium}
          />
        </View>
        <View style={styles.cardTopRight}>
          {!card.available ? (
            <View style={styles.soonPill}>
              <Text style={styles.soonText}>SOON</Text>
            </View>
          ) : null}
          <Text style={styles.cardNumeral}>
            {String(index + 1).padStart(2, '0')}
          </Text>
        </View>
      </View>

      {/* spacer pushes text to the bottom */}
      <View style={{ flex: 1, minHeight: 18 }} />

      {/* editorial text block */}
      <View style={styles.cardBody}>
        {/* ornamental rule above kicker */}
        <View style={styles.kickerRule} />
        <Text style={styles.cardKicker}>{card.kicker}</Text>

        {/* tag chips */}
        {card.tags && card.tags.length > 0 ? (
          <View style={styles.tagRow}>
            {card.tags.map((t) => (
              <View key={t} style={styles.tagChip}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.cardTitle}>
          {card.title}{' '}
          <Text style={styles.cardTitleItalic}>{card.titleItalic}</Text>
        </Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {card.desc}
        </Text>
      </View>

      {/* presence + footer */}
      {card.presence ? (
        <View style={styles.presenceRow}>
          <View style={styles.presencePulse}>
            <View style={styles.presencePulseInner} />
          </View>
          <Text style={styles.presenceText}>{card.presence}</Text>
        </View>
      ) : null}

      {/* footer: meta + inline arrow */}
      <View style={styles.cardFoot}>
        <View style={styles.cardFootRow}>
          <View style={styles.metaDot} />
          <Text style={[styles.cardMeta, !card.available && { color: Luxe.muted }]}>
            {card.meta}
          </Text>
        </View>
        {card.available ? (
          <View style={styles.arrowInline}>
            <Text style={styles.arrowGlyph}>→</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },

  scroll: { paddingHorizontal: 20 },

  heroAmbient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 460,
  },

  /* ─── STATUS STRIP ─── */
  statusStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 22,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,18,15,0.65)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.14)',
    marginRight: 2,
  },
  statusRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Luxe.goldBright,
    shadowColor: Luxe.amberGlow,
    shadowOpacity: 0.95,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
  statusLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.ivoryDim,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  statusDivider: { width: 1, height: 10, backgroundColor: 'rgba(212,168,87,0.40)' },
  statusTime: {
    fontFamily: LuxeFonts.mono,
    fontSize: 10,
    color: Luxe.ivory,
    letterSpacing: 1.4,
  },

  header: { marginBottom: 24, position: 'relative' },
  headerAccent: {
    width: 2,
    height: 38,
    borderRadius: 2,
    backgroundColor: 'rgba(212,168,87,0.65)',
    marginBottom: 14,
  },
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
    textShadowColor: 'rgba(244,201,126,0.32)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 20,
  },
  headerSub: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 13.5,
    lineHeight: 20,
    color: Luxe.ivoryDim,
    maxWidth: 320,
  },

  /* ─── CONCIERGE QUICK PROMPT ─── */
  quickPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.30)',
    backgroundColor: 'rgba(20,17,13,0.6)',
    marginBottom: 30,
    overflow: 'hidden',
  },
  quickPromptIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.40)',
    backgroundColor: 'rgba(244,201,126,0.10)',
  },
  quickPromptKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  quickPromptText: {
    fontFamily: LuxeFonts.serif,
    fontSize: 16,
    color: Luxe.ivory,
    letterSpacing: -0.3,
  },
  quickPromptArrow: {
    fontFamily: LuxeFonts.serif,
    fontSize: 22,
    color: Luxe.goldBright,
    lineHeight: 22,
  },

  /* ─── SECTION HEADER ─── */
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  sectionRule: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212,168,87,0.32)',
  },
  sectionLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.gold,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontFamily: LuxeFonts.serifItalic,
    fontSize: 16,
    color: Luxe.goldBright,
    letterSpacing: -0.4,
    marginLeft: -4,
  },

  cards: { gap: 16 },

  card: {
    minHeight: 320,
    borderRadius: LuxeRadii.xl,
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 20,
    backgroundColor: Luxe.softBlack,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.55,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 14 },
      },
      android: { elevation: 8 },
    }),
  },
  cardBgImage: { borderRadius: LuxeRadii.xl, opacity: 0.95 },
  cardHairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(244,201,126,0.50)',
    zIndex: 3,
  },
  cardDimmed: { opacity: 0.55 },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTopRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardNumeral: {
    fontFamily: LuxeFonts.serifItalic,
    fontSize: 38,
    lineHeight: 38,
    color: 'rgba(244,201,126,0.55)',
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  iconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8,7,5,0.32)',
    borderWidth: 0.5,
  },
  soonPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(8,7,5,0.50)',
    borderWidth: 0.5,
    borderColor: 'rgba(154,147,138,0.32)',
  },
  soonText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8.5,
    color: Luxe.titanium,
    letterSpacing: 1.4,
  },

  cardBody: { gap: 6 },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  tagChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.32)',
    backgroundColor: 'rgba(8,7,5,0.40)',
  },
  tagText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8.5,
    color: Luxe.ivory,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  presenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,240,210,0.14)',
  },
  presencePulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.20)',
  },
  presencePulseInner: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Luxe.goldBright,
  },
  presenceText: {
    fontFamily: LuxeFonts.sans,
    fontSize: 11,
    color: Luxe.ivoryDim,
    letterSpacing: 0.1,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  kickerRule: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(244,201,126,0.70)',
    marginBottom: 10,
  },
  cardKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.goldBright,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cardTitle: {
    fontFamily: LuxeFonts.serif,
    fontSize: 32,
    lineHeight: 34,
    color: Luxe.ivory,
    letterSpacing: -0.7,
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  cardTitleItalic: {
    fontFamily: LuxeFonts.serifItalic,
    color: Luxe.goldBright,
  },
  cardDesc: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(245,239,224,0.82)',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  cardFoot: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFootRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Luxe.goldBright,
    shadowColor: Luxe.amberGlow,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  cardMeta: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  arrowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrowGlyph: {
    fontFamily: LuxeFonts.serif,
    fontSize: 22,
    color: Luxe.goldBright,
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  /* ─── ASK CONCIERGE CTA ─── */
  ctaCard: {
    marginTop: 28,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 20,
    borderRadius: LuxeRadii.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(212,168,87,0.34)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#D4A857',
        shadowOpacity: 0.16,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 6 },
    }),
  },
  ctaHairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(244,201,126,0.60)',
  },
  ctaTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  ctaKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.gold,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  ctaLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Luxe.goldBright,
    shadowColor: Luxe.amberGlow,
    shadowOpacity: 0.95,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
  ctaTitle: {
    fontFamily: LuxeFonts.serif,
    fontSize: 28,
    lineHeight: 32,
    color: Luxe.ivory,
    letterSpacing: -0.6,
  },
  ctaTitleItalic: {
    fontFamily: LuxeFonts.serifItalic,
    color: Luxe.goldBright,
  },
  ctaSub: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 12.5,
    lineHeight: 18,
    color: Luxe.ivoryDim,
    marginTop: 10,
    maxWidth: 280,
  },
  ctaFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(212,168,87,0.20)',
  },
  ctaChannelRow: { flexDirection: 'row', gap: 14 },
  ctaChannel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ctaChannelText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.ivoryDim,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  ctaArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.45)',
    backgroundColor: 'rgba(244,201,126,0.10)',
  },

  footnote: {
    marginTop: 28,
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
