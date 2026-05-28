import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Luxe, LuxeFonts } from '../../theme/luxe';

interface HeroProps {
  greeting: string;
  name: string;
  subhead: string;
  propertyName?: string;
  propertyCity?: string;
  temperatureC?: number;
  weatherLabel?: string;
  suiteNumber?: string;
}

export function Hero({
  greeting,
  name,
  subhead,
  propertyName = 'Hôtel Octave',
  propertyCity = 'Kyoto',
  temperatureC = 22,
  weatherLabel = 'Clear, light wind',
  suiteNumber,
}: HeroProps) {
  const insets = useSafeAreaInsets();
  const [time, setTime] = useState(formatTime);
  useEffect(() => {
    const id = setInterval(() => setTime(formatTime()), 30_000);
    return () => clearInterval(id);
  }, []);

  const suiteHead = suiteNumber ? suiteNumber.slice(0, -2) : '16';
  const suiteTail = suiteNumber ? suiteNumber.slice(-2) : '04';

  return (
    <View style={styles.root}>
      {/* Atmosphere layers */}
      <View style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: Luxe.obsidian }]} />
        <LinearGradient
          colors={['rgba(244,201,126,0.34)', 'rgba(244,201,126,0.10)', 'transparent']}
          locations={[0, 0.35, 0.62]}
          start={{ x: 0.95, y: 0.05 }}
          end={{ x: 0.4, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(212,168,87,0.20)', 'rgba(139,111,71,0.06)', 'transparent']}
          locations={[0, 0.42, 0.7]}
          start={{ x: 0.02, y: 0.82 }}
          end={{ x: 0.5, y: 0.4 }}
          style={StyleSheet.absoluteFill}
        />
        {/* horizon line */}
        <View style={styles.horizon} />
        {/* bottom fade to body */}
        <LinearGradient
          colors={['transparent', Luxe.obsidian]}
          locations={[0, 0.92]}
          style={styles.bottomFade}
          pointerEvents="none"
        />
      </View>

      {/* Top meta */}
      <View style={[styles.topMeta, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topMetaLeft}>
          <View style={styles.liveDot} />
          <Text style={styles.metaLabel}>{propertyName}</Text>
          <View style={styles.metaDivider} />
          <Text style={[styles.metaLabel, { color: Luxe.muted }]}>{propertyCity}</Text>
        </View>
        <Text style={styles.timeText}>{time}</Text>
      </View>

      {/* Editorial headline */}
      <View style={styles.headlineBlock}>
        <Text style={styles.greeting}>{greeting},</Text>
        <Text style={styles.nameText}>{name}.</Text>
        <Text style={styles.subhead}>{subhead}</Text>
      </View>

      {/* Status row */}
      <View style={styles.statusRow}>
        <LinearGradient
          colors={['transparent', Luxe.hairlineStrong, Luxe.hairlineStrong, 'transparent']}
          locations={[0, 0.2, 0.8, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.divider}
        />
        <View style={styles.statusInner}>
          <View>
            <Text style={styles.kicker}>{propertyCity} · Tonight</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={styles.tempValue}>{temperatureC}</Text>
              <Text style={styles.tempDegree}>°</Text>
              <Text style={styles.weatherLabel}>{weatherLabel}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.kicker}>Suite</Text>
            <Text style={styles.suiteText}>
              {suiteHead}
              <Text style={{ fontStyle: 'italic', color: Luxe.goldBright }}>{suiteTail}</Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function formatTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  root: { height: 660, overflow: 'hidden' },
  horizon: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '54%',
    height: 1,
    backgroundColor: 'rgba(232,180,102,0.22)',
  },
  bottomFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 200 },
  topMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  topMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Luxe.goldBright,
  },
  metaLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2.4,
    color: Luxe.ivoryDim,
    textTransform: 'uppercase',
  },
  metaDivider: { width: 1, height: 10, backgroundColor: Luxe.hairlineStrong },
  timeText: {
    fontFamily: LuxeFonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    color: Luxe.ivoryDim,
  },
  headlineBlock: { paddingHorizontal: 28, paddingTop: 90 },
  greeting: {
    fontFamily: LuxeFonts.serif,
    fontSize: 36,
    lineHeight: 36,
    color: Luxe.ivory,
    letterSpacing: -0.4,
  },
  nameText: {
    fontFamily: LuxeFonts.serifItalic,
    fontSize: 84,
    lineHeight: 82,
    color: Luxe.amberGlow,
    letterSpacing: -1.6,
    marginTop: 8,
  },
  subhead: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 15,
    color: Luxe.ivoryDim,
    lineHeight: 23,
    maxWidth: 290,
    marginTop: 26,
    letterSpacing: -0.1,
  },
  statusRow: { position: 'absolute', left: 0, right: 0, bottom: 110, paddingHorizontal: 28 },
  divider: { height: 1, marginBottom: 22 },
  statusInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  tempValue: {
    fontFamily: LuxeFonts.serif,
    fontSize: 44,
    lineHeight: 40,
    color: Luxe.ivory,
    letterSpacing: -1,
  },
  tempDegree: {
    fontFamily: LuxeFonts.serif,
    fontSize: 22,
    color: Luxe.titanium,
  },
  weatherLabel: {
    fontFamily: LuxeFonts.sans,
    fontSize: 12,
    color: Luxe.ivoryDim,
    letterSpacing: -0.1,
    marginLeft: 6,
  },
  suiteText: {
    fontFamily: LuxeFonts.serif,
    fontSize: 28,
    lineHeight: 28,
    color: Luxe.ivory,
    letterSpacing: -0.6,
  },
});
