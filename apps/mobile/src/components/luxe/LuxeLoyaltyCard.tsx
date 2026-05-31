import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Luxe, LuxeFonts } from '../../theme/luxe';

interface LuxeLoyaltyCardProps {
  tier: string;
  points: number;
  since?: string;
  nextTier?: string;
  progress?: number; // 0..1
  monogram?: string;
}

export function LuxeLoyaltyCard({
  tier,
  points,
  since = '2021',
  nextTier = 'Noir',
  progress = 0.74,
  monogram = 'R',
}: LuxeLoyaltyCardProps) {
  const parts = tier.split(' ');
  const head = parts[0];
  const tail = parts.slice(1).join(' ');
  const pct = Math.max(0, Math.min(1, progress));

  return (
    <LinearGradient
      colors={['#1a1612', Luxe.obsidian, '#14110e']}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <LinearGradient
        colors={['rgba(244,201,126,0.26)', 'rgba(244,201,126,0.04)', 'transparent']}
        locations={[0, 0.4, 0.7]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.75, y: 0.75 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topHairline} />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.society}>
            Kodai Society
            <Text style={{ color: Luxe.muted }}>{`  ·  ${since}`}</Text>
          </Text>
          <Text style={styles.tier}>
            {head}{' '}
            {tail ? (
              <Text style={{ fontFamily: LuxeFonts.serifItalic, color: Luxe.goldBright }}>{tail}</Text>
            ) : null}
          </Text>
        </View>
        <View style={styles.monogram}>
          <Text style={styles.monogramText}>{monogram}</Text>
        </View>
      </View>

      <View style={styles.bottom}>
        <View>
          <Text style={styles.label}>Points</Text>
          <Text style={styles.points}>{points.toLocaleString()}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.label}>Next · {nextTier}</Text>
          <View style={styles.progressRow}>
            <View style={styles.barTrack}>
              <LinearGradient
                colors={['#D4A857', '#F4C97E']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[styles.barFill, { width: `${pct * 100}%` }]}
              />
            </View>
            <Text style={styles.percent}>{Math.round(pct * 100)}%</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 240,
    borderRadius: 26,
    padding: 24,
    paddingBottom: 22,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(212,168,87,0.34)',
  },
  topHairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(244,201,126,0.65)',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  society: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    letterSpacing: 2,
    color: Luxe.gold,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  tier: {
    fontFamily: LuxeFonts.serif,
    fontSize: 34,
    lineHeight: 34,
    color: Luxe.ivory,
    letterSpacing: -0.7,
  },
  monogram: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.06)',
  },
  monogramText: {
    fontFamily: LuxeFonts.serifItalic,
    fontSize: 20,
    color: Luxe.goldBright,
  },
  bottom: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  label: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.8,
    color: Luxe.muted,
    textTransform: 'uppercase',
  },
  points: {
    fontFamily: LuxeFonts.serif,
    fontSize: 40,
    lineHeight: 40,
    color: Luxe.ivory,
    letterSpacing: -0.8,
    marginTop: 6,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  barTrack: {
    width: 80,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,240,210,0.12)',
    overflow: 'hidden',
  },
  barFill: { height: 3, borderRadius: 2 },
  percent: {
    fontFamily: LuxeFonts.mono,
    fontSize: 11,
    color: Luxe.ivoryDim,
  },
});
