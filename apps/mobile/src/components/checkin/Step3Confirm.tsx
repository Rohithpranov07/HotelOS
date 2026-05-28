import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Luxe, LuxeFonts, LuxeRadii } from '../../theme/luxe';
import { useCheckinStore } from '../../stores/checkin.store';
import type { Reservation } from '../../stores/reservation.store';

interface Step3Props {
  reservation: Reservation;
  onSubmit: () => void;
}

export function Step3Confirm({ reservation, onSubmit }: Step3Props) {
  const id = useCheckinStore((s) => s.id);
  const prefs = useCheckinStore((s) => s.preferences);
  const isSubmitting = useCheckinStore((s) => s.isSubmitting);
  const error = useCheckinStore((s) => s.error);

  const dates = formatDates(reservation.checkInDate, reservation.checkOutDate);

  return (
    <View style={styles.body}>
      <View style={styles.card}>
        <Text style={styles.cardKicker}>Stay summary</Text>
        <View style={styles.row}>
          <Ionicons name="key-outline" size={16} color={Luxe.goldBright} />
          <Text style={styles.rowText}>
            Suite {reservation.room?.roomNumber ?? 'TBA'}
            <Text style={styles.rowMeta}>
              {reservation.room?.roomType ? `  ·  ${reservation.room.roomType}` : ''}
            </Text>
          </Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={16} color={Luxe.goldBright} />
          <Text style={styles.rowText}>{dates}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="person-outline" size={16} color={Luxe.goldBright} />
          <Text style={styles.rowText}>
            {reservation.adults} adult{reservation.adults === 1 ? '' : 's'}
            {reservation.children ? ` · ${reservation.children} children` : ''}
          </Text>
        </View>
      </View>

      {id ? (
        <View style={styles.card}>
          <Text style={styles.cardKicker}>Identity</Text>
          <Text style={styles.identityName}>{id.full_name}</Text>
          <Text style={styles.identityMeta}>
            {idLabel(id.documentType)} · verified
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardKicker}>Preferences</Text>
        <PrefLine label="Temperature" value={`${prefs.roomTempCelsius}°C`} />
        <PrefLine label="Pillow" value={titleCase(prefs.pillowType)} />
        <PrefLine
          label="Floor"
          value={prefs.floorPreference === 'none' ? 'No preference' : titleCase(prefs.floorPreference)}
        />
        {prefs.dietary.length ? (
          <PrefLine label="Dietary" value={prefs.dietary.join(', ')} />
        ) : null}
        {prefs.earlyCheckinRequest ? (
          <PrefLine label="Arrival" value="Early check-in requested" />
        ) : null}
        {prefs.specialNotes ? (
          <PrefLine label="Note" value={prefs.specialNotes} multiline />
        ) : null}
      </View>

      {error ? <Text style={styles.errorLine}>{error}</Text> : null}

      <Pressable
        onPress={onSubmit}
        disabled={isSubmitting}
        style={[styles.primaryBtn, isSubmitting && { opacity: 0.4 }]}
      >
        {isSubmitting ? (
          <ActivityIndicator color={Luxe.obsidian} />
        ) : (
          <Text style={styles.primaryBtnText}>Complete check-in</Text>
        )}
      </Pressable>
      <Text style={styles.fineprint}>
        By completing, you agree to the suite&apos;s house rules and arrival policy.
      </Text>
    </View>
  );
}

function PrefLine({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <View style={[styles.prefRow, multiline && { alignItems: 'flex-start' }]}>
      <Text style={styles.prefLabel}>{label}</Text>
      <Text style={[styles.prefValue, multiline && { flex: 1, textAlign: 'right' }]} numberOfLines={multiline ? 3 : 1}>
        {value}
      </Text>
    </View>
  );
}

function idLabel(t: string): string {
  if (t === 'passport') return 'Passport';
  if (t === 'aadhaar') return 'Aadhaar';
  return 'Driving Licence';
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDates(checkIn: string, checkOut: string): string {
  const fmt = (s: string) =>
    new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${fmt(checkIn)} → ${fmt(checkOut)}`;
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 22, paddingTop: 4, gap: 14 },
  card: {
    borderRadius: LuxeRadii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: Luxe.softBlack,
    padding: 18,
    gap: 10,
  },
  cardKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    color: Luxe.gold,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowText: { fontFamily: LuxeFonts.sansMedium, fontSize: 14, color: Luxe.ivory },
  rowMeta: { fontFamily: LuxeFonts.sansLight, color: Luxe.ivoryDim, fontSize: 13 },
  identityName: { fontFamily: LuxeFonts.serif, fontSize: 22, color: Luxe.ivory },
  identityMeta: { fontFamily: LuxeFonts.sansLight, fontSize: 12.5, color: Luxe.ivoryDim },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  prefLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10.5,
    color: Luxe.muted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  prefValue: { fontFamily: LuxeFonts.sans, fontSize: 13.5, color: Luxe.ivory },
  primaryBtn: {
    marginTop: 8,
    height: 54,
    borderRadius: LuxeRadii.md,
    backgroundColor: Luxe.goldBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 13,
    color: Luxe.obsidian,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  fineprint: {
    marginTop: 4,
    fontFamily: LuxeFonts.sansLight,
    fontSize: 11.5,
    color: Luxe.muted,
    textAlign: 'center',
  },
  errorLine: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 12,
    color: '#E08B8B',
    textAlign: 'center',
  },
});
