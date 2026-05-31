import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Luxe, LuxeFonts } from '../../theme/luxe';
import { useWeather } from '../../lib/useWeather';

const KODAIKANAL_LAT = 10.2381;
const KODAIKANAL_LON = 77.4892;

interface HeroProps {
  greeting: string;
  name: string;
  subhead: string;
  propertyName?: string;
  propertyCity?: string;
  /** Override the live weather (otherwise fetched from Open-Meteo). */
  temperatureC?: number;
  weatherLabel?: string;
  suiteNumber?: string;
}

export function Hero({
  greeting,
  name,
  subhead,
  propertyName = 'Hotel Kodai International',
  propertyCity = 'Kodaikanal',
  temperatureC,
  weatherLabel,
  suiteNumber,
}: HeroProps) {
  const insets = useSafeAreaInsets();
  const [time, setTime] = useState(formatTime);
  useEffect(() => {
    const id = setInterval(() => setTime(formatTime()), 30_000);
    return () => clearInterval(id);
  }, []);

  const liveWeather = useWeather(KODAIKANAL_LAT, KODAIKANAL_LON, {
    temperatureC: 17,
    label: 'Cool, pine mist',
  });
  const displayTemp = temperatureC ?? liveWeather.temperatureC;
  const displayLabel = weatherLabel ?? liveWeather.label;

  const suiteHead = suiteNumber ? suiteNumber.slice(0, -2) : '16';
  const suiteTail = suiteNumber ? suiteNumber.slice(-2) : '04';

  return (
    <View style={styles.root}>
      {/* Atmosphere layers */}
      <View style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: Luxe.obsidian }]} />
        <LinearGradient
          colors={['rgba(244,201,126,0.48)', 'rgba(244,201,126,0.16)', 'transparent']}
          locations={[0, 0.38, 0.66]}
          start={{ x: 0.95, y: 0.05 }}
          end={{ x: 0.4, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(212,168,87,0.28)', 'rgba(139,111,71,0.10)', 'transparent']}
          locations={[0, 0.42, 0.7]}
          start={{ x: 0.02, y: 0.82 }}
          end={{ x: 0.5, y: 0.4 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(244,201,126,0.10)', 'transparent']}
          locations={[0, 0.6]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* bottom fade to body */}
        <LinearGradient
          colors={['transparent', Luxe.obsidian]}
          locations={[0, 0.92]}
          style={styles.bottomFade}
          pointerEvents="none"
        />
      </View>

      {/* Top meta */}
      <View style={[styles.topMeta, { paddingTop: insets.top + 10 }]}>
        {/* Gold-leaf emblem */}
        <View style={styles.emblemFrame}>
          <LinearGradient
            colors={['#E8C57A', '#B8893C', '#F4D88C', '#9A6E2A']}
            locations={[0, 0.35, 0.65, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.emblemInner}>
            <LinearGradient
              colors={['#FBF5E6', '#F2E8D0', '#FBF5E6']}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Image
              source={require('../../../assets/hki-logo.png')}
              style={styles.emblemImage}
              contentFit="contain"
              cachePolicy="memory-disk"
              priority="high"
              accessibilityLabel={propertyName}
            />
          </View>
        </View>

        {/* Glass capsule with city + time */}
        <View style={styles.metaCapsule}>
          <View style={styles.liveDot} />
          <Text style={styles.metaLabel}>{propertyCity}</Text>
          <View style={styles.metaDivider} />
          <Text style={styles.timeText}>{time}</Text>
        </View>
      </View>

      {/* Editorial headline */}
      <View style={styles.headlineBlock}>
        <Text style={styles.greeting}>{greeting},</Text>
        <Text style={styles.nameText}>{name}.</Text>

        {/* Ornament divider */}
        <View style={styles.ornament}>
          <View style={styles.ornamentRule} />
          <View style={styles.ornamentDiamond} />
          <View style={styles.ornamentRule} />
        </View>

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
              <Text style={styles.tempValue}>{displayTemp}</Text>
              <Text style={styles.tempDegree}>°</Text>
              <Text style={styles.weatherLabel}>{displayLabel}</Text>
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
  root: { height: 520, overflow: 'hidden' },

  bottomFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 140 },
  topMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  topMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topMetaRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  /* Gold-leaf emblem */
  emblemFrame: {
    padding: 1.5,
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#D4A857',
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  emblemInner: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 4.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemImage: {
    width: 48,
    height: 30,
  },

  /* Glass meta capsule */
  metaCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: 'rgba(20,18,24,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212,168,87,0.30)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Luxe.goldBright,
    shadowColor: Luxe.goldBright,
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  metaLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2.4,
    color: Luxe.ivoryDim,
    textTransform: 'uppercase',
  },
  metaDivider: { width: 1, height: 10, backgroundColor: 'rgba(212,168,87,0.45)' },
  timeText: {
    fontFamily: LuxeFonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    color: Luxe.ivoryDim,
  },
  headlineBlock: { paddingHorizontal: 28, paddingTop: 52 },
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
    textShadowColor: 'rgba(244,201,126,0.30)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 24,
  },
  subhead: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 15,
    color: Luxe.ivoryDim,
    lineHeight: 23,
    maxWidth: 290,
    marginTop: 14,
    letterSpacing: -0.1,
  },

  /* Ornament — gold hairline + diamond + hairline */
  ornament: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
    width: 110,
  },
  ornamentRule: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212,168,87,0.55)',
  },
  ornamentDiamond: {
    width: 5,
    height: 5,
    backgroundColor: Luxe.goldBright,
    transform: [{ rotate: '45deg' }],
  },
  statusRow: { position: 'absolute', left: 0, right: 0, bottom: 16, paddingHorizontal: 28 },
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
