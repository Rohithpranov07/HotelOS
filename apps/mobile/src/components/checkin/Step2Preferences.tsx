import { useCallback } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Luxe, LuxeFonts, LuxeRadii } from '../../theme/luxe';
import {
  useCheckinStore,
  type FloorPreference,
  type PillowType,
} from '../../stores/checkin.store';

interface Step2Props {
  onDone: () => void;
}

const PILLOWS: Array<{ kind: PillowType; label: string }> = [
  { kind: 'soft', label: 'Soft' },
  { kind: 'medium', label: 'Medium' },
  { kind: 'firm', label: 'Firm' },
];

const FLOORS: Array<{ kind: FloorPreference; label: string }> = [
  { kind: 'high', label: 'High' },
  { kind: 'low', label: 'Low' },
  { kind: 'none', label: 'No preference' },
];

const DIETARY = ['Vegetarian', 'Vegan', 'Halal', 'Gluten-free', 'No nuts'];

export function Step2Preferences({ onDone }: Step2Props) {
  const prefs = useCheckinStore((s) => s.preferences);
  const update = useCheckinStore((s) => s.updatePreferences);

  const toggleDietary = useCallback(
    (item: string) => {
      const next = prefs.dietary.includes(item)
        ? prefs.dietary.filter((d) => d !== item)
        : [...prefs.dietary, item];
      update({ dietary: next });
    },
    [prefs.dietary, update],
  );

  return (
    <View style={styles.body}>
      <Section title="Room temperature" hint={`${prefs.roomTempCelsius}°C`}>
        <TempSlider
          value={prefs.roomTempCelsius}
          onChange={(v) => update({ roomTempCelsius: v })}
        />
      </Section>

      <Section title="Pillow type">
        <Segment
          options={PILLOWS.map((p) => ({ key: p.kind, label: p.label }))}
          value={prefs.pillowType}
          onChange={(v) => update({ pillowType: v as PillowType })}
        />
      </Section>

      <Section title="Floor preference">
        <Segment
          options={FLOORS.map((f) => ({ key: f.kind, label: f.label }))}
          value={prefs.floorPreference}
          onChange={(v) => update({ floorPreference: v as FloorPreference })}
        />
      </Section>

      <Section title="Dietary preferences">
        <View style={styles.chipsWrap}>
          {DIETARY.map((item) => {
            const active = prefs.dietary.includes(item);
            return (
              <Pressable
                key={item}
                onPress={() => toggleDietary(item)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="Special requests">
        <TextInput
          value={prefs.specialNotes}
          onChangeText={(v) => update({ specialNotes: v })}
          placeholder="Celebrating anniversary…"
          placeholderTextColor={Luxe.muted}
          multiline
          numberOfLines={3}
          style={styles.notesInput}
          maxLength={500}
        />
      </Section>

      <Section title="Arrival">
        <Pressable
          onPress={() => update({ earlyCheckinRequest: !prefs.earlyCheckinRequest })}
          style={styles.toggleRow}
        >
          <View>
            <Text style={styles.toggleLabel}>Request early check-in</Text>
            <Text style={styles.toggleHint}>Subject to availability</Text>
          </View>
          <View style={[styles.switch, prefs.earlyCheckinRequest && styles.switchOn]}>
            <View
              style={[
                styles.switchKnob,
                prefs.earlyCheckinRequest && styles.switchKnobOn,
              ]}
            />
          </View>
        </Pressable>
      </Section>

      <Pressable onPress={onDone} style={styles.primaryBtn}>
        <Text style={styles.primaryBtnText}>Next</Text>
      </Pressable>
    </View>
  );
}

interface SectionProps {
  title: string;
  hint?: string;
  children: React.ReactNode;
}

function Section({ title, hint, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

interface SegmentProps<T extends string> {
  options: Array<{ key: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}

function Segment<T extends string>({ options, value, onChange }: SegmentProps<T>) {
  return (
    <View style={styles.segment}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={[styles.segmentBtn, active && styles.segmentBtnActive]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const TEMP_MIN = 16;
const TEMP_MAX = 30;

interface TempSliderProps {
  value: number;
  onChange: (v: number) => void;
}

import { useRef, useState } from 'react';

function TempSlider({ value, onChange }: TempSliderProps) {
  const trackRef = useRef<View | null>(null);
  const [width, setWidth] = useState(0);

  const updateFromX = useCallback(
    (x: number) => {
      if (width <= 0) return;
      const ratio = Math.min(1, Math.max(0, x / width));
      const next = Math.round(TEMP_MIN + ratio * (TEMP_MAX - TEMP_MIN));
      onChange(next);
    },
    [width, onChange],
  );

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const onTouch = (e: GestureResponderEvent) =>
    updateFromX(e.nativeEvent.locationX);

  const ratio = (value - TEMP_MIN) / (TEMP_MAX - TEMP_MIN);

  return (
    <View
      ref={trackRef}
      onLayout={onLayout}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={onTouch}
      onResponderMove={onTouch}
      style={styles.sliderTrack}
    >
      <View style={[styles.sliderFill, { width: `${ratio * 100}%` }]} />
      <View style={[styles.sliderKnob, { left: `${ratio * 100}%` }]} />
      <View style={styles.sliderEndpoints}>
        <Text style={styles.sliderEnd}>{TEMP_MIN}°</Text>
        <Text style={styles.sliderEnd}>{TEMP_MAX}°</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 22, paddingTop: 4, gap: 22 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sectionTitle: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    color: Luxe.gold,
    textTransform: 'uppercase',
  },
  sectionHint: {
    fontFamily: LuxeFonts.serif,
    fontSize: 20,
    color: Luxe.ivory,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: LuxeRadii.md,
    backgroundColor: Luxe.softBlack,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Luxe.hairlineStrong,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: LuxeRadii.sm,
    alignItems: 'center',
  },
  segmentBtnActive: { backgroundColor: Luxe.ink, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(212,168,87,0.5)' },
  segmentText: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 12.5,
    color: Luxe.titanium,
    letterSpacing: 0.4,
  },
  segmentTextActive: { color: Luxe.goldBright },
  sliderTrack: {
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,240,210,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Luxe.hairlineStrong,
    justifyContent: 'center',
    paddingHorizontal: 4,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(212,168,87,0.22)',
    borderRadius: 14,
  },
  sliderKnob: {
    position: 'absolute',
    top: 2,
    width: 32,
    height: 32,
    marginLeft: -16,
    borderRadius: 16,
    backgroundColor: Luxe.goldBright,
    borderWidth: 2,
    borderColor: Luxe.obsidian,
  },
  sliderEndpoints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  sliderEnd: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.muted,
    letterSpacing: 1,
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: Luxe.softBlack,
  },
  chipActive: {
    borderColor: 'rgba(212,168,87,0.5)',
    backgroundColor: 'rgba(212,168,87,0.12)',
  },
  chipText: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 12,
    color: Luxe.ivoryDim,
    letterSpacing: 0.4,
  },
  chipTextActive: { color: Luxe.goldBright },
  notesInput: {
    minHeight: 84,
    borderRadius: LuxeRadii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: Luxe.softBlack,
    padding: 14,
    fontFamily: LuxeFonts.sans,
    fontSize: 13.5,
    color: Luxe.ivory,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: LuxeRadii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: Luxe.softBlack,
  },
  toggleLabel: { fontFamily: LuxeFonts.sansMedium, fontSize: 13.5, color: Luxe.ivory },
  toggleHint: { fontFamily: LuxeFonts.sansLight, fontSize: 11.5, color: Luxe.muted, marginTop: 2 },
  switch: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,240,210,0.10)',
    padding: 3,
    justifyContent: 'center',
  },
  switchOn: { backgroundColor: 'rgba(212,168,87,0.55)' },
  switchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Luxe.ivoryDim,
  },
  switchKnobOn: {
    backgroundColor: Luxe.goldBright,
    alignSelf: 'flex-end',
  },
  primaryBtn: {
    height: 54,
    borderRadius: LuxeRadii.md,
    backgroundColor: Luxe.goldBright,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryBtnText: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 13,
    color: Luxe.obsidian,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
