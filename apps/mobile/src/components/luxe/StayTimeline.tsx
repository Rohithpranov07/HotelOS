import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Luxe, LuxeFonts } from '../../theme/luxe';

export interface TimelineItem {
  time: string;
  label: string;
  active?: boolean;
  done?: boolean;
}

interface StayTimelineProps {
  items: TimelineItem[];
  dayLabel?: string;
  kicker?: string;
}

export function StayTimeline({ items, dayLabel = 'Day 2 of 4', kicker }: StayTimelineProps) {
  const h = new Date().getHours();
  const label =
    kicker ??
    (h < 12 ? 'This morning' : h < 17 ? 'This afternoon' : h < 22 ? 'This evening' : 'Tonight');
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.kicker}>{label}</Text>
        <Text style={styles.day}>{dayLabel}</Text>
      </View>
      <LinearGradient
        colors={[Luxe.surfaceTop, '#0B0907']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.card}
      >
        <View style={styles.topHairline} />
        <View style={styles.rail} />
        <View style={styles.row}>
          {items.map((it, i) => (
            <View key={i} style={styles.cell}>
              <View
                style={[
                  styles.dot,
                  it.active && styles.dotActive,
                  it.done && !it.active && styles.dotDone,
                  !it.active && !it.done && styles.dotIdle,
                ]}
              />
              <Text style={[styles.time, it.active && { color: Luxe.ivory }]}>{it.time}</Text>
              <Text style={[styles.label, it.active && { color: Luxe.goldBright }]}>{it.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 28 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  day: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.ivoryDim,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  card: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
    borderRadius: 22,
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
  rail: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 36,
    height: 1,
    backgroundColor: 'rgba(255,240,210,0.10)',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cell: { flex: 1, alignItems: 'center', gap: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  dotIdle: { backgroundColor: 'rgba(255,240,210,0.16)' },
  dotDone: { backgroundColor: Luxe.goldDeep, width: 6, height: 6, borderRadius: 3 },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Luxe.goldBright,
    marginTop: 0,
    shadowColor: Luxe.amberGlow,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  time: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10.5,
    color: Luxe.ivoryDim,
    letterSpacing: 0.6,
  },
  label: {
    fontFamily: LuxeFonts.sans,
    fontSize: 10.5,
    color: Luxe.muted,
    marginTop: 3,
    textAlign: 'center',
  },
});
