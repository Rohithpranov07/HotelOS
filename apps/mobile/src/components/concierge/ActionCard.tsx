import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Luxe, LuxeFonts } from '../../theme/luxe';
import type { ConciergeAction } from '../../stores/concierge.store';

interface ActionCardProps {
  action: ConciergeAction;
  onTrack?: () => void;
  onConfirm?: () => void;
  onEdit?: () => void;
}

interface OrderItem {
  name: string;
  sub?: string;
  qty?: number;
  price?: number;
}

export function ActionCard({ action, onTrack, onConfirm, onEdit }: ActionCardProps) {
  if (action.type === 'human_escalation') {
    return null;
  }
  const data = action.data ?? {};
  const items = Array.isArray(data.items) ? (data.items as OrderItem[]) : [];
  const total = (data.total as number) ?? items.reduce((s, i) => s + (i.price ?? 0) * (i.qty ?? 1), 0);
  const currency = (data.currency_symbol as string) ?? '₹';
  const eta = data.eta_minutes ? `ETA ${data.eta_minutes} min` : data.eta ? `ETA ${data.eta}` : 'ETA 12 min';
  const title = (data.headline as string) ?? 'Your usual,';
  const accent = (data.highlight as string) ?? 'plus a warm croissant.';
  const isOrder = action.type === 'order_created' || items.length > 0;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['rgba(244,201,126,0.18)', 'transparent']}
        locations={[0, 0.55]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.hairlineTop} />

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={styles.kicker}>
            {isOrder ? 'Suite service · Drafted' : 'Service · Drafted'}
          </Text>
          <Text style={styles.eta}>{eta}</Text>
        </View>
        <Text style={styles.title}>
          {title} <Text style={styles.accent}>{accent}</Text>
        </Text>

        {items.length ? (
          <View style={{ marginTop: 4 }}>
            {items.map((it, i) => (
              <View key={`${it.name}-${i}`} style={[styles.itemRow, i > 0 && styles.itemRowDivided]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.itemName}>{it.name}</Text>
                  <Text style={styles.itemSub}>
                    {[it.sub, it.qty ? `×${it.qty}` : null].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>
                  {it.price ? `${currency} ${formatPrice(it.price)}` : 'incl.'}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Charged to folio</Text>
          <Text style={styles.totalValue}>{currency} {formatPrice(total)}</Text>
        </View>
        <View style={styles.btnRow}>
          <Pressable onPress={onConfirm ?? onTrack} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>{isOrder ? 'Send it up' : 'Confirm'}</Text>
          </Pressable>
          <Pressable onPress={onEdit ?? onTrack} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>{isOrder ? 'Edit' : 'Adjust'}</Text>
          </Pressable>
        </View>
        {onTrack && isOrder ? (
          <Pressable onPress={onTrack} style={styles.trackLink}>
            <Text style={styles.trackText}>Track this order →</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function formatPrice(value: number): string {
  return value.toLocaleString('en-IN');
}

const styles = StyleSheet.create({
  card: {
    marginTop: 4,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#0C0A08',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.16)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 20 },
  },
  hairlineTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(244,201,126,0.32)',
  },
  body: { padding: 18 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  eta: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.ivoryDim,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: LuxeFonts.serif,
    fontSize: 21,
    lineHeight: 24,
    color: Luxe.ivory,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  accent: {
    fontFamily: LuxeFonts.serifItalic,
    color: Luxe.goldBright,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 12,
  },
  itemRowDivided: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Luxe.hairlineStrong,
  },
  itemName: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 14,
    color: Luxe.ivory,
  },
  itemSub: {
    marginTop: 2,
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  itemPrice: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 11,
    color: Luxe.ivoryDim,
    letterSpacing: 0.4,
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Luxe.hairlineStrong,
    backgroundColor: 'rgba(244,201,126,0.04)',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.muted,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  totalValue: {
    fontFamily: LuxeFonts.serif,
    fontSize: 22,
    color: Luxe.ivory,
    letterSpacing: -0.4,
  },
  btnRow: { flexDirection: 'row', gap: 8 },
  primaryBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: Luxe.goldBright,
    alignItems: 'center',
    shadowColor: Luxe.gold,
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  primaryBtnText: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 12.5,
    color: '#1A1410',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  secondaryBtn: {
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: 'rgba(255,240,210,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,240,210,0.12)',
  },
  secondaryBtnText: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 12.5,
    color: Luxe.ivoryDim,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  trackLink: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  trackText: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 12,
    color: Luxe.goldBright,
    letterSpacing: 0.4,
  },
});
