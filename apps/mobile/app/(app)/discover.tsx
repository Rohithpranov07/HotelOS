import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';
import { buildDiscoveryItems } from '../../src/lib/discoveryItems';
import type { DiscoveryItem } from '../../src/components/luxe/DiscoveryRail';

type Tone = NonNullable<DiscoveryItem['tone']>;

const PALETTES: Record<Tone, { base: string; a: string; b: string }> = {
  amber: { base: '#15130f', a: 'rgba(244,201,126,0.22)', b: 'rgba(244,201,126,0.08)' },
  bronze: { base: '#13110e', a: 'rgba(139,111,71,0.28)', b: 'rgba(212,168,87,0.07)' },
  ink: { base: '#0e0c09', a: 'rgba(168,162,154,0.12)', b: 'rgba(155,160,170,0.05)' },
  ivory: { base: '#16130f', a: 'rgba(245,239,224,0.16)', b: 'rgba(245,239,224,0.05)' },
  deep: { base: '#0c0d10', a: 'rgba(60,70,90,0.20)', b: 'rgba(244,201,126,0.06)' },
};

export default function DiscoverScreen() {
  void useLuxeFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const items = buildDiscoveryItems(router);

  // Split items into two columns
  const left = items.filter((_, i) => i % 2 === 0);
  const right = items.filter((_, i) => i % 2 === 1);

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        bounces={false}
        overScrollMode="never"
      >
        {/* HERO */}
        <View style={[styles.hero, { paddingTop: insets.top + 14 }]}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Luxe.obsidian }]} />
          <LinearGradient
            colors={['rgba(244,201,126,0.22)', 'rgba(244,201,126,0.05)', 'transparent']}
            locations={[0, 0.4, 0.72]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.2, y: 0.7 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.ringOuter} />
          <View style={styles.ringInner}>
            <LinearGradient
              colors={['rgba(244,201,126,0.18)', 'transparent']}
              start={{ x: 0.25, y: 0.25 }}
              end={{ x: 0.85, y: 0.85 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="compass-outline" size={22} color={Luxe.goldBright} />
          </View>

          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.glassPill} hitSlop={8}>
              <Ionicons name="chevron-back" size={16} color={Luxe.ivory} />
            </Pressable>
            <View style={styles.editChip}>
              <Text style={styles.editChipText}>The Edit</Text>
            </View>
          </View>

          <View style={styles.heroTitleBlock}>
            <Text style={styles.heroKicker}>Curated · Tonight</Text>
            <Text style={styles.heroTitle}>
              Every moment,{'\n'}
              <Text style={styles.heroTitleItalic}>considered.</Text>
            </Text>
            <Text style={styles.heroSub}>
              Dining, spa, culture, suite services — arranged the moment you ask.
            </Text>
          </View>
        </View>

        {/* GRID */}
        <View style={styles.grid}>
          <View style={styles.col}>
            {left.map((item, i) => (
              <GridCard key={i} item={item} tall={i === 0} />
            ))}
          </View>
          <View style={styles.col}>
            {right.map((item, i) => (
              <GridCard key={i} item={item} tall={i === right.length - 1} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* bottom fade */}
      <LinearGradient
        colors={['transparent', 'rgba(8,7,10,0.9)', Luxe.obsidian]}
        locations={[0, 0.5, 0.85]}
        pointerEvents="none"
        style={styles.bottomFade}
      />
    </View>
  );
}

function GridCard({ item, tall }: { item: DiscoveryItem; tall?: boolean }) {
  const palette = PALETTES[item.tone ?? 'amber'];
  const card = (
    <View style={[styles.card, tall && styles.cardTall]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.base, borderRadius: 22 }]} />
      <LinearGradient
        colors={[palette.a, 'transparent']}
        locations={[0, 0.6]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 0.8 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
      />
      <LinearGradient
        colors={[palette.b, 'transparent']}
        locations={[0, 0.7]}
        start={{ x: 0.8, y: 0.9 }}
        end={{ x: 0.1, y: 0.1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
      />
      <LinearGradient
        colors={['rgba(8,7,10,0.05)', 'rgba(8,7,10,0.88)']}
        locations={[0.3, 1]}
        style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
      />

      <View style={styles.cardTop}>
        <Text style={styles.cardKicker}>{item.kicker}</Text>
        <View style={styles.cardMetaPill}>
          <Text style={styles.cardMeta}>{item.meta}</Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.byline ? (
          <Text style={styles.cardByline} numberOfLines={2}>
            {item.byline}
          </Text>
        ) : null}
        {item.onPress ? (
          <View style={styles.cardArrow}>
            <Ionicons name="arrow-forward" size={12} color={Luxe.goldBright} />
          </View>
        ) : null}
      </View>
    </View>
  );

  if (item.onPress) {
    return (
      <Pressable onPress={item.onPress} style={styles.cardPress}>
        {card}
      </Pressable>
    );
  }
  return card;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },

  // HERO
  hero: { overflow: 'hidden', paddingBottom: 28 },
  ringOuter: {
    position: 'absolute',
    right: -80,
    top: 10,
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.12)',
  },
  ringInner: {
    position: 'absolute',
    right: -4,
    top: 66,
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.20)',
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
  editChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: 'rgba(20,18,15,0.55)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.22)',
  },
  editChipText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.ivoryDim,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitleBlock: { paddingHorizontal: 24, marginTop: 24 },
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
    fontSize: 40,
    lineHeight: 42,
    color: Luxe.ivory,
    letterSpacing: -1,
  },
  heroTitleItalic: { fontFamily: LuxeFonts.serifItalic, color: Luxe.goldBright },
  heroSub: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 13,
    lineHeight: 19,
    color: Luxe.ivoryDim,
    marginTop: 12,
    maxWidth: 310,
  },

  // GRID
  grid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 6,
  },
  col: { flex: 1, gap: 12 },

  cardPress: { borderRadius: 22 },
  card: {
    borderRadius: 22,
    height: 220,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Luxe.hairline,
  },
  cardTall: { height: 290 },
  cardTop: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8.5,
    color: Luxe.gold,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  cardMetaPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.18)',
    backgroundColor: 'rgba(8,7,10,0.4)',
  },
  cardMeta: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8,
    color: Luxe.ivoryDim,
    letterSpacing: 0.8,
  },
  cardBottom: { position: 'absolute', left: 14, right: 14, bottom: 14 },
  cardTitle: {
    fontFamily: LuxeFonts.serif,
    fontSize: 20,
    lineHeight: 22,
    color: Luxe.ivory,
    letterSpacing: -0.4,
  },
  cardByline: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 10.5,
    lineHeight: 15,
    color: Luxe.ivoryDim,
    marginTop: 6,
  },
  cardArrow: {
    marginTop: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(244,201,126,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 110 },
});
