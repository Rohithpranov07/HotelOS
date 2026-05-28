import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';
import {
  useReservationStore,
  type FolioLineItem,
  type FolioResponse,
  type Reservation,
} from '../../src/stores/reservation.store';
import { useAuthStore } from '../../src/stores/auth.store';
import { usePaymentsStore, type PayMethod } from '../../src/stores/payments.store';

type IconName = keyof typeof Ionicons.glyphMap;

const FOLIO_POLL_MS = 60_000;
const LOYALTY_EARN_PER_100 = 10; // points per ₹100 spent (PRD loyalty earn rate)
const POINT_VALUE = 0.25; // ₹ per loyalty point, for redemption display

const GROUP_ORDER: FolioLineItem['type'][] = ['room', 'food', 'laundry', 'amenity', 'other'];

const GROUP_META: Record<FolioLineItem['type'], { label: string; icon: IconName }> = {
  room: { label: 'Suite & stay', icon: 'bed-outline' },
  food: { label: 'Dining', icon: 'restaurant-outline' },
  laundry: { label: 'Laundry & valet', icon: 'shirt-outline' },
  amenity: { label: 'Amenities', icon: 'sparkles-outline' },
  other: { label: 'Other', icon: 'ellipsis-horizontal' },
};

const PAY_METHODS: { id: PayMethod; label: string; sub: string; icon: IconName }[] = [
  { id: 'razorpay', label: 'Card', sub: 'Visa, Mastercard, Amex', icon: 'card-outline' },
  { id: 'upi', label: 'UPI', sub: 'GPay, PhonePe, any UPI app', icon: 'qr-code-outline' },
  { id: 'loyalty_points', label: 'Loyalty points', sub: 'Redeem from The Society', icon: 'diamond-outline' },
  { id: 'folio', label: 'Charge to suite', sub: 'Settle at checkout', icon: 'document-text-outline' },
];

export default function FolioScreen() {
  void useLuxeFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const reservation = useReservationStore((s) => s.reservation);
  const apiFolio = useReservationStore((s) => s.folio);
  const fetchActiveReservation = useReservationStore((s) => s.fetchActiveReservation);
  const fetchFolio = useReservationStore((s) => s.fetchFolio);
  const guest = useAuthStore((s) => s.guest);

  const pay = usePaymentsStore((s) => s.pay);
  const processing = usePaymentsStore((s) => s.processing);
  const fetchInvoice = usePaymentsStore((s) => s.fetchInvoice);
  const invoiceLoading = usePaymentsStore((s) => s.invoiceLoading);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [method, setMethod] = useState<PayMethod>('razorpay');
  const [toast, setToast] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchActiveReservation();
    }, [fetchActiveReservation]),
  );

  useEffect(() => {
    if (!reservation?.id) return;
    fetchFolio(reservation.id);
    const t = setInterval(() => fetchFolio(reservation.id), FOLIO_POLL_MS);
    return () => clearInterval(t);
  }, [reservation?.id, fetchFolio]);

  const guestName = guest?.fullName ?? 'Guest';
  const guestPoints = guest?.loyaltyPoints ?? 0;

  // Fall back to a representative demo folio when the backend has none, so the
  // screen is always populated for testing — mirrors services/housekeeping.
  const folio: FolioResponse = useMemo(
    () => apiFolio ?? buildDemoFolio(reservation, guestName),
    [apiFolio, reservation, guestName],
  );

  const grouped = useMemo(() => {
    const map = new Map<FolioLineItem['type'], FolioLineItem[]>();
    for (const item of folio.line_items) {
      const arr = map.get(item.type) ?? [];
      arr.push(item);
      map.set(item.type, arr);
    }
    return map;
  }, [folio]);

  const balance = folio.balance_due;
  const settled = balance <= 0;
  const pointsToEarn = Math.floor(folio.total_amount / 100) * LOYALTY_EARN_PER_100;
  const nights = reservation ? nightCount(reservation.checkInDate, reservation.checkOutDate) : 3;

  const openSheet = () => {
    if (settled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSheetOpen(true);
  };

  const confirmPay = async () => {
    if (!reservation && !apiFolio) {
      // Demo flow — no real reservation id; use the folio's reservation id.
    }
    const reservationId = reservation?.id ?? folio.reservation_id;
    const receipt = await pay({ reservationId, amount: balance, method });
    setSheetOpen(false);
    if (receipt) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToast(`Settled ${formatCurrency(receipt.amountPaid)} · ${methodLabel(receipt.method)}`);
      setTimeout(() => setToast(null), 3600);
    }
  };

  const onDownloadInvoice = async () => {
    Haptics.selectionAsync();
    const reservationId = reservation?.id ?? folio.reservation_id;
    const url = await fetchInvoice(reservationId);
    if (url) {
      Linking.openURL(url).catch(() => setToast('Could not open the invoice.'));
    } else {
      setToast('Your invoice will be emailed after checkout.');
      setTimeout(() => setToast(null), 3600);
    }
  };

  const pointsShort = method === 'loyalty_points' && guestPoints * POINT_VALUE < balance;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: settled ? 200 : 260 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* ───────── HERO ───────── */}
        <View style={[styles.hero, { paddingTop: insets.top + 14 }]}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Luxe.obsidian }]} />
          <LinearGradient
            colors={['rgba(244,201,126,0.26)', 'rgba(244,201,126,0.06)', 'transparent']}
            locations={[0, 0.42, 0.74]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.3, y: 0.72 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.ringOuter} />
          <View style={styles.ringInner}>
            <LinearGradient
              colors={['rgba(244,201,126,0.20)', 'transparent']}
              start={{ x: 0.25, y: 0.25 }}
              end={{ x: 0.85, y: 0.85 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="receipt-outline" size={22} color={Luxe.goldBright} />
          </View>

          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.glassPill} hitSlop={8}>
              <Ionicons name="chevron-back" size={16} color={Luxe.ivory} />
            </Pressable>
            <View style={styles.suiteChip}>
              <View style={[styles.liveDot, settled && { backgroundColor: Luxe.titanium }]} />
              <Text style={styles.suiteChipText}>Suite {folio.room_number ?? '1604'}</Text>
            </View>
          </View>

          <View style={styles.heroTitleBlock}>
            <Text style={styles.heroKicker}>Folio · {nights} nights</Text>
            <Text style={styles.heroTitle}>
              Your stay, <Text style={styles.heroTitleItalic}>itemised.</Text>
            </Text>
            <Text style={styles.heroSub}>
              Every charge, gathered quietly to your suite — settle whenever you wish, or
              leave it to checkout.
            </Text>
          </View>
        </View>

        {/* ───────── BALANCE SUMMARY ───────── */}
        <View style={styles.balanceCard}>
          <LinearGradient
            colors={['#2A2316', '#1C1710']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 26 }]}
          />
          <LinearGradient
            colors={['rgba(244,201,126,0.16)', 'transparent']}
            locations={[0, 0.7]}
            start={{ x: 0.9, y: 0 }}
            end={{ x: 0.1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 26 }]}
          />
          <Text style={styles.balanceKicker}>{settled ? 'Settled in full' : 'Balance due'}</Text>
          <Text style={styles.balanceValue}>{formatCurrency(settled ? 0 : balance)}</Text>
          <View style={styles.balanceMetaRow}>
            <View style={styles.balanceMetaCell}>
              <Text style={styles.balanceMetaLabel}>Total</Text>
              <Text style={styles.balanceMetaValue}>{formatCurrency(folio.total_amount)}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceMetaCell}>
              <Text style={styles.balanceMetaLabel}>Paid</Text>
              <Text style={styles.balanceMetaValue}>{formatCurrency(folio.paid_amount)}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceMetaCell}>
              <Text style={styles.balanceMetaLabel}>Earns</Text>
              <Text style={[styles.balanceMetaValue, { color: Luxe.goldBright }]}>
                {pointsToEarn.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* ───────── ITEMISED GROUPS ───────── */}
        <Section kicker="The detail" title="Charged to your suite" hint={`${folio.line_items.length} items`} />
        <View style={styles.groups}>
          {GROUP_ORDER.map((type) => {
            const items = grouped.get(type);
            if (!items?.length) return null;
            const subtotal = items.reduce((a, b) => a + b.amount, 0);
            const meta = GROUP_META[type];
            return (
              <View key={type} style={styles.groupCard}>
                <LinearGradient
                  colors={['rgba(244,201,126,0.08)', 'transparent']}
                  locations={[0, 0.9]}
                  start={{ x: 0.9, y: 0 }}
                  end={{ x: 0.2, y: 1 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
                />
                <View style={styles.groupHead}>
                  <View style={styles.groupIcon}>
                    <Ionicons name={meta.icon} size={17} color={Luxe.goldBright} />
                  </View>
                  <Text style={styles.groupTitle}>{meta.label}</Text>
                  <Text style={styles.groupSubtotal}>{formatCurrency(subtotal)}</Text>
                </View>
                <View style={styles.lines}>
                  {items.map((item) => (
                    <View key={item.id} style={styles.lineRow}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.lineDesc} numberOfLines={1}>
                          {item.description}
                        </Text>
                        <Text style={styles.lineDate}>{formatDate(item.date)}</Text>
                      </View>
                      <Text style={styles.lineAmount}>{formatCurrency(item.amount)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        {/* ───────── INVOICE ───────── */}
        <Pressable
          onPress={onDownloadInvoice}
          disabled={invoiceLoading}
          style={[styles.invoiceRow, invoiceLoading && { opacity: 0.6 }]}
        >
          <View style={styles.invoiceIcon}>
            {invoiceLoading ? (
              <ActivityIndicator color={Luxe.goldBright} size="small" />
            ) : (
              <Ionicons name="download-outline" size={18} color={Luxe.goldBright} />
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.invoiceTitle}>Download invoice</Text>
            <Text style={styles.invoiceSub}>A branded PDF, itemised to the last rupee.</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Luxe.muted} />
        </Pressable>

        {/* ───────── FOOTNOTE ───────── */}
        <View style={styles.footnote}>
          <Text style={styles.footText}>{guestName}</Text>
          <Text style={styles.footText}>Hôtel Octave · Folio</Text>
        </View>
      </ScrollView>

      {/* DOCK FADE */}
      <LinearGradient
        colors={['transparent', 'rgba(8,7,10,0.85)', Luxe.obsidian]}
        locations={[0, 0.5, 0.85]}
        pointerEvents="none"
        style={styles.dockFade}
      />

      {/* SETTLE BAR */}
      {settled ? (
        <View style={[styles.settledBar, { bottom: insets.bottom + 98 }]} pointerEvents="none">
          <Ionicons name="checkmark-circle" size={18} color={Luxe.goldBright} />
          <Text style={styles.settledText}>Paid in full — thank you.</Text>
        </View>
      ) : (
        <View style={[styles.payWrap, { bottom: insets.bottom + 98 }]}>
          <View style={styles.payBar}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.payLabel}>Balance due</Text>
              <Text style={styles.payValue}>{formatCurrency(balance)}</Text>
            </View>
            <Pressable onPress={openSheet} style={styles.payCta}>
              <LinearGradient
                colors={['#F4C97E', '#D4A857', '#9A7A3F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.payCtaText}>SETTLE NOW</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* TOAST */}
      {toast && (
        <View style={[styles.toast, { bottom: insets.bottom + 186 }]} pointerEvents="none">
          <Ionicons name="checkmark-circle" size={16} color={Luxe.goldBright} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* PAYMENT SHEET */}
      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetOpen(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + 22 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetGrip} />
            <Text style={styles.sheetKicker}>Settle your folio</Text>
            <Text style={styles.sheetTitle}>{formatCurrency(balance)}</Text>
            <Text style={styles.sheetSub}>
              Choose how you&apos;d like to pay. You&apos;ll earn{' '}
              {pointsToEarn.toLocaleString('en-IN')} points on this stay.
            </Text>

            <View style={styles.methods}>
              {PAY_METHODS.map((m) => {
                const active = method === m.id;
                const insufficient = m.id === 'loyalty_points' && guestPoints * POINT_VALUE < balance;
                return (
                  <Pressable
                    key={m.id}
                    disabled={insufficient}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setMethod(m.id);
                    }}
                    style={[
                      styles.methodRow,
                      active && styles.methodRowActive,
                      insufficient && { opacity: 0.4 },
                    ]}
                  >
                    <View style={styles.methodIcon}>
                      <Ionicons name={m.icon} size={18} color={active ? Luxe.goldBright : Luxe.ivoryDim} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.methodLabel}>{m.label}</Text>
                      <Text style={styles.methodSub}>
                        {m.id === 'loyalty_points'
                          ? `${guestPoints.toLocaleString('en-IN')} pts available`
                          : m.sub}
                      </Text>
                    </View>
                    <View style={[styles.radio, active && styles.radioOn]}>
                      {active && <View style={styles.radioDot} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={confirmPay}
              disabled={processing || pointsShort}
              style={[styles.confirmBtn, (processing || pointsShort) && { opacity: 0.6 }]}
            >
              <LinearGradient
                colors={['#F4C97E', '#D4A857', '#9A7A3F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.confirmText}>
                {processing
                  ? 'Processing…'
                  : method === 'folio'
                    ? 'Charge to suite'
                    : `Pay ${formatCurrency(balance)}`}
              </Text>
            </Pressable>
            <Text style={styles.sheetSecure}>
              <Ionicons name="lock-closed" size={10} color={Luxe.muted} /> Secured · PCI-DSS · Razorpay
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/* ─────────────────────────── components ─────────────────────────── */

function Section({ kicker, title, hint }: { kicker: string; title: string; hint: string }) {
  return (
    <View style={styles.section}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.sectionKicker}>{kicker}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.sectionHint}>{hint}</Text>
    </View>
  );
}

/* ─────────────────────────── helpers ─────────────────────────── */

function methodLabel(m: PayMethod): string {
  return PAY_METHODS.find((p) => p.id === m)?.label ?? 'Card';
}

function nightCount(checkIn: string, checkOut: string): number {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)));
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// Itemised demo folio (PRD folio shape): room charges = roomRate × nights, plus
// completed F&B / laundry / amenity orders. Used only when no backend folio.
function buildDemoFolio(reservation: Reservation | null, guestName: string): FolioResponse {
  const roomNumber = reservation?.room?.roomNumber ?? '1604';
  const checkIn = reservation?.checkInDate ?? '2026-05-26T14:00:00.000Z';
  const checkOut = reservation?.checkOutDate ?? '2026-05-29T11:00:00.000Z';
  const nights = nightCount(checkIn, checkOut);
  const roomRate = reservation?.roomRate ?? 28000;

  const day = (n: number) => {
    const d = new Date(checkIn);
    d.setDate(d.getDate() + n);
    return d.toISOString();
  };

  const lineItems: FolioLineItem[] = [
    ...Array.from({ length: nights }, (_, i) => ({
      id: `room-${i}`,
      description: `Suite ${roomNumber} · night ${i + 1}`,
      type: 'room' as const,
      amount: roomRate,
      date: day(i),
    })),
    { id: 'f1', description: 'Wagyu tasting, for two', type: 'food', amount: 12200, date: day(1) },
    { id: 'f2', description: 'Cellar pour · Barolo 2016', type: 'food', amount: 4800, date: day(1) },
    { id: 'f3', description: 'In-suite breakfast', type: 'food', amount: 2400, date: day(2) },
    { id: 'l1', description: 'Dry cleaning · 3 garments', type: 'laundry', amount: 1800, date: day(1) },
    { id: 'a1', description: 'Onsen ritual · spa', type: 'amenity', amount: 6500, date: day(2) },
  ];

  const total = lineItems.reduce((a, b) => a + b.amount, 0);
  const paid = reservation?.paidAmount ?? roomRate * nights; // room prepaid
  const room = lineItems.filter((i) => i.type === 'room').reduce((a, b) => a + b.amount, 0);
  const fnb = lineItems.filter((i) => i.type === 'food').reduce((a, b) => a + b.amount, 0);

  return {
    reservation_id: reservation?.id ?? 'demo-reservation',
    guest_name: guestName,
    room_number: roomNumber,
    check_in: checkIn,
    check_out: checkOut,
    line_items: lineItems,
    subtotals: { room, fnb, other: total - room - fnb },
    total_amount: total,
    paid_amount: Math.min(paid, total),
    balance_due: Math.max(0, total - Math.min(paid, total)),
  };
}

/* ─────────────────────────── styles ─────────────────────────── */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },

  // HERO
  hero: { overflow: 'hidden', paddingBottom: 26 },
  ringOuter: {
    position: 'absolute',
    right: -90,
    top: 4,
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.14)',
  },
  ringInner: {
    position: 'absolute',
    right: -10,
    top: 70,
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    borderColor: 'rgba(244,201,126,0.24)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Luxe.goldBright,
    shadowColor: Luxe.amberGlow,
    shadowOpacity: 0.7,
    shadowRadius: 5,
  },
  suiteChipText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.ivoryDim,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitleBlock: { paddingHorizontal: 24, marginTop: 26 },
  heroKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.gold,
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
  heroTitleItalic: { fontFamily: LuxeFonts.serifItalic, color: Luxe.goldBright },
  heroSub: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 13.5,
    lineHeight: 20,
    color: Luxe.ivoryDim,
    marginTop: 14,
    maxWidth: 330,
  },

  // BALANCE
  balanceCard: {
    marginHorizontal: 24,
    marginTop: 8,
    padding: 24,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(244,201,126,0.28)',
  },
  balanceKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  balanceValue: {
    fontFamily: LuxeFonts.serif,
    fontSize: 46,
    lineHeight: 48,
    color: Luxe.ivory,
    letterSpacing: -1.2,
  },
  balanceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,240,210,0.12)',
  },
  balanceMetaCell: { flex: 1 },
  balanceMetaLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8.5,
    color: Luxe.muted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  balanceMetaValue: { fontFamily: LuxeFonts.serif, fontSize: 17, color: Luxe.ivory, letterSpacing: -0.3 },
  balanceDivider: { width: StyleSheet.hairlineWidth, height: 30, backgroundColor: 'rgba(255,240,210,0.12)' },

  // SECTION
  section: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 40,
    marginBottom: 16,
  },
  sectionKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sectionTitle: {
    fontFamily: LuxeFonts.serif,
    fontSize: 24,
    lineHeight: 26,
    color: Luxe.ivory,
    letterSpacing: -0.5,
  },
  sectionHint: { fontFamily: LuxeFonts.sansLight, fontSize: 11, color: Luxe.muted, marginBottom: 4 },

  // GROUPS
  groups: { paddingHorizontal: 24, gap: 12 },
  groupCard: {
    padding: 18,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#1B1610',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.18)',
  },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  groupIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.2)',
  },
  groupTitle: {
    flex: 1,
    fontFamily: LuxeFonts.serif,
    fontSize: 17,
    color: Luxe.ivory,
    letterSpacing: -0.3,
  },
  groupSubtotal: { fontFamily: LuxeFonts.serif, fontSize: 17, color: Luxe.ivory, letterSpacing: -0.3 },
  lines: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: Luxe.hairline,
    gap: 12,
  },
  lineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  lineDesc: { fontFamily: LuxeFonts.sans, fontSize: 13.5, color: Luxe.ivoryDim },
  lineDate: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  lineAmount: { fontFamily: LuxeFonts.sansMedium, fontSize: 13.5, color: Luxe.ivory },

  // INVOICE
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 24,
    marginTop: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: 'rgba(21,19,15,0.5)',
  },
  invoiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.07)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.18)',
  },
  invoiceTitle: { fontFamily: LuxeFonts.sansSemibold, fontSize: 13.5, color: Luxe.ivory },
  invoiceSub: { fontFamily: LuxeFonts.sansLight, fontSize: 12, color: Luxe.titanium, marginTop: 3 },

  // FOOTNOTE
  footnote: {
    marginTop: 36,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.muted,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },

  dockFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 150, pointerEvents: 'none' },

  // SETTLE BAR
  payWrap: { position: 'absolute', left: 16, right: 16 },
  payBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingLeft: 20,
    paddingRight: 12,
    borderRadius: 28,
    backgroundColor: 'rgba(18,16,12,0.96)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.7,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  payLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.muted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  payValue: { fontFamily: LuxeFonts.serif, fontSize: 22, color: Luxe.ivory, letterSpacing: -0.5, marginTop: 2 },
  payCta: {
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#D4A857',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  payCtaText: { fontFamily: LuxeFonts.sansSemibold, fontSize: 12, color: '#1A1410', letterSpacing: 1 },

  settledBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(18,16,12,0.96)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.3)',
  },
  settledText: { fontFamily: LuxeFonts.sans, fontSize: 13.5, color: Luxe.ivory },

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
    borderColor: 'rgba(244,201,126,0.3)',
  },
  toastText: { flex: 1, fontFamily: LuxeFonts.sans, fontSize: 13, color: Luxe.ivory },

  // SHEET
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(4,3,5,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Luxe.graphite,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 26,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.18)',
  },
  sheetGrip: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: Luxe.muted,
    marginBottom: 20,
  },
  sheetKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sheetTitle: { fontFamily: LuxeFonts.serif, fontSize: 38, color: Luxe.ivory, letterSpacing: -1 },
  sheetSub: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 13,
    lineHeight: 19,
    color: Luxe.ivoryDim,
    marginTop: 8,
  },
  methods: { marginTop: 22, gap: 10 },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: Luxe.surfaceBottom,
  },
  methodRowActive: {
    borderColor: 'rgba(244,201,126,0.5)',
    backgroundColor: 'rgba(244,201,126,0.08)',
  },
  methodIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.07)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.18)',
  },
  methodLabel: { fontFamily: LuxeFonts.sansSemibold, fontSize: 14.5, color: Luxe.ivory },
  methodSub: { fontFamily: LuxeFonts.sansLight, fontSize: 12, color: Luxe.titanium, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Luxe.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: Luxe.goldBright },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Luxe.goldBright },
  confirmBtn: {
    marginTop: 22,
    height: 56,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { fontFamily: LuxeFonts.sansSemibold, fontSize: 14, color: '#1A1206', letterSpacing: 0.4 },
  sheetSecure: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.muted,
    letterSpacing: 0.8,
    textAlign: 'center',
    marginTop: 16,
  },
});
