import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Luxe, LuxeFonts } from '../../theme/luxe';
import {
  useCheckinStore,
  type FloorPreference,
  type PillowType,
} from '../../stores/checkin.store';
import { useReservationStore } from '../../stores/reservation.store';

const TEMP_MIN = 16;
const TEMP_MAX = 28;

const PILLOWS: { key: PillowType; label: string }[] = [
  { key: 'soft', label: 'Soft' },
  { key: 'medium', label: 'Medium' },
  { key: 'firm', label: 'Firm' },
];

const FLOORS: { key: FloorPreference; label: string }[] = [
  { key: 'high', label: 'High' },
  { key: 'low', label: 'Low' },
  { key: 'none', label: 'Any' },
];

export function RoomPreferences() {
  const prefs = useCheckinStore((s) => s.preferences);
  const update = useCheckinStore((s) => s.updatePreferences);
  const reservation = useReservationStore((s) => s.reservation);
  const updateDnd = useReservationStore((s) => s.updateDnd);

  // Local override keeps the toggle responsive even when no reservation is
  // loaded (the store can't persist isDnd without one). Falls back to store state.
  const [dndOverride, setDndOverride] = useState<boolean | null>(null);
  const isDnd = dndOverride ?? reservation?.isDnd ?? false;

  const setTemp = (delta: number) => {
    const next = Math.min(TEMP_MAX, Math.max(TEMP_MIN, prefs.roomTempCelsius + delta));
    if (next === prefs.roomTempCelsius) return;
    void Haptics.selectionAsync();
    update({ roomTempCelsius: next });
  };

  const toggleDnd = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = !isDnd;
    setDndOverride(next);
    if (reservation) void updateDnd(next);
  };

  return (
    <View style={styles.card}>
      {/* Climate */}
      <View style={styles.row}>
        <View style={styles.rowLead}>
          <View style={styles.iconBox}>
            <Ionicons name="thermometer-outline" size={17} color={Luxe.goldBright} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.rowLabel}>Heater</Text>
            <Text style={styles.rowSub}>Set the suite temperature for the night</Text>
          </View>
        </View>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => setTemp(-1)}
            disabled={prefs.roomTempCelsius <= TEMP_MIN}
            style={[styles.stepBtn, prefs.roomTempCelsius <= TEMP_MIN && styles.stepBtnOff]}
            hitSlop={6}
          >
            <Ionicons name="remove" size={16} color={Luxe.ivory} />
          </Pressable>
          <Text style={styles.tempValue}>
            {prefs.roomTempCelsius}
            <Text style={styles.tempUnit}>°C</Text>
          </Text>
          <Pressable
            onPress={() => setTemp(1)}
            disabled={prefs.roomTempCelsius >= TEMP_MAX}
            style={[styles.stepBtn, prefs.roomTempCelsius >= TEMP_MAX && styles.stepBtnOff]}
            hitSlop={6}
          >
            <Ionicons name="add" size={16} color={Luxe.ivory} />
          </Pressable>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Pillow */}
      <View style={styles.stackRow}>
        <Text style={styles.rowLabel}>Pillow</Text>
        <Segment
          options={PILLOWS}
          value={prefs.pillowType}
          onChange={(v) => update({ pillowType: v as PillowType })}
        />
      </View>

      <View style={styles.divider} />

      {/* Floor */}
      <View style={styles.stackRow}>
        <Text style={styles.rowLabel}>Floor</Text>
        <Segment
          options={FLOORS}
          value={prefs.floorPreference}
          onChange={(v) => update({ floorPreference: v as FloorPreference })}
        />
      </View>

      <View style={styles.divider} />

      {/* Do Not Disturb */}
      <View style={styles.row}>
        <View style={styles.rowLead}>
          <View style={styles.iconBox}>
            <Ionicons
              name={isDnd ? 'moon' : 'moon-outline'}
              size={17}
              color={isDnd ? Luxe.ivoryDim : Luxe.goldBright}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.rowLabel}>Do not disturb</Text>
            <Text style={styles.rowSub}>
              {isDnd ? 'Privacy on — staff will hold' : 'Pause housekeeping entry'}
            </Text>
          </View>
        </View>
        <Toggle enabled={isDnd} onToggle={toggleDnd} />
      </View>
    </View>
  );
}

function Segment({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(o.key);
            }}
            style={[styles.segItem, active && styles.segItemActive]}
          >
            <Text style={[styles.segText, active && styles.segTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  const anim = useRef(new Animated.Value(enabled ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: enabled ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [enabled, anim]);
  const knobX = anim.interpolate({ inputRange: [0, 1], outputRange: [3, 25] });
  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,240,210,0.10)', 'rgba(244,201,126,0.55)'],
  });
  return (
    <Pressable onPress={onToggle} accessibilityRole="switch" accessibilityState={{ checked: enabled }}>
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.knob, { transform: [{ translateX: knobX }] }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 22,
    padding: 18,
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.18)',
    backgroundColor: Luxe.softBlack,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowLead: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 13, minWidth: 0 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.07)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.2)',
  },
  rowLabel: { fontFamily: LuxeFonts.serif, fontSize: 17, color: Luxe.ivory, letterSpacing: -0.3 },
  rowSub: { fontFamily: LuxeFonts.sansLight, fontSize: 11.5, color: Luxe.titanium, marginTop: 2 },

  stackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,240,210,0.08)',
    marginVertical: 16,
  },

  // Stepper
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.24)',
    backgroundColor: 'rgba(244,201,126,0.06)',
  },
  stepBtnOff: { opacity: 0.35 },
  tempValue: {
    fontFamily: LuxeFonts.serif,
    fontSize: 20,
    color: Luxe.ivory,
    letterSpacing: -0.4,
    minWidth: 46,
    textAlign: 'center',
  },
  tempUnit: { fontFamily: LuxeFonts.monoMedium, fontSize: 10, color: Luxe.gold },

  // Segment
  segment: {
    flexDirection: 'row',
    gap: 6,
    padding: 3,
    borderRadius: 13,
    backgroundColor: 'rgba(12,10,8,0.6)',
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
  },
  segItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  segItemActive: {
    backgroundColor: 'rgba(244,201,126,0.14)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.4)',
  },
  segText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 11,
    color: Luxe.ivoryDim,
    letterSpacing: 0.4,
  },
  segTextActive: { color: Luxe.goldBright },

  // Toggle
  track: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.12)',
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Luxe.ivory,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
});
