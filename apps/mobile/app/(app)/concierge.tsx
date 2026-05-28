import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { useAuthStore } from '../../src/stores/auth.store';
import { useReservationStore } from '../../src/stores/reservation.store';
import {
  useConciergeStore,
  type ConciergeAction,
  type ConciergeMessage,
} from '../../src/stores/concierge.store';
import { useOrdersStore, type CartItem } from '../../src/stores/orders.store';
import { DEMO_RESERVATION } from '../../src/lib/demo';
import { subscribeConcierge } from '../../src/lib/socket';
import { ConciergeOrb } from '../../src/components/concierge/ConciergeOrb';
import {
  AIMessage,
  SystemMessage,
  TypingIndicator,
  UserMessage,
} from '../../src/components/concierge/ConciergeMessages';
import { ActionCard } from '../../src/components/concierge/ActionCard';
import {
  SuggestionRail,
  type SuggestionItem,
  type SuggestionTone,
} from '../../src/components/concierge/SuggestionRail';
import { ChatInput } from '../../src/components/concierge/ChatInput';
import { EscalationModal } from '../../src/components/concierge/EscalationModal';

const DEFAULT_SUGGESTIONS: SuggestionItem[] = [
  { kicker: 'Suite', title: 'Order dinner', tone: 'amber' },
  { kicker: 'Wellness', title: 'Book the spa', tone: 'bronze' },
  { kicker: 'Stay', title: 'Late check-out', tone: 'ink' },
  { kicker: 'Linen', title: 'Fresh towels', tone: 'ivory' },
  { kicker: 'Edit', title: 'Quiet rooftop dining', tone: 'amber' },
  { kicker: 'Transport', title: 'Airport car at dawn', tone: 'bronze' },
];

const TONES: SuggestionTone[] = ['amber', 'bronze', 'ink', 'ivory'];

export default function ConciergeScreen() {
  useLuxeFonts();
  const router = useRouter();
  const guest = useAuthStore((s) => s.guest);
  const liveReservation = useReservationStore((s) => s.reservation);
  const fetchActiveReservation = useReservationStore((s) => s.fetchActiveReservation);
  const reservation = liveReservation ?? DEMO_RESERVATION;

  const messages = useConciergeStore((s) => s.messages);
  const isTyping = useConciergeStore((s) => s.isTyping);
  const escalationVisible = useConciergeStore((s) => s.escalationVisible);
  const hydrated = useConciergeStore((s) => s.hydrated);
  const hydrateFromStorage = useConciergeStore((s) => s.hydrateFromStorage);
  const hydrateGreeting = useConciergeStore((s) => s.hydrateGreeting);
  const setTyping = useConciergeStore((s) => s.setTyping);
  const appendAssistantMessage = useConciergeStore((s) => s.appendAssistantMessage);
  const sendMessage = useConciergeStore((s) => s.sendMessage);
  const requestHuman = useConciergeStore((s) => s.requestHuman);
  const dismissEscalation = useConciergeStore((s) => s.dismissEscalation);

  const addToCart = useOrdersStore((s) => s.addToCart);
  const clearCart = useOrdersStore((s) => s.clearCart);
  const placeOrder = useOrdersStore((s) => s.placeOrder);

  const [input, setInput] = useState('');
  const [voiceActive, setVoiceActive] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => setKbHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvt, () => setKbHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    fetchActiveReservation();
  }, [fetchActiveReservation]);

  useEffect(() => {
    hydrateFromStorage(reservation.id);
  }, [reservation.id, hydrateFromStorage]);

  useEffect(() => {
    if (!hydrated) return;
    hydrateGreeting(guest?.fullName?.split(' ')[0]);
  }, [hydrated, guest?.fullName, hydrateGreeting]);

  useEffect(() => {
    if (!reservation.id) return;
    const unsubscribe = subscribeConcierge(reservation.id, {
      onTypingStart: () => setTyping(true),
      onTypingStop: () => setTyping(false),
      onAssistantMessage: (p) => {
        appendAssistantMessage({
          id: p.id ?? `m_${Date.now().toString(36)}`,
          role: 'assistant',
          content: p.content,
          timestamp: Date.now(),
          actions: p.actions?.map((a) => ({
            type: (a.type as string) ?? 'service_requested',
            data: a,
          })),
          suggestions: p.suggestions,
        });
      },
    });
    return unsubscribe;
  }, [reservation.id, setTyping, appendAssistantMessage]);

  useEffect(() => {
    // auto-scroll on new message / typing
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages, isTyping]);

  const guestProfile = useMemo(
    () => ({
      guest_id: guest?.id ?? 'demo-guest',
      first_name: guest?.fullName?.split(' ')[0] ?? 'Rohith',
      loyalty_tier: guest?.loyaltyTier ?? 'PLATINUM',
      loyalty_points: guest?.loyaltyPoints ?? 12450,
      room_number: reservation.room?.roomNumber ?? '1604',
      hotel_name: 'Hôtel Octave',
      property_id: 'demo-property',
    }),
    [guest, reservation.room?.roomNumber],
  );

  const handleSend = useCallback(
    async (textArg?: string) => {
      const text = (textArg ?? input).trim();
      if (!text) return;
      setInput('');
      setVoiceActive(false);
      await sendMessage(text, reservation.id, guestProfile);
    },
    [input, sendMessage, reservation.id, guestProfile],
  );

  const loadCartFromAction = useCallback(
    (action: ConciergeAction) => {
      const data = action.data ?? {};
      const items = Array.isArray(data.items) ? (data.items as Array<Record<string, unknown>>) : [];
      const cartItems: CartItem[] = items
        .filter((it) => it && typeof it.name === 'string')
        .map((it, idx) => ({
          menuItemId:
            (it.menu_item_id as string) ??
            (it.id as string) ??
            `concierge-${idx}-${(it.name as string).toLowerCase().replace(/\s+/g, '-')}`,
          name: it.name as string,
          quantity: (it.qty as number) ?? (it.quantity as number) ?? 1,
          unitPrice: (it.price as number) ?? (it.unit_price as number) ?? 0,
          notes: (it.sub as string) ?? (it.notes as string) ?? '',
        }));
      if (!cartItems.length) return false;
      clearCart();
      cartItems.forEach((ci) => addToCart(ci));
      return true;
    },
    [addToCart, clearCart],
  );

  const handleConfirmOrder = useCallback(
    async (action: ConciergeAction) => {
      const loaded = loadCartFromAction(action);
      if (!loaded) {
        router.push('/(app)/orders');
        return;
      }
      try {
        const order = await placeOrder(reservation.id, 'folio');
        router.push({ pathname: '/(app)/order-confirmation', params: { orderId: order.id } });
      } catch {
        router.push('/(app)/cart');
      }
    },
    [loadCartFromAction, placeOrder, reservation.id, router],
  );

  const handleEditOrder = useCallback(
    (action: ConciergeAction) => {
      if (loadCartFromAction(action)) {
        router.push('/(app)/cart');
      } else {
        router.push('/(app)/services');
      }
    },
    [loadCartFromAction, router],
  );

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const inlineSuggestions: SuggestionItem[] = lastAssistant?.suggestions?.length
    ? lastAssistant.suggestions.slice(0, 6).map((title, i) => ({
        kicker: kickerFor(title),
        title,
        tone: TONES[i % TONES.length],
      }))
    : DEFAULT_SUGGESTIONS;

  const showSuggestionRail = !isTyping;
  const checkoutDay = dayLabel(reservation);
  const firstName = guest?.fullName?.split(' ')[0] ?? 'Guest';

  return (
    <View style={styles.root}>
      <Atmosphere />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ paddingBottom: 220 + kbHeight }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Header
              suite={reservation.room?.roomNumber ?? '1604'}
              tier={tierLabel(guest?.loyaltyTier)}
              day={checkoutDay}
              onBack={() => router.back()}
            />

            <View style={styles.chat}>
              {messages.map((m) => (
                <MessageRouter
                  key={m.id}
                  message={m}
                  onTrack={() => router.push('/(app)/orders')}
                  onConfirm={handleConfirmOrder}
                  onEdit={handleEditOrder}
                />
              ))}
              {isTyping ? <TypingIndicator /> : null}
            </View>
          </ScrollView>

          {/* bottom obscuration fade */}
          <LinearGradient
            colors={['transparent', 'rgba(8,7,10,0.85)', Luxe.obsidian]}
            locations={[0, 0.5, 0.85]}
            pointerEvents="none"
            style={styles.bottomFade}
          />

          {/* suggestions float above input */}
          {showSuggestionRail && kbHeight === 0 ? (
            <View style={styles.railWrap} pointerEvents="box-none">
              <SuggestionRail items={inlineSuggestions} onPick={(it) => handleSend(it.title)} />
            </View>
          ) : null}

          {/* INPUT */}
          <View
            style={[
              styles.inputWrap,
              kbHeight > 0 && { bottom: kbHeight + 8 },
            ]}
            pointerEvents="box-none"
          >
            <ChatInput
              value={input}
              onChangeText={setInput}
              onSend={() => handleSend()}
              onVoice={() => setVoiceActive((v) => !v)}
              voiceActive={voiceActive}
            />
          </View>
        </View>
      </SafeAreaView>

      <EscalationModal
        visible={escalationVisible}
        onConnect={() => requestHuman(reservation.id)}
        onContinue={dismissEscalation}
      />
    </View>
  );
}

interface MessageRouterProps {
  message: ConciergeMessage;
  onTrack: () => void;
  onConfirm: (action: ConciergeAction) => void;
  onEdit: (action: ConciergeAction) => void;
}

function MessageRouter({ message, onTrack, onConfirm, onEdit }: MessageRouterProps) {
  if (message.role === 'system') {
    return <SystemMessage text={message.content} />;
  }
  if (message.role === 'user') {
    return <UserMessage time={formatTime(message.timestamp)} text={message.content} />;
  }
  const actions = message.actions ?? [];
  return (
    <AIMessage time={formatTime(message.timestamp)} text={message.content}>
      {actions.map((a, i) => (
        <ActionCard
          key={i}
          action={a}
          onTrack={onTrack}
          onConfirm={() => onConfirm(a)}
          onEdit={() => onEdit(a)}
        />
      ))}
    </AIMessage>
  );
}

interface HeaderProps {
  suite: string;
  tier: string;
  day: string;
  onBack: () => void;
}

function Header({ suite, tier, day, onBack }: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.glassPill}>
          <Ionicons name="chevron-back" size={16} color={Luxe.ivory} />
        </Pressable>
        <View style={styles.statusPill}>
          <View style={styles.liveDot} />
          <Text style={styles.statusText}>Listening</Text>
        </View>
      </View>

      <Text style={styles.kicker}>Concierge · AI</Text>

      <View style={styles.titleRow}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.titleLine}>At your</Text>
          <Text style={[styles.titleLine, styles.titleAccent]}>service.</Text>
        </View>
        <View style={{ marginTop: 18 }}>
          <ConciergeOrb size={92} />
        </View>
      </View>

      <Text style={styles.subhead}>
        Ask anything. The concierge knows your stay, your preferences, and every corner of the hotel.
      </Text>

      <View style={styles.contextRow}>
        <ContextItem label="Suite" value={suite} />
        <ContextDivider />
        <ContextItem label="Tier" value={tier} highlight />
        <ContextDivider />
        <ContextItem label="Day" value={day} />
      </View>
    </View>
  );
}

function ContextItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.contextItem}>
      <Text style={styles.contextLabel}>{label}</Text>
      <Text style={[styles.contextValue, highlight && { color: Luxe.goldBright }]}>{value}</Text>
    </View>
  );
}

function ContextDivider() {
  return <View style={styles.contextDot} />;
}

function Atmosphere() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={{ flex: 1, backgroundColor: Luxe.obsidian }} />
    </View>
  );
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function tierLabel(t?: string): string {
  if (!t) return 'Obsidian';
  if (t === 'PLATINUM') return 'Obsidian';
  return t.charAt(0) + t.slice(1).toLowerCase();
}

function dayLabel(r: { checkInDate: string; checkOutDate: string }): string {
  const total = Math.max(
    1,
    Math.round((new Date(r.checkOutDate).getTime() - new Date(r.checkInDate).getTime()) / 86_400_000),
  );
  const elapsed = Math.min(
    total,
    Math.max(1, Math.ceil((Date.now() - new Date(r.checkInDate).getTime()) / 86_400_000)),
  );
  return `${elapsed}/${total}`;
}

function kickerFor(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('order') || t.includes('food') || t.includes('dinner') || t.includes('breakfast')) return 'Suite';
  if (t.includes('spa') || t.includes('onsen') || t.includes('massage')) return 'Wellness';
  if (t.includes('check')) return 'Stay';
  if (t.includes('car') || t.includes('airport') || t.includes('transport')) return 'Transport';
  if (t.includes('linen') || t.includes('towel') || t.includes('housekeep')) return 'Linen';
  if (t.includes('track')) return 'Order';
  return 'Edit';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },
  atmoTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380,
  },
  atmoBottom: {
    position: 'absolute',
    top: 360,
    left: 0,
    right: 0,
    height: 280,
  },
  header: {
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  glassPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,18,15,0.55)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.12)',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(20,18,15,0.55)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.20)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Luxe.goldBright,
    shadowColor: Luxe.goldBright,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  statusText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.goldBright,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2.4,
    color: Luxe.gold,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  titleLine: {
    fontFamily: LuxeFonts.serif,
    fontSize: 64,
    lineHeight: 62,
    color: Luxe.ivory,
    letterSpacing: -1.8,
  },
  titleAccent: {
    fontFamily: LuxeFonts.serifItalic,
    color: Luxe.amberGlow,
  },
  subhead: {
    marginTop: 18,
    fontFamily: LuxeFonts.sansLight,
    fontSize: 14,
    lineHeight: 21,
    color: Luxe.ivoryDim,
    maxWidth: 300,
  },
  contextRow: {
    marginTop: 26,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Luxe.hairlineStrong,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 28,
  },
  contextItem: { gap: 4 },
  contextLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.muted,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  contextValue: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.ivory,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  contextDot: {
    marginTop: 14,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Luxe.muted,
  },
  chat: {
    marginTop: 28,
    paddingHorizontal: 24,
    gap: 26,
  },
  railWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 110 : 96,
    zIndex: 5,
  },
  inputWrap: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: Platform.OS === 'ios' ? 28 : 18,
    zIndex: 6,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 230,
    zIndex: 4,
  },
});
