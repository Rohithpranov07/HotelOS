import { useCallback, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  useOrdersStore,
  type Order,
  type OrderStatus,
} from '../../src/stores/orders.store';
import { useReservationStore } from '../../src/stores/reservation.store';
import { connectSocket, disconnectSocket } from '../../src/lib/socket';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'pending', label: 'Received' },
  { key: 'accepted', label: 'Confirmed' },
  { key: 'in_progress', label: 'Preparing' },
  { key: 'completed', label: 'Delivered' },
];

export default function ActiveOrdersScreen() {
  void useLuxeFonts();
  const router = useRouter();
  const orders = useOrdersStore((s) => s.activeOrders);
  const history = useOrdersStore((s) => s.orderHistory);
  const fetch = useOrdersStore((s) => s.fetchActiveOrders);
  const enqueueFeedback = useOrdersStore((s) => s.enqueueFeedback);
  const reorder = useOrdersStore((s) => s.reorder);
  const reservation = useReservationStore((s) => s.reservation);

  useFocusEffect(
    useCallback(() => {
      void fetch();
    }, [fetch]),
  );

  useEffect(() => {
    if (reservation?.id) {
      connectSocket(reservation.id);
    }
    return () => disconnectSocket();
  }, [reservation?.id]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Luxe.ivory} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Live · in motion</Text>
            <Text style={styles.title}>Active orders</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
          {orders.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No orders in motion.</Text>
              <Pressable
                onPress={() => router.push('/(app)/services')}
                style={styles.emptyBtn}
              >
                <Text style={styles.emptyBtnLabel}>BROWSE ROOM SERVICE</Text>
              </Pressable>
            </View>
          ) : (
            orders.map((o) => <OrderCard key={o.id} order={o} />)
          )}

          {history.length > 0 && (
            <View style={{ marginTop: 36 }}>
              <Text style={styles.histHeader}>RECENT</Text>
              {history.slice(0, 6).map((o) => (
                <View key={o.id} style={styles.histRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.histName} numberOfLines={1}>
                      {o.items.map((i) => i.name).join(' · ')}
                    </Text>
                    <Text style={styles.histMeta}>
                      ₹{o.total_amount.toFixed(0)} · {o.status.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.histActions}>
                    <Pressable
                      onPress={() => {
                        reorder(o);
                        router.push('/(app)/cart');
                      }}
                      style={styles.reorderBtn}
                    >
                      <Ionicons name="refresh" size={11} color={Luxe.ivory} />
                      <Text style={styles.reorderLabel}>REORDER</Text>
                    </Pressable>
                    {!o.guest_mood && !o.guest_rating ? (
                      <Pressable onPress={() => enqueueFeedback(o)} style={styles.rateBtn}>
                        <Text style={styles.rateBtnLabel}>RATE</Text>
                      </Pressable>
                    ) : (
                      <Text style={styles.rated}>★ {o.guest_mood ?? o.guest_rating}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <LinearGradient
          colors={['transparent', 'rgba(8,7,10,0.85)', Luxe.obsidian]}
          locations={[0, 0.45, 0.8]}
          pointerEvents="none"
          style={styles.bottomFade}
        />
      </SafeAreaView>
    </View>
  );
}

function OrderCard({ order }: { order: Order }) {
  const currentIdx = STEPS.findIndex((s) => s.key === order.status);
  const activeIdx = currentIdx === -1 ? 0 : currentIdx;
  const itemsLine = order.items.map((i) => `${i.quantity}× ${i.name}`).join(' · ');

  let etaText = '';
  if (order.sla_deadline) {
    const ms = new Date(order.sla_deadline).getTime() - Date.now();
    if (ms > 0) {
      const mins = Math.max(1, Math.round(ms / 60000));
      etaText = `~${mins} min left`;
    } else {
      etaText = 'Finalising';
    }
  } else if (order.estimated_delivery_minutes) {
    etaText = `~${order.estimated_delivery_minutes} min`;
  }

  return (
    <LinearGradient
      colors={[Luxe.surfaceTop, '#0C0A08']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={cardStyles.card}
    >
      <LinearGradient
        colors={['rgba(244,201,126,0.10)', 'transparent']}
        locations={[0, 0.6]}
        style={StyleSheet.absoluteFill}
      />
      <View style={cardStyles.headRow}>
        <Text style={cardStyles.id}>#{order.id.slice(0, 6).toUpperCase()}</Text>
        <View style={cardStyles.statusPill}>
          <View style={cardStyles.liveDot} />
          <Text style={cardStyles.statusText}>{order.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>
      <Text style={cardStyles.items} numberOfLines={2}>
        {itemsLine}
      </Text>

      <View style={cardStyles.track}>
        {STEPS.map((s, i) => {
          const done = i <= activeIdx;
          const current = i === activeIdx;
          return (
            <View key={s.key} style={cardStyles.stepCol}>
              <View style={cardStyles.stepNodeWrap}>
                {i > 0 && (
                  <View
                    style={[
                      cardStyles.connector,
                      { backgroundColor: done ? Luxe.gold : Luxe.hairlineStrong },
                    ]}
                  />
                )}
                <View
                  style={[
                    cardStyles.node,
                    done && cardStyles.nodeDone,
                    current && cardStyles.nodeCurrent,
                  ]}
                />
              </View>
              <Text style={[cardStyles.stepLabel, done && cardStyles.stepLabelDone]}>
                {s.label}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={cardStyles.footer}>
        {etaText ? <Text style={cardStyles.eta}>{etaText}</Text> : <View />}
        {order.assigned_staff ? (
          <Text style={cardStyles.staff}>
            Assigned · {order.assigned_staff.fullName}
          </Text>
        ) : null}
      </View>
    </LinearGradient>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    marginHorizontal: 22,
    marginBottom: 16,
    padding: 22,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: Luxe.hairline,
    overflow: 'hidden',
  },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  id: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.titanium,
    letterSpacing: 1.8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.40)',
    backgroundColor: 'rgba(244,201,126,0.08)',
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Luxe.amberGlow },
  statusText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.amberGlow,
    letterSpacing: 1.4,
  },
  items: {
    fontFamily: LuxeFonts.serif,
    fontSize: 20,
    lineHeight: 26,
    color: Luxe.ivory,
    letterSpacing: -0.4,
    marginTop: 14,
  },
  track: { flexDirection: 'row', marginTop: 22 },
  stepCol: { flex: 1, alignItems: 'center' },
  stepNodeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'flex-end',
    height: 14,
  },
  connector: {
    position: 'absolute',
    left: 0,
    right: '50%',
    height: 1,
    top: 6.5,
  },
  node: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Luxe.surfaceTop,
    borderWidth: 1,
    borderColor: Luxe.hairlineStrong,
  },
  nodeDone: { backgroundColor: Luxe.gold, borderColor: Luxe.goldBright },
  nodeCurrent: {
    backgroundColor: Luxe.amberGlow,
    borderColor: Luxe.amberGlow,
    shadowColor: Luxe.amberGlow,
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  stepLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8.5,
    color: Luxe.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  stepLabelDone: { color: Luxe.ivory },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Luxe.hairline,
  },
  eta: {
    fontFamily: LuxeFonts.serifItalic,
    fontSize: 13,
    color: Luxe.amberGlow,
  },
  staff: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.titanium,
    letterSpacing: 1.4,
  },
});

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
  empty: { alignItems: 'center', paddingTop: 60, gap: 18 },
  emptyText: {
    fontFamily: LuxeFonts.serifItalic,
    fontSize: 16,
    color: Luxe.titanium,
  },
  emptyBtn: {
    paddingHorizontal: 22,
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
  histHeader: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.gold,
    letterSpacing: 2.2,
    paddingHorizontal: 28,
    marginBottom: 14,
  },
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Luxe.hairline,
  },
  histName: { fontFamily: LuxeFonts.serif, fontSize: 16, color: Luxe.ivoryDim },
  histMeta: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.muted,
    marginTop: 4,
    letterSpacing: 1.3,
  },
  histActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: 'rgba(28,26,21,0.6)',
  },
  reorderLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.ivory,
    letterSpacing: 1.5,
  },
  rateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.40)',
  },
  rateBtnLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.amberGlow,
    letterSpacing: 1.5,
  },
  rated: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 12,
    color: Luxe.amberGlow,
    letterSpacing: 1,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 130,
    pointerEvents: 'none',
  },
});
