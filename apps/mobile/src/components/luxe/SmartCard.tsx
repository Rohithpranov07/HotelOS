import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Luxe, LuxeFonts } from '../../theme/luxe';

interface SmartCardProps {
  kicker: string;
  title: string;
  body?: string;
  action?: string;
  glow?: 'gold' | 'ink' | 'bronze';
  live?: boolean;
  backgroundImage?: number;
  onPress?: () => void;
}

export function SmartCard({
  kicker,
  title,
  body,
  action,
  glow = 'gold',
  live,
  backgroundImage,
  onPress,
}: SmartCardProps) {
  const glowColor =
    glow === 'gold'
      ? 'rgba(244,201,126,0.16)'
      : glow === 'ink'
        ? 'rgba(168,162,154,0.10)'
        : 'rgba(139,111,71,0.18)';

  const content = (
    <>
      {backgroundImage ? (
        <>
          {/* Top scrim — keeps kicker and action pill legible */}
          <LinearGradient
            colors={['rgba(4,3,1,0.78)', 'rgba(4,3,1,0.32)', 'transparent']}
            locations={[0, 0.35, 0.65]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Bottom scrim — keeps title and body legible */}
          <LinearGradient
            colors={['transparent', 'rgba(5,3,1,0.72)', 'rgba(4,2,0,0.94)']}
            locations={[0.30, 0.62, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : (
        <LinearGradient
          colors={[glowColor, 'transparent']}
          locations={[0, 0.55]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 0.8 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.topHairline} />
      <View style={styles.header}>
        <View style={[styles.kickerRow, backgroundImage ? styles.kickerRowOnImage : null]}>
          {live ? <View style={styles.liveDot} /> : null}
          <Text style={[styles.kicker, backgroundImage ? styles.kickerOnImage : null]}>{kicker}</Text>
        </View>
        {action ? (
          <View style={[styles.actionPill, backgroundImage ? styles.actionPillOnImage : null]}>
            <Text style={[styles.actionText, backgroundImage ? styles.actionTextOnImage : null]}>{action}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.title, backgroundImage ? styles.titleOnImage : null]}>{title}</Text>
      {body ? <Text style={[styles.body, backgroundImage ? styles.bodyOnImage : null]}>{body}</Text> : null}
    </>
  );

  const inner = backgroundImage ? (
    <View style={styles.card}>
      <Image
        source={backgroundImage}
        style={[StyleSheet.absoluteFill, styles.bgImage]}
        contentFit="cover"
        cachePolicy="memory-disk"
        priority="high"
        transition={180}
      />
      {content}
    </View>
  ) : (
    <LinearGradient
      colors={[Luxe.surfaceTop, '#0C0A08']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.card}
    >
      {content}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} unstable_pressDelay={130} style={styles.pressWrap}>
        {inner}
      </Pressable>
    );
  }
  return inner;
}

const styles = StyleSheet.create({
  pressWrap: { borderRadius: 24 },
  card: {
    borderRadius: 24,
    padding: 22,
    paddingTop: 22,
    paddingBottom: 22,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.10)',
  },
  topHairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(244,201,126,0.36)',
  },
  bgImage: {
    borderRadius: 24,
    opacity: 0.78,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Luxe.goldBright },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  actionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.48)',
    backgroundColor: 'rgba(244,201,126,0.10)',
  },
  actionText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.goldBright,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: LuxeFonts.serif,
    fontSize: 24,
    lineHeight: 28,
    color: Luxe.ivory,
    letterSpacing: -0.4,
    marginTop: 14,
  },
  body: {
    fontFamily: LuxeFonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: Luxe.ivoryDim,
    marginTop: 10,
    letterSpacing: -0.1,
    maxWidth: 290,
  },
  kickerRowOnImage: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.14)',
  },
  kickerOnImage: {
    color: 'rgba(244,201,126,1)',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  actionPillOnImage: {
    borderColor: 'rgba(255,240,210,0.36)',
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  actionTextOnImage: {
    color: Luxe.ivory,
  },
  titleOnImage: {
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  bodyOnImage: {
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
