import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Luxe, LuxeFonts } from '../../theme/luxe';
import { FoodImage, QuantityStepper, Tag } from './OrderingPrimitives';

type FoodTone = 'amber' | 'bronze' | 'ink' | 'ivory' | 'crimson';

export interface ItemDetail {
  id: string;
  name: string;
  description: string | null;
  price: number;
  prepTimeMinutes: number;
  dietaryTags: string[];
  allergens: string[];
  imageUrl?: string | null;
  tone?: FoodTone;
}

export function ItemDetailSheet({
  item,
  initialQty = 1,
  initialNotes = '',
  onClose,
  onAdd,
}: {
  item: ItemDetail | null;
  initialQty?: number;
  initialNotes?: string;
  onClose: () => void;
  onAdd: (qty: number, notes: string) => void;
}) {
  const [qty, setQty] = useState(initialQty);
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    if (item) {
      setQty(initialQty || 1);
      setNotes(initialNotes);
    }
  }, [item?.id, initialQty, initialNotes, item]);

  const subtotal = item ? item.price * qty : 0;

  return (
    <Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        {item && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* IMAGE */}
            <View style={styles.imgWrap}>
              <FoodImage
                tone={item.tone ?? 'bronze'}
                showRing={!item.imageUrl}
                showLabel={false}
                imageUrl={item.imageUrl}
              />
              <LinearGradient
                colors={['transparent', 'rgba(8,7,10,0.85)']}
                locations={[0.5, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
                <Ionicons name="close" size={18} color={Luxe.ivory} />
              </Pressable>
              <View style={styles.handle} />
            </View>

            {/* CONTENT */}
            <View style={styles.content}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={3}>
                  {item.name}
                </Text>
                <Text style={styles.price}>₹{item.price.toFixed(0)}</Text>
              </View>

              {item.description ? (
                <Text style={styles.desc}>{item.description}</Text>
              ) : null}

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  {item.prepTimeMinutes} MIN
                </Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.metaText}>
                  Allergens: {item.allergens.length ? item.allergens.join(', ') : 'None'}
                </Text>
              </View>

              {item.dietaryTags.length > 0 && (
                <View style={styles.tagRow}>
                  {item.dietaryTags.map((t) => (
                    <Tag key={t}>{prettify(t)}</Tag>
                  ))}
                </View>
              )}

              <View style={styles.divider} />

              <Text style={styles.label}>Special instructions</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Extra sambar please"
                placeholderTextColor={Luxe.muted}
                style={styles.input}
                multiline
              />

              <View style={styles.qtyRow}>
                <Text style={styles.label}>Quantity</Text>
                <QuantityStepper value={qty} onChange={(n) => setQty(Math.max(1, n))} />
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* STICKY ADD BUTTON */}
        {item && (
          <View style={styles.ctaWrap}>
            <LinearGradient
              colors={['transparent', Luxe.graphite]}
              locations={[0, 0.5]}
              style={styles.ctaFade}
              pointerEvents="none"
            />
            <Pressable
              onPress={() => onAdd(qty, notes)}
              style={styles.cta}
            >
              <LinearGradient
                colors={['#F4C97E', '#D4A857', '#9A7A3F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.ctaLabel}>
                ADD TO SUITE  ·  ₹{subtotal.toFixed(0)}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

function prettify(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: Luxe.graphite,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  imgWrap: {
    height: 220,
    position: 'relative',
    overflow: 'hidden',
  },
  handle: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(245,239,224,0.4)',
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,18,15,0.65)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.12)',
  },
  content: { padding: 24, paddingTop: 22 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  name: {
    flex: 1,
    fontFamily: LuxeFonts.serif,
    fontSize: 28,
    lineHeight: 32,
    color: Luxe.ivory,
    letterSpacing: -0.6,
  },
  price: {
    fontFamily: LuxeFonts.serif,
    fontSize: 24,
    color: Luxe.amberGlow,
    letterSpacing: -0.4,
  },
  desc: {
    marginTop: 12,
    fontFamily: LuxeFonts.sansLight,
    fontSize: 14,
    lineHeight: 21,
    color: Luxe.ivoryDim,
    letterSpacing: -0.05,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  metaText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.titanium,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  dot: { color: Luxe.muted, fontSize: 11 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 14, flexWrap: 'wrap' },
  divider: {
    height: 0.5,
    backgroundColor: Luxe.hairlineStrong,
    marginVertical: 22,
  },
  label: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.gold,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  input: {
    fontFamily: LuxeFonts.sans,
    fontSize: 14,
    color: Luxe.ivory,
    padding: 14,
    minHeight: 72,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: 'rgba(8,7,10,0.5)',
    textAlignVertical: 'top',
  },
  qtyRow: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 22,
    paddingTop: 30,
  },
  ctaFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 40,
  },
  cta: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#D4A857',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  ctaLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 11.5,
    color: '#1A1410',
    letterSpacing: 2,
    fontWeight: '600',
  },
});
