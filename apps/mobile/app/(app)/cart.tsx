import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useOrdersStore, type PaymentMethod } from '../../src/stores/orders.store';
import { useReservationStore } from '../../src/stores/reservation.store';
import { QuantityStepper } from '../../src/components/luxe/OrderingPrimitives';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';

const SERVICE_RATE = 0.05;

export default function CartScreen() {
  void useLuxeFonts();
  const router = useRouter();
  const cart = useOrdersStore((s) => s.cart);
  const updateCartItem = useOrdersStore((s) => s.updateCartItem);
  const placeOrder = useOrdersStore((s) => s.placeOrder);
  const placing = useOrdersStore((s) => s.placing);
  const cartTotal = useOrdersStore((s) => s.cartTotal());
  const reservation = useReservationStore((s) => s.reservation);

  const [payment, setPayment] = useState<PaymentMethod>('folio');
  const [notes, setNotes] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timing, setTiming] = useState<'asap' | 'schedule'>('asap');
  const [scheduleMinutes, setScheduleMinutes] = useState(30);
  const SCHEDULE_OPTIONS = [30, 60, 90, 120];

  const service = Math.round(cartTotal * SERVICE_RATE);
  const total = cartTotal + service;

  const onPlace = async () => {
    // Bypass reservation gate for demo — placeOrder falls back to a local fake
    // order anyway when the backend is unavailable.
    const reservationId = reservation?.id ?? 'demo-reservation';
    try {
      const scheduledFor =
        timing === 'schedule'
          ? new Date(Date.now() + scheduleMinutes * 60 * 1000).toISOString()
          : null;
      const order = await placeOrder(reservationId, payment, {
        notes: notes || undefined,
        scheduledFor,
      });
      router.replace({ pathname: '/(app)/order-confirmation', params: { orderId: order.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to place order');
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Luxe.ivory} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>{cart.length} {cart.length === 1 ? 'item' : 'items'}</Text>
            <Text style={styles.title}>Your order</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 260 }}
          showsVerticalScrollIndicator={false}
        >
          {cart.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.empty}>Your tray is empty.</Text>
              <Pressable onPress={() => router.back()} style={styles.emptyBtn}>
                <Text style={styles.emptyBtnLabel}>BROWSE MENU</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.section}>
              {cart.map((item) => (
                <View key={item.menuItemId} style={styles.cartRow}>
                  <View style={{ flex: 1, paddingRight: 14 }}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemPrice}>
                      ₹{(item.unitPrice * item.quantity).toFixed(0)}
                      <Text style={styles.itemUnit}>  ·  ₹{item.unitPrice.toFixed(0)} ea</Text>
                    </Text>
                    {editing === item.menuItemId ? (
                      <TextInput
                        autoFocus
                        value={item.notes}
                        onChangeText={(v) =>
                          updateCartItem(item.menuItemId, item.quantity, v)
                        }
                        onBlur={() => setEditing(null)}
                        placeholder="Special instructions"
                        placeholderTextColor={Luxe.muted}
                        style={styles.notesInput}
                      />
                    ) : (
                      <Pressable onPress={() => setEditing(item.menuItemId)}>
                        <Text style={styles.notesLink}>
                          {item.notes ? `“${item.notes}”` : '+ Add note'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  <QuantityStepper
                    value={item.quantity}
                    onChange={(n) => updateCartItem(item.menuItemId, n)}
                    size="sm"
                  />
                </View>
              ))}
            </View>
          )}

          {cart.length > 0 && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Delivery time</Text>
                <View style={styles.payRow}>
                  <PayOption
                    label="ASAP"
                    sub={`~${(useOrdersStore.getState().menu?.kitchen_open ?? true) ? '24 min' : 'Kitchen closed'}`}
                    active={timing === 'asap'}
                    onPress={() => setTiming('asap')}
                  />
                  <PayOption
                    label="Schedule"
                    sub={`In ${scheduleMinutes} min`}
                    active={timing === 'schedule'}
                    onPress={() => setTiming('schedule')}
                  />
                </View>
                {timing === 'schedule' && (
                  <View style={styles.schedRow}>
                    {SCHEDULE_OPTIONS.map((m) => (
                      <Pressable
                        key={m}
                        onPress={() => setScheduleMinutes(m)}
                        style={[
                          styles.schedPill,
                          scheduleMinutes === m && styles.schedPillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.schedPillLabel,
                            scheduleMinutes === m && styles.schedPillLabelActive,
                          ]}
                        >
                          {m} MIN
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Order notes</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  placeholder="e.g. Please knock loudly"
                  placeholderTextColor={Luxe.muted}
                  style={styles.bigInput}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Charge to</Text>
                <View style={styles.payRow}>
                  <PayOption
                    label="Room folio"
                    sub="Settled at checkout"
                    active={payment === 'folio'}
                    onPress={() => setPayment('folio')}
                  />
                  <PayOption
                    label="Card"
                    sub="Razorpay · instant"
                    active={payment === 'razorpay'}
                    onPress={() => setPayment('razorpay')}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Row label="Subtotal" value={`₹${cartTotal.toFixed(0)}`} />
                <Row label="Service charge · 5%" value={`₹${service.toFixed(0)}`} />
                <View style={styles.divider} />
                <Row label="Total" value={`₹${total.toFixed(0)}`} emphasis />
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}
            </>
          )}
        </ScrollView>

        {/* FLOATING PLACE ORDER */}
        {cart.length > 0 && (
          <View style={styles.placeWrap}>
            <LinearGradient
              colors={['transparent', Luxe.obsidian]}
              locations={[0, 0.5]}
              pointerEvents="none"
              style={styles.placeFade}
            />
            <Pressable
              disabled={placing}
              onPress={onPlace}
              style={[styles.placeBtn, placing && { opacity: 0.6 }]}
            >
              <LinearGradient
                colors={['#E8B466', '#9A7A3F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.placeLabel}>
                {placing ? 'PLACING…' : `PLACE ORDER · ₹${total.toFixed(0)}`}
              </Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

function PayOption({
  label,
  sub,
  active,
  onPress,
}: {
  label: string;
  sub: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.payOpt, active && styles.payOptActive]}>
      <View style={[styles.radio, active && styles.radioActive]}>
        {active && <View style={styles.radioDot} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.payLabel, active && { color: Luxe.amberGlow }]}>{label}</Text>
        <Text style={styles.paySub}>{sub}</Text>
      </View>
    </Pressable>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, emphasis && styles.rowLabelEm]}>{label}</Text>
      <Text style={[styles.rowValue, emphasis && styles.rowValueEm]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 22,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: 'rgba(28,26,21,0.6)',
    marginBottom: 4,
  },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontFamily: LuxeFonts.serif,
    fontSize: 32,
    color: Luxe.ivory,
    letterSpacing: -0.7,
  },
  section: {
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Luxe.hairline,
  },
  sectionLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  itemName: {
    fontFamily: LuxeFonts.serif,
    fontSize: 18,
    color: Luxe.ivory,
    letterSpacing: -0.3,
  },
  itemPrice: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 12,
    color: Luxe.amberGlow,
    marginTop: 8,
    letterSpacing: 0.4,
  },
  itemUnit: { color: Luxe.muted, fontSize: 11 },
  notesLink: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.titanium,
    marginTop: 8,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  notesInput: {
    fontFamily: LuxeFonts.sans,
    fontSize: 13,
    color: Luxe.ivory,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Luxe.hairlineStrong,
  },
  bigInput: {
    fontFamily: LuxeFonts.sans,
    fontSize: 14,
    color: Luxe.ivory,
    padding: 16,
    minHeight: 76,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: 'rgba(28,26,21,0.5)',
    textAlignVertical: 'top',
  },
  payRow: { flexDirection: 'row', gap: 10 },
  schedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  schedPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: 'rgba(28,26,21,0.6)',
  },
  schedPillActive: {
    borderColor: 'rgba(244,201,126,0.45)',
    backgroundColor: 'rgba(244,201,126,0.10)',
  },
  schedPillLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.ivoryDim,
    letterSpacing: 1.6,
  },
  schedPillLabelActive: { color: Luxe.amberGlow },
  payOpt: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: 'rgba(28,26,21,0.5)',
    gap: 12,
  },
  payOptActive: {
    borderColor: 'rgba(244,201,126,0.45)',
    backgroundColor: 'rgba(244,201,126,0.06)',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: Luxe.titanium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: Luxe.gold },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Luxe.amberGlow },
  payLabel: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 14,
    color: Luxe.ivory,
  },
  paySub: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.muted,
    marginTop: 3,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rowLabel: {
    fontFamily: LuxeFonts.sans,
    fontSize: 13,
    color: Luxe.ivoryDim,
  },
  rowLabelEm: {
    fontFamily: LuxeFonts.serif,
    fontSize: 18,
    color: Luxe.ivory,
    letterSpacing: -0.3,
  },
  rowValue: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 13,
    color: Luxe.ivory,
    letterSpacing: 0.4,
  },
  rowValueEm: {
    fontSize: 18,
    color: Luxe.amberGlow,
    letterSpacing: 0.5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Luxe.hairlineStrong,
    marginVertical: 12,
  },
  emptyWrap: { paddingHorizontal: 28, paddingTop: 80, alignItems: 'center', gap: 18 },
  empty: {
    fontFamily: LuxeFonts.serifItalic,
    fontSize: 18,
    color: Luxe.titanium,
  },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.40)',
  },
  emptyBtnLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.amberGlow,
    letterSpacing: 2,
  },
  errorText: {
    fontFamily: LuxeFonts.sans,
    color: '#E89B7A',
    fontSize: 13,
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  placeWrap: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 22,
  },
  placeFade: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: 40,
  },
  placeBtn: {
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
  placeLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 12,
    color: '#16140F',
    letterSpacing: 2.4,
    fontWeight: '600',
  },
});
