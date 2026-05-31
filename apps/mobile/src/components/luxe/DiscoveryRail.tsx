import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Luxe, LuxeFonts } from '../../theme/luxe';

type Tone = 'amber' | 'bronze' | 'ink' | 'ivory' | 'deep';

export interface DiscoveryItem {
  kicker: string;
  title: string;
  meta: string;
  byline?: string;
  tone?: Tone;
  backgroundImage?: number;
  onPress?: () => void;
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

  const overlays = (
    <>
      {item.backgroundImage ? (
        <>
          {/* Top scrim — keeps kicker and meta pill legible */}
          <LinearGradient
            colors={['rgba(4,3,1,0.74)', 'rgba(4,3,1,0.28)', 'transparent']}
            locations={[0, 0.30, 0.60]}
            style={StyleSheet.absoluteFill}
          />
          {/* Bottom scrim — keeps title and byline legible */}
          <LinearGradient
            colors={['transparent', 'rgba(5,3,1,0.68)', 'rgba(4,2,0,0.96)']}
            locations={[0.35, 0.62, 1]}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : (
        <>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.base }]} />
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
          <LinearGradient
            colors={['rgba(8,7,10,0.10)', 'rgba(8,7,10,0.92)']}
            locations={[0.35, 1]}
            style={StyleSheet.absoluteFill}
          />
        </>
      )}
      <View style={styles.topRow}>
        <View style={[styles.kickerCapsule, item.backgroundImage ? styles.kickerCapsuleOnImage : null]}>
          <Text style={[styles.kicker, item.backgroundImage ? styles.kickerOnImage : null]}>{item.kicker}</Text>
        </View>
        <View style={[styles.metaPill, item.backgroundImage ? styles.metaPillOnImage : null]}>
          <Text style={styles.metaText}>{item.meta}</Text>
        </View>
      </View>
      <View style={styles.bottom}>
        <Text style={[styles.title, item.backgroundImage ? styles.titleOnImage : null]}>{item.title}</Text>
        {item.byline ? <Text style={[styles.byline, item.backgroundImage ? styles.bylineOnImage : null]}>{item.byline}</Text> : null}
      </View>
    </>
  );

  const cardContent = item.backgroundImage ? (
    <View style={styles.card}>
      <Image
        source={item.backgroundImage}
        style={[StyleSheet.absoluteFill, styles.bgImage]}
        contentFit="cover"
        cachePolicy="memory-disk"
        priority="high"
        transition={180}
      />
      {overlays}
    </View>
  ) : (
    <View style={styles.card}>{overlays}</View>
  );

  if (item.onPress) {
    return (
      <Pressable onPress={item.onPress} unstable_pressDelay={130} style={styles.cardPress}>
        {cardContent}
      </Pressable>
    );
  }
  return cardContent;
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 28, gap: 14 },
  cardPress: { borderRadius: 26 },
  card: {
    width: 280,
    height: 360,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Luxe.hairline,
  },
  bgImage: {
    borderRadius: 26,
    opacity: 0.75,
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
  kickerCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kickerCapsuleOnImage: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.40)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.16)',
  },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    letterSpacing: 1.8,
    color: Luxe.gold,
    textTransform: 'uppercase',
  },
  kickerOnImage: {
    color: 'rgba(244,201,126,1)',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  metaPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.18)',
    backgroundColor: 'rgba(8,7,10,0.4)',
  },
  metaPillOnImage: {
    borderColor: 'rgba(255,240,210,0.28)',
    backgroundColor: 'rgba(0,0,0,0.44)',
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
  titleOnImage: {
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  byline: {
    fontFamily: LuxeFonts.sans,
    fontSize: 11.5,
    color: Luxe.ivoryDim,
    marginTop: 8,
    letterSpacing: -0.05,
  },
  bylineOnImage: {
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
