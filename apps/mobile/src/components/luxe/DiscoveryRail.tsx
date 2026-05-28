import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Luxe, LuxeFonts } from '../../theme/luxe';

type Tone = 'amber' | 'bronze' | 'ink' | 'ivory' | 'deep';

export interface DiscoveryItem {
  kicker: string;
  title: string;
  meta: string;
  byline?: string;
  tone?: Tone;
}

const PALETTES: Record<Tone, { base: string; a: string; b: string; c: string }> = {
  amber: { base: '#15130f', a: 'rgba(244,201,126,0.20)', b: 'rgba(212,168,87,0.08)', c: 'rgba(244,201,126,0.10)' },
  bronze: { base: '#13110e', a: 'rgba(139,111,71,0.28)', b: 'rgba(139,111,71,0.06)', c: 'rgba(212,168,87,0.05)' },
  ink: { base: '#0e0c09', a: 'rgba(168,162,154,0.10)', b: 'rgba(168,162,154,0.02)', c: 'rgba(155,160,170,0.06)' },
  ivory: { base: '#16130f', a: 'rgba(245,239,224,0.14)', b: 'rgba(245,239,224,0.04)', c: 'rgba(245,239,224,0.06)' },
  deep: { base: '#0c0d10', a: 'rgba(60,70,90,0.18)', b: 'rgba(40,42,55,0.06)', c: 'rgba(244,201,126,0.06)' },
};

interface DiscoveryRailProps {
  items: DiscoveryItem[];
}

export function DiscoveryRail({ items }: DiscoveryRailProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      snapToInterval={294}
      decelerationRate="fast"
    >
      {items.map((it, i) => (
        <DiscoveryCard key={i} item={it} />
      ))}
    </ScrollView>
  );
}

function DiscoveryCard({ item }: { item: DiscoveryItem }) {
  const palette = PALETTES[item.tone ?? 'amber'];
  return (
    <View style={styles.card}>
      {/* base */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.base }]} />
      {/* atmospheric pools */}
      <LinearGradient
        colors={[palette.b, 'transparent']}
        locations={[0, 0.6]}
        start={{ x: 0.28, y: 0.18 }}
        end={{ x: 1, y: 0.9 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[palette.c, 'transparent']}
        locations={[0, 0.65]}
        start={{ x: 0.8, y: 0.9 }}
        end={{ x: 0, y: 0.2 }}
        style={StyleSheet.absoluteFill}
      />
      {/* legibility fade */}
      <LinearGradient
        colors={['rgba(8,7,10,0.10)', 'rgba(8,7,10,0.92)']}
        locations={[0.35, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.topRow}>
        <Text style={styles.kicker}>{item.kicker}</Text>
        <View style={styles.metaPill}>
          <Text style={styles.metaText}>{item.meta}</Text>
        </View>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.title}>{item.title}</Text>
        {item.byline ? <Text style={styles.byline}>{item.byline}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 28, gap: 14 },
  card: {
    width: 280,
    height: 360,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Luxe.hairline,
  },
  topRow: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    letterSpacing: 1.8,
    color: Luxe.gold,
    textTransform: 'uppercase',
  },
  metaPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.18)',
    backgroundColor: 'rgba(8,7,10,0.4)',
  },
  metaText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.ivoryDim,
    letterSpacing: 1,
  },
  bottom: { position: 'absolute', left: 20, right: 20, bottom: 20 },
  title: {
    fontFamily: LuxeFonts.serif,
    fontSize: 30,
    lineHeight: 32,
    color: Luxe.ivory,
    letterSpacing: -0.6,
  },
  byline: {
    fontFamily: LuxeFonts.sans,
    fontSize: 11.5,
    color: Luxe.ivoryDim,
    marginTop: 8,
    letterSpacing: -0.05,
  },
});
