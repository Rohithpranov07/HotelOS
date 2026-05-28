import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';

const PAST_STAYS = [
  { property: 'Hôtel Octave · Mumbai', dates: 'Apr 12 → Apr 14', nights: 2, spend: 38400 },
  { property: 'Hôtel Octave · Kyoto', dates: 'Jan 06 → Jan 10', nights: 4, spend: 96200 },
  { property: 'Hôtel Octave · Bengaluru', dates: 'Nov 22 → Nov 23', nights: 1, spend: 14800 },
  { property: 'Hôtel Octave · Chennai', dates: 'Aug 03 → Aug 05', nights: 2, spend: 28200 },
  { property: 'Hôtel Octave · Delhi', dates: 'May 18 → May 20', nights: 2, spend: 31700 },
];

const PREFERENCES = [
  { icon: 'leaf-outline', label: 'Vegetarian' },
  { icon: 'thermometer-outline', label: '22°C' },
  { icon: 'bed-outline', label: 'Firm pillow' },
  { icon: 'newspaper-outline', label: 'Times of India' },
  { icon: 'business-outline', label: 'High floor' },
] as const;

export default function AccountScreen() {
  useLuxeFonts();
  const router = useRouter();
  const guest = useAuthStore((s) => s.guest);
  const logout = useAuthStore((s) => s.logout);
  const [showLogout, setShowLogout] = useState(false);

  const confirmLogout = () => {
    setShowLogout(false);
    void logout();
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>Account</Text>
          <Text style={styles.title}>{guest?.fullName || 'Guest'}</Text>
          <Text style={styles.subhead}>{guest?.phone || ''}</Text>

          <Section label="Profile">
            <Row label="Name" value={guest?.fullName ?? '—'} />
            <Row label="Phone" value={guest?.phone ?? '—'} />
            <Row label="Email" value={guest?.email ?? 'Add an email'} subtle={!guest?.email} />
            <Row label="Language" value="English (India)" />
          </Section>

          <Section label="Loyalty">
            <Pressable onPress={() => router.push('/(app)/loyalty')} style={styles.cardRow}>
              <View style={styles.tierMark}>
                <Ionicons name="trophy" size={16} color={Luxe.goldBright} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{guest?.loyaltyTier ?? 'BRONZE'} member</Text>
                <Text style={styles.cardMeta}>
                  {(guest?.loyaltyPoints ?? 0).toLocaleString('en-IN')} points
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Luxe.titanium} />
            </Pressable>
          </Section>

          <Section label="Preferences">
            <View style={styles.chipRow}>
              {PREFERENCES.map((p) => (
                <View key={p.label} style={styles.chip}>
                  <Ionicons name={p.icon} size={12} color={Luxe.goldBright} />
                  <Text style={styles.chipText}>{p.label}</Text>
                </View>
              ))}
            </View>
          </Section>

          <Section label="Payment methods">
            <View style={styles.cardRow}>
              <Ionicons name="card-outline" size={20} color={Luxe.ivory} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>HDFC •••• 4248</Text>
                <Text style={styles.cardMeta}>Default · Expires 04/29</Text>
              </View>
            </View>
            <View style={[styles.cardRow, { marginTop: 8 }]}>
              <Ionicons name="phone-portrait-outline" size={20} color={Luxe.ivory} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>rohith@upi</Text>
                <Text style={styles.cardMeta}>UPI · Verified</Text>
              </View>
            </View>
          </Section>

          <Section label="Past stays">
            {PAST_STAYS.map((s, i) => (
              <View key={s.property} style={[styles.stayRow, i === 0 && styles.stayFirst]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stayTitle}>{s.property}</Text>
                  <Text style={styles.stayMeta}>
                    {s.dates} · {s.nights} {s.nights === 1 ? 'night' : 'nights'}
                  </Text>
                </View>
                <Text style={styles.staySpend}>₹{s.spend.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </Section>

          <Section label="Help & support">
            <Pressable style={styles.cardRow} onPress={() => router.push('/(app)/concierge')}>
              <Ionicons name="help-circle-outline" size={20} color={Luxe.ivory} />
              <Text style={[styles.cardTitle, { flex: 1 }]}>Talk to the concierge</Text>
              <Ionicons name="chevron-forward" size={18} color={Luxe.titanium} />
            </Pressable>
            <View style={[styles.cardRow, { marginTop: 8 }]}>
              <Ionicons name="document-text-outline" size={20} color={Luxe.ivory} />
              <Text style={[styles.cardTitle, { flex: 1 }]}>FAQ</Text>
              <Ionicons name="open-outline" size={16} color={Luxe.titanium} />
            </View>
          </Section>

          <Pressable onPress={() => setShowLogout(true)} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={16} color={Luxe.ivoryDim} />
            <Text style={styles.logoutText}>Sign out</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      <Modal visible={showLogout} transparent animationType="fade" onRequestClose={() => setShowLogout(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Sign out?</Text>
            <Text style={styles.modalBody}>
              You'll need your phone number to sign back in.
            </Text>
            <View style={styles.modalRow}>
              <Pressable onPress={() => setShowLogout(false)} style={styles.modalSecondary}>
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={confirmLogout} style={styles.modalPrimary}>
                <Text style={styles.modalPrimaryText}>Sign out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, subtle }: { label: string; value: string; subtle?: boolean }) {
  return (
    <View style={styles.rowItem}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, subtle && { color: Luxe.muted }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 140 },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2.4,
    color: Luxe.gold,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontFamily: LuxeFonts.serif,
    fontSize: 38,
    lineHeight: 42,
    color: Luxe.ivory,
    letterSpacing: -1.2,
  },
  subhead: {
    marginTop: 6,
    fontFamily: LuxeFonts.mono,
    fontSize: 11.5,
    letterSpacing: 1.2,
    color: Luxe.titanium,
  },
  section: { marginTop: 28 },
  sectionLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    color: Luxe.gold,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Luxe.hairlineStrong,
  },
  rowLabel: { fontFamily: LuxeFonts.mono, fontSize: 11, color: Luxe.titanium, letterSpacing: 1.2 },
  rowValue: { fontFamily: LuxeFonts.sans, fontSize: 14, color: Luxe.ivory },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#0C0A08',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.16)',
  },
  cardTitle: { fontFamily: LuxeFonts.sansMedium, fontSize: 14, color: Luxe.ivory },
  cardMeta: {
    marginTop: 3,
    fontFamily: LuxeFonts.mono,
    fontSize: 10.5,
    letterSpacing: 1.1,
    color: Luxe.titanium,
  },
  tierMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,201,126,0.30)',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(244,201,126,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,201,126,0.20)',
  },
  chipText: { fontFamily: LuxeFonts.mono, fontSize: 11, color: Luxe.ivoryDim },
  stayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Luxe.hairlineStrong,
  },
  stayFirst: { borderTopWidth: 0 },
  stayTitle: { fontFamily: LuxeFonts.sansMedium, fontSize: 14, color: Luxe.ivory },
  stayMeta: {
    marginTop: 3,
    fontFamily: LuxeFonts.mono,
    fontSize: 10.5,
    letterSpacing: 1.1,
    color: Luxe.titanium,
  },
  staySpend: { fontFamily: LuxeFonts.serif, fontSize: 16, color: Luxe.amberGlow },
  logoutBtn: {
    marginTop: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Luxe.hairlineStrong,
  },
  logoutText: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 13,
    color: Luxe.ivoryDim,
    letterSpacing: 0.4,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    padding: 22,
    borderRadius: 22,
    backgroundColor: Luxe.surfaceTop,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.18)',
  },
  modalTitle: {
    fontFamily: LuxeFonts.serif,
    fontSize: 24,
    color: Luxe.ivory,
    letterSpacing: -0.6,
  },
  modalBody: {
    marginTop: 8,
    fontFamily: LuxeFonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: Luxe.ivoryDim,
  },
  modalRow: { marginTop: 22, flexDirection: 'row', gap: 8 },
  modalSecondary: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Luxe.hairlineStrong,
  },
  modalSecondaryText: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 12,
    color: Luxe.ivoryDim,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  modalPrimary: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Luxe.goldBright,
  },
  modalPrimaryText: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 12,
    color: '#1A1410',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
