import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';
import { useReservationStore } from '../../src/stores/reservation.store';
import {
  useComplaintsStore,
  type Complaint,
  type ComplaintCategory,
  type ComplaintContact,
  type ComplaintPriority,
  type ComplaintStatus,
} from '../../src/stores/complaints.store';

type IconName = keyof typeof Ionicons.glyphMap;

const CORAL = '#E27A6E';

const CATEGORIES: { id: ComplaintCategory; label: string; icon: IconName }[] = [
  { id: 'room', label: 'Room', icon: 'bed-outline' },
  { id: 'cleanliness', label: 'Cleanliness', icon: 'sparkles-outline' },
  { id: 'noise', label: 'Noise', icon: 'volume-high-outline' },
  { id: 'maintenance', label: 'Maintenance', icon: 'construct-outline' },
  { id: 'climate', label: 'AC / Heating', icon: 'thermometer-outline' },
  { id: 'food', label: 'Food & Bev', icon: 'restaurant-outline' },
  { id: 'staff', label: 'Staff', icon: 'people-outline' },
  { id: 'billing', label: 'Billing', icon: 'card-outline' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

const PRIORITIES: { id: ComplaintPriority; label: string; hint: string }[] = [
  { id: 'low', label: 'Low', hint: 'Whenever convenient' },
  { id: 'normal', label: 'Normal', hint: 'Within a few hours' },
  { id: 'high', label: 'High', hint: 'As soon as possible' },
  { id: 'urgent', label: 'Urgent', hint: 'Needs attention now' },
];

const CONTACTS: { id: ComplaintContact; label: string; icon: IconName }[] = [
  { id: 'app', label: 'In app', icon: 'chatbubble-ellipses-outline' },
  { id: 'phone', label: 'Call me', icon: 'call-outline' },
  { id: 'in_person', label: 'In person', icon: 'walk-outline' },
];

const STATUS_STEPS: { key: ComplaintStatus; label: string }[] = [
  { key: 'open', label: 'Raised' },
  { key: 'acknowledged', label: 'Seen' },
  { key: 'in_progress', label: 'Fixing' },
  { key: 'resolved', label: 'Resolved' },
];

const CATEGORY_LABEL: Record<ComplaintCategory, string> = CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.id]: c.label }),
  {} as Record<ComplaintCategory, string>,
);

function priorityColor(p: ComplaintPriority): string {
  if (p === 'urgent') return '#E2685B';
  if (p === 'high') return Luxe.goldBright;
  return Luxe.gold;
}

export default function ComplaintsScreen() {
  void useLuxeFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const reservation = useReservationStore((s) => s.reservation);
  const complaints = useComplaintsStore((s) => s.complaints);
  const submit = useComplaintsStore((s) => s.submit);
  const submitting = useComplaintsStore((s) => s.submitting);
  const fetch = useComplaintsStore((s) => s.fetch);

  const suite = reservation?.room?.roomNumber ?? '1604';

  const [category, setCategory] = useState<ComplaintCategory | null>(null);
  const [priority, setPriority] = useState<ComplaintPriority>('normal');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(`Suite ${suite}`);
  const [contact, setContact] = useState<ComplaintContact>('app');
  const [toast, setToast] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (reservation?.id) void fetch(reservation.id);
    }, [reservation?.id, fetch]),
  );

  const canSubmit = useMemo(
    () => !!category && description.trim().length >= 5 && !submitting,
    [category, description, submitting],
  );

  const onSubmit = async () => {
    if (!category) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const created = await submit(reservation?.id ?? 'demo-reservation', {
      category,
      priority,
      subject: subject.trim() || CATEGORY_LABEL[category],
      description: description.trim(),
      location: location.trim() || `Suite ${suite}`,
      contact,
    });
    setToast(`Logged as ${created.reference} — our team is on it.`);
    setCategory(null);
    setPriority('normal');
    setSubject('');
    setDescription('');
    setContact('app');
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ───────── HERO ───────── */}
        <View style={[styles.hero, { paddingTop: insets.top + 14 }]}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Luxe.obsidian }]} />
          <LinearGradient
            colors={['rgba(226,122,110,0.22)', 'rgba(226,122,110,0.05)', 'transparent']}
            locations={[0, 0.45, 0.78]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.3, y: 0.72 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.glassPill} hitSlop={8}>
              <Ionicons name="chevron-back" size={16} color={Luxe.ivory} />
            </Pressable>
            <View style={styles.suiteChip}>
              <Ionicons name="shield-checkmark-outline" size={12} color={CORAL} />
              <Text style={styles.suiteChipText}>Confidential</Text>
            </View>
          </View>

          <View style={styles.heroTitleBlock}>
            <Text style={styles.heroKicker}>Guest relations · Report an issue</Text>
            <Text style={styles.heroTitle}>
              Let&apos;s make it <Text style={styles.heroTitleItalic}>right.</Text>
            </Text>
            <Text style={styles.heroSub}>
              Tell us what went wrong and our duty manager will take it from here —
              tracked end to end, with no charge for putting things right.
            </Text>
          </View>
        </View>

        {/* ───────── EXISTING ISSUES ───────── */}
        {complaints.length > 0 && (
          <View style={styles.openWrap}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionKicker}>Your reports</Text>
              <Text style={styles.sectionHint}>{complaints.length} total</Text>
            </View>
            {complaints.map((c) => (
              <ComplaintCard key={c.id} complaint={c} />
            ))}
          </View>
        )}

        {/* ───────── CATEGORY ───────── */}
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>What&apos;s the issue about?</Text>
        </View>
        <View style={styles.grid}>
          {CATEGORIES.map((c) => {
            const active = category === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setCategory(c.id);
                }}
                style={[styles.catTile, active && styles.catTileActive]}
              >
                <Ionicons
                  name={c.icon}
                  size={20}
                  color={active ? CORAL : Luxe.ivoryDim}
                />
                <Text style={[styles.catLabel, active && { color: Luxe.ivory }]}>
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ───────── PRIORITY ───────── */}
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>How urgent is it?</Text>
        </View>
        <View style={styles.priorityRow}>
          {PRIORITIES.map((p) => {
            const active = priority === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setPriority(p.id);
                }}
                style={[
                  styles.priorityChip,
                  active && { borderColor: priorityColor(p.id), backgroundColor: `${priorityColor(p.id)}1A` },
                ]}
              >
                <Text style={[styles.priorityLabel, active && { color: priorityColor(p.id) }]}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.priorityHint}>
          {PRIORITIES.find((p) => p.id === priority)?.hint}
        </Text>

        {/* ───────── DETAILS ───────── */}
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>Tell us more</Text>
        </View>
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Subject</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder={category ? CATEGORY_LABEL[category] : 'A short title'}
            placeholderTextColor={Luxe.muted}
            style={styles.input}
            maxLength={80}
          />

          <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What happened? Include anything that helps us fix it quickly."
            placeholderTextColor={Luxe.muted}
            style={[styles.input, styles.inputMultiline]}
            multiline
            maxLength={1000}
          />

          <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Where</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder={`Suite ${suite}`}
            placeholderTextColor={Luxe.muted}
            style={styles.input}
            maxLength={60}
          />
        </View>

        {/* ───────── CONTACT ───────── */}
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>How should we reach you?</Text>
        </View>
        <View style={styles.contactRow}>
          {CONTACTS.map((c) => {
            const active = contact === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setContact(c.id);
                }}
                style={[styles.contactChip, active && styles.contactChipActive]}
              >
                <Ionicons name={c.icon} size={16} color={active ? CORAL : Luxe.ivoryDim} />
                <Text style={[styles.contactLabel, active && { color: Luxe.ivory }]}>
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ───────── REASSURANCE ───────── */}
        <View style={styles.reassure}>
          <Ionicons name="lock-closed-outline" size={15} color={CORAL} />
          <Text style={styles.reassureText}>
            Reports go straight to the duty manager and are kept confidential to the
            guest relations team.
          </Text>
        </View>

        {/* ───────── SUBMIT ───────── */}
        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          style={[styles.submit, !canSubmit && { opacity: 0.4 }]}
        >
          <LinearGradient
            colors={['#E89A8E', '#C25A4C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.submitText}>
            {submitting ? 'Sending…' : 'Submit report'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* DOCK FADE */}
      <LinearGradient
        colors={['transparent', 'rgba(8,7,10,0.85)', Luxe.obsidian]}
        locations={[0, 0.5, 0.85]}
        pointerEvents="none"
        style={styles.dockFade}
      />

      {/* TOAST */}
      {toast && (
        <View style={[styles.toast, { bottom: insets.bottom + 30 }]} pointerEvents="none">
          <Ionicons name="checkmark-circle" size={16} color={CORAL} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

function ComplaintCard({ complaint }: { complaint: Complaint }) {
  const idx = STATUS_STEPS.findIndex((s) => s.key === complaint.status);
  const activeIdx = idx === -1 ? 0 : idx;
  const resolved = complaint.status === 'resolved';
  const when = new Date(complaint.created_at);
  const timeLabel = `${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`;

  return (
    <View style={styles.complaintCard}>
      <View style={styles.complaintHead}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.complaintRef}>
            {complaint.reference} · {CATEGORY_LABEL[complaint.category]}
          </Text>
          <Text style={styles.complaintSubject} numberOfLines={1}>
            {complaint.subject}
          </Text>
        </View>
        <View
          style={[
            styles.statusPill,
            resolved
              ? { borderColor: 'rgba(168,208,141,0.5)', backgroundColor: 'rgba(168,208,141,0.10)' }
              : { borderColor: 'rgba(226,122,110,0.5)', backgroundColor: 'rgba(226,122,110,0.10)' },
          ]}
        >
          <Text style={[styles.statusText, { color: resolved ? '#A8D08D' : CORAL }]}>
            {complaint.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.complaintDesc} numberOfLines={2}>
        {complaint.description}
      </Text>

      {/* status track */}
      <View style={styles.track}>
        {STATUS_STEPS.map((s, i) => {
          const done = i <= activeIdx;
          const isLast = i === STATUS_STEPS.length - 1;
          return (
            <View key={s.key} style={styles.stepCell}>
              <View style={styles.stepDotRow}>
                <View style={[styles.stepDot, done && styles.stepDotOn]} />
                {!isLast && <View style={[styles.stepLine, i < activeIdx && styles.stepLineOn]} />}
              </View>
              <Text style={[styles.stepLabel, done && styles.stepLabelOn]} numberOfLines={1}>
                {s.label}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.complaintFoot}>
        <Text style={styles.complaintMeta}>
          {complaint.assigned_to ? `Handled by ${complaint.assigned_to}` : 'Awaiting assignment'}
        </Text>
        <Text style={styles.complaintMeta}>{complaint.location} · {timeLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },

  // HERO
  hero: { overflow: 'hidden', paddingBottom: 24 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  glassPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(20,18,15,0.55)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suiteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: 'rgba(20,18,15,0.55)',
    borderWidth: 0.5,
    borderColor: 'rgba(226,122,110,0.3)',
  },
  suiteChipText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.ivoryDim,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitleBlock: { paddingHorizontal: 24, marginTop: 28 },
  heroKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: CORAL,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  heroTitle: {
    fontFamily: LuxeFonts.serif,
    fontSize: 44,
    lineHeight: 46,
    color: Luxe.ivory,
    letterSpacing: -1,
  },
  heroTitleItalic: { fontFamily: LuxeFonts.serifItalic, color: CORAL },
  heroSub: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 13.5,
    lineHeight: 20,
    color: Luxe.ivoryDim,
    marginTop: 14,
    maxWidth: 340,
  },

  // SECTIONS
  section: { paddingHorizontal: 24, marginTop: 32, marginBottom: 14 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  sectionKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sectionHint: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // EXISTING ISSUES
  openWrap: { marginTop: 24, gap: 12 },
  complaintCard: {
    marginHorizontal: 24,
    padding: 18,
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: 'rgba(226,122,110,0.22)',
    backgroundColor: '#191210',
    gap: 14,
  },
  complaintHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  complaintRef: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.gold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  complaintSubject: {
    fontFamily: LuxeFonts.serif,
    fontSize: 18,
    color: Luxe.ivory,
    letterSpacing: -0.3,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 0.5,
  },
  statusText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8.5,
    letterSpacing: 1.2,
  },
  complaintDesc: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 12.5,
    lineHeight: 18,
    color: Luxe.ivoryDim,
  },
  track: { flexDirection: 'row' },
  stepCell: { flex: 1 },
  stepDotRow: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: 'rgba(255,240,210,0.14)',
  },
  stepDotOn: {
    backgroundColor: CORAL,
    shadowColor: CORAL,
    shadowOpacity: 0.7,
    shadowRadius: 5,
  },
  stepLine: { flex: 1, height: 1.5, marginHorizontal: 4, backgroundColor: 'rgba(255,240,210,0.12)' },
  stepLineOn: { backgroundColor: 'rgba(226,122,110,0.45)' },
  stepLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8,
    color: Luxe.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 7,
  },
  stepLabelOn: { color: Luxe.ivoryDim },
  complaintFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,240,210,0.07)',
  },
  complaintMeta: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8.5,
    color: Luxe.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // CATEGORY GRID
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    rowGap: 12,
  },
  catTile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: '#161310',
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
  },
  catTileActive: {
    borderColor: 'rgba(226,122,110,0.55)',
    backgroundColor: 'rgba(226,122,110,0.10)',
  },
  catLabel: {
    fontFamily: LuxeFonts.sans,
    fontSize: 11.5,
    color: Luxe.ivoryDim,
    textAlign: 'center',
    paddingHorizontal: 4,
  },

  // PRIORITY
  priorityRow: {
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 24,
  },
  priorityChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: 'rgba(20,18,15,0.6)',
  },
  priorityLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 11,
    color: Luxe.ivoryDim,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  priorityHint: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 12,
    color: Luxe.titanium,
    paddingHorizontal: 24,
    marginTop: 12,
  },

  // FORM
  formCard: {
    marginHorizontal: 24,
    padding: 18,
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: 'rgba(21,19,15,0.55)',
  },
  fieldLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.muted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  input: {
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: Luxe.surfaceBottom,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: LuxeFonts.sans,
    fontSize: 14,
    color: Luxe.ivory,
  },
  inputMultiline: {
    minHeight: 96,
    paddingTop: 13,
    textAlignVertical: 'top',
    lineHeight: 20,
  },

  // CONTACT
  contactRow: { flexDirection: 'row', gap: 9, paddingHorizontal: 24 },
  contactChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: 'rgba(20,18,15,0.6)',
  },
  contactChipActive: {
    borderColor: 'rgba(226,122,110,0.55)',
    backgroundColor: 'rgba(226,122,110,0.10)',
  },
  contactLabel: {
    fontFamily: LuxeFonts.sans,
    fontSize: 12.5,
    color: Luxe.ivoryDim,
  },

  // REASSURE
  reassure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 24,
    marginTop: 28,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(226,122,110,0.28)',
    backgroundColor: 'rgba(226,122,110,0.06)',
  },
  reassureText: {
    flex: 1,
    fontFamily: LuxeFonts.sansLight,
    fontSize: 12,
    lineHeight: 17,
    color: Luxe.ivoryDim,
  },

  // SUBMIT
  submit: {
    marginHorizontal: 24,
    marginTop: 22,
    height: 56,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 14,
    color: '#1A1206',
    letterSpacing: 0.4,
  },

  // TOAST
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(18,16,12,0.96)',
    borderWidth: 0.5,
    borderColor: 'rgba(226,122,110,0.4)',
  },
  toastText: { flex: 1, fontFamily: LuxeFonts.sans, fontSize: 13, color: Luxe.ivory },

  dockFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 150, pointerEvents: 'none' },
});
