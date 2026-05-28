import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Luxe, LuxeFonts } from '../../theme/luxe';

// ───────────────────────────────────────────────────────────
// QuantityStepper (kept for cart screen)
// ───────────────────────────────────────────────────────────
export function QuantityStepper({
  value,
  onChange,
  size = 'md',
}: {
  value: number;
  onChange: (v: number) => void;
  size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 26 : 32;
  const font = size === 'sm' ? 13 : 15;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(244,201,126,0.08)',
        borderWidth: 0.5,
        borderColor: 'rgba(244,201,126,0.30)',
        borderRadius: dim,
        overflow: 'hidden',
      }}
    >
      <Pressable
        hitSlop={8}
        onPress={() => onChange(Math.max(0, value - 1))}
        style={{ width: dim, height: dim, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="remove" size={size === 'sm' ? 14 : 16} color={Luxe.ivory} />
      </Pressable>
      <Text
        style={{
          fontFamily: LuxeFonts.monoMedium,
          fontSize: font,
          color: Luxe.ivory,
          textAlign: 'center',
          minWidth: dim,
          letterSpacing: 0.5,
        }}
      >
        {value}
      </Text>
      <Pressable
        hitSlop={8}
        onPress={() => onChange(value + 1)}
        style={{ width: dim, height: dim, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="add" size={size === 'sm' ? 14 : 16} color={Luxe.ivory} />
      </Pressable>
    </View>
  );
}

// ───────────────────────────────────────────────────────────
// FoodImage — atmospheric tinted slot (no real image)
// ───────────────────────────────────────────────────────────
type FoodTone = 'amber' | 'bronze' | 'ink' | 'ivory' | 'crimson';

const FOOD_PALETTE: Record<FoodTone, { base: string; pool: string; accent: string; stripe: string }> = {
  amber: { base: '#15130f', pool: 'rgba(212,168,87,0.18)', accent: 'rgba(244,201,126,0.40)', stripe: 'rgba(244,201,126,0.10)' },
  bronze: { base: '#13110e', pool: 'rgba(139,111,71,0.28)', accent: 'rgba(232,180,102,0.30)', stripe: 'rgba(139,111,71,0.16)' },
  ink: { base: '#0e0c09', pool: 'rgba(140,150,165,0.10)', accent: 'rgba(170,180,200,0.18)', stripe: 'rgba(168,162,154,0.05)' },
  ivory: { base: '#16130f', pool: 'rgba(245,239,224,0.14)', accent: 'rgba(245,239,224,0.30)', stripe: 'rgba(245,239,224,0.08)' },
  crimson: { base: '#100b09', pool: 'rgba(180,80,80,0.20)', accent: 'rgba(244,201,126,0.22)', stripe: 'rgba(180,80,80,0.10)' },
};

export function FoodImage({
  tone = 'amber',
  showRing = false,
  showLabel = true,
  style,
}: {
  tone?: FoodTone;
  showRing?: boolean;
  showLabel?: boolean;
  style?: ViewStyle;
}) {
  const p = FOOD_PALETTE[tone];
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: p.base, overflow: 'hidden' }, style]}>
      {/* diagonal stripe wash via stacked gradients */}
      <LinearGradient
        colors={[p.stripe, 'transparent', p.stripe, 'transparent']}
        locations={[0, 0.25, 0.55, 0.85]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* warm pool top-left */}
      <LinearGradient
        colors={[p.pool, 'transparent']}
        start={{ x: 0.2, y: 0.15 }}
        end={{ x: 0.75, y: 0.85 }}
        style={StyleSheet.absoluteFill}
      />
      {/* accent bottom-right */}
      <LinearGradient
        colors={['transparent', p.accent]}
        start={{ x: 0.2, y: 0.2 }}
        end={{ x: 0.95, y: 0.95 }}
        style={StyleSheet.absoluteFill}
      />
      {showRing && (
        <>
          <View
            style={{
              position: 'absolute',
              left: '4%',
              top: '4%',
              right: '4%',
              bottom: '4%',
              borderRadius: 9999,
              borderWidth: 0.5,
              borderColor: 'rgba(244,201,126,0.18)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: '17%',
              top: '17%',
              right: '17%',
              bottom: '17%',
              borderRadius: 9999,
              borderWidth: 0.5,
              borderColor: 'rgba(244,201,126,0.32)',
              overflow: 'hidden',
            }}
          >
            <LinearGradient
              colors={[p.accent, 'transparent']}
              start={{ x: 0.25, y: 0.2 }}
              end={{ x: 0.9, y: 0.9 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        </>
      )}
      {showLabel && (
        <Text
          style={{
            position: 'absolute',
            right: 10,
            top: 8,
            fontFamily: LuxeFonts.monoMedium,
            fontSize: 8.5,
            color: Luxe.muted,
            letterSpacing: 1.2,
            opacity: 0.55,
          }}
        >
          IMG
        </Text>
      )}
    </View>
  );
}

// ───────────────────────────────────────────────────────────
// Tag pill
// ───────────────────────────────────────────────────────────
export function Tag({ children, glow }: { children: ReactNode; glow?: boolean }) {
  if (glow) {
    return (
      <View style={tagStyles.glow}>
        <LinearGradient
          colors={['#F4C97E', '#D4A857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={tagStyles.glowText}>{children}</Text>
      </View>
    );
  }
  return (
    <View style={tagStyles.tag}>
      <Text style={tagStyles.text}>{children}</Text>
    </View>
  );
}

const tagStyles = StyleSheet.create({
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(255,240,210,0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.10)',
  },
  text: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8.5,
    color: Luxe.ivoryDim,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  glow: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  glowText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8.5,
    color: '#1A1410',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});

// ───────────────────────────────────────────────────────────
// GlassPill — circular icon button
// ───────────────────────────────────────────────────────────
export function GlassPill({
  onPress,
  children,
  size = 38,
}: {
  onPress?: () => void;
  children: ReactNode;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(20,18,15,0.55)',
        borderWidth: 0.5,
        borderColor: 'rgba(255,240,210,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </Pressable>
  );
}

// ───────────────────────────────────────────────────────────
// DiningHero
// ───────────────────────────────────────────────────────────
export function DiningHero({
  suite,
  etaMinutes,
  closesAt,
  kitchenOpen,
  onBack,
}: {
  suite: string;
  etaMinutes: number;
  closesAt: string;
  kitchenOpen: boolean;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  // Pad the topbar below the status bar; let the hero's gradients extend
  // edge-to-edge behind it for visual continuity.
  const topBarPadding = insets.top + 10;
  return (
    <View style={[heroStyles.root, { height: 280 + insets.top }]}>
      {/* base */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: Luxe.obsidian }]} />
      {/* lamp glow top-right */}
      <LinearGradient
        colors={['rgba(244,201,126,0.30)', 'rgba(244,201,126,0.08)', 'transparent']}
        locations={[0, 0.4, 0.7]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.35, y: 0.65 }}
        style={StyleSheet.absoluteFill}
      />
      {/* warm bronze pool bottom-left */}
      <LinearGradient
        colors={['rgba(139,111,71,0.20)', 'transparent']}
        start={{ x: 0.05, y: 0.95 }}
        end={{ x: 0.6, y: 0.4 }}
        style={StyleSheet.absoluteFill}
      />
      {/* far-right plate rings */}
      <View style={heroStyles.outerRing} />
      <View style={heroStyles.innerRing}>
        <LinearGradient
          colors={['rgba(244,201,126,0.18)', 'transparent']}
          start={{ x: 0.25, y: 0.25 }}
          end={{ x: 0.85, y: 0.85 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* TOP BAR */}
      <View style={[heroStyles.topBar, { paddingTop: topBarPadding }]}>
        <GlassPill onPress={onBack}>
          <Ionicons name="chevron-back" size={16} color={Luxe.ivory} />
        </GlassPill>
        <View style={heroStyles.kitchenChip}>
          <View
            style={[
              heroStyles.liveDot,
              { backgroundColor: kitchenOpen ? Luxe.goldBright : Luxe.muted },
            ]}
          />
          <Text style={heroStyles.kitchenLabel}>
            {kitchenOpen ? 'Kitchen open' : 'Kitchen closed'}
          </Text>
        </View>
      </View>

      {/* TITLE */}
      <View style={heroStyles.titleBlock}>
        <Text style={heroStyles.kicker}>In-Suite Dining</Text>
        <Text style={heroStyles.title}>
          Crafted, <Text style={heroStyles.titleItalic}>delivered.</Text>
        </Text>
      </View>

      {/* CONTEXT STRIP */}
      <View style={heroStyles.contextStrip}>
        <ContextCell label="To suite" value={suite} />
        <View style={heroStyles.divider} />
        <ContextCell label="ETA" value={String(etaMinutes)} unit="min" />
        <View style={heroStyles.divider} />
        <ContextCell label="Until" value={closesAt} />
      </View>
    </View>
  );
}

function ContextCell({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View>
      <Text style={heroStyles.ctxLabel}>{label}</Text>
      <Text style={heroStyles.ctxValue}>
        {value}
        {unit ? <Text style={heroStyles.ctxUnit}>  {unit}</Text> : null}
      </Text>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  root: { overflow: 'hidden' },
  outerRing: {
    position: 'absolute',
    right: -120,
    top: 50,
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.10)',
  },
  innerRing: {
    position: 'absolute',
    right: -80,
    top: 80,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.18)',
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  kitchenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.20)',
    backgroundColor: 'rgba(20,18,15,0.55)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  kitchenLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.goldBright,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  titleBlock: { paddingHorizontal: 24, paddingTop: 24 },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontFamily: LuxeFonts.serif,
    fontSize: 52,
    lineHeight: 50,
    color: Luxe.ivory,
    letterSpacing: -1.3,
  },
  titleItalic: {
    fontFamily: LuxeFonts.serifItalic,
    color: Luxe.amberGlow,
  },
  contextStrip: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 18,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: Luxe.hairlineStrong,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  divider: { width: 0.5, height: 30, backgroundColor: Luxe.hairlineStrong },
  ctxLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.muted,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  ctxValue: {
    fontFamily: LuxeFonts.serif,
    fontSize: 22,
    color: Luxe.ivory,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  ctxUnit: { color: Luxe.muted, fontSize: 13 },
});

// ───────────────────────────────────────────────────────────
// ConciergeMini + AIPick
// ───────────────────────────────────────────────────────────
function ConciergeMini() {
  return (
    <View style={aiStyles.miniWrap}>
      <LinearGradient
        colors={['#F4C97E', '#D4A857', '#8B6F47', '#F4C97E']}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 8 }]}
      />
      <LinearGradient
        colors={['rgba(255,240,210,0.7)', 'transparent']}
        start={{ x: 0.3, y: 0.25 }}
        end={{ x: 0.9, y: 0.9 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 8 }]}
      />
    </View>
  );
}

export function AIPick({
  title,
  italic,
  metaLeft,
  metaRight,
  onAdd,
  ctaLabel = 'Add set',
}: {
  title: string;
  italic?: string;
  metaLeft: string;
  metaRight: string;
  onAdd?: () => void;
  ctaLabel?: string;
}) {
  return (
    <View style={aiStyles.card}>
      <LinearGradient
        colors={['rgba(244,201,126,0.16)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['#15130f', '#0c0a08']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
      />
      <View style={aiStyles.header}>
        <ConciergeMini />
        <Text style={aiStyles.kicker}>For you, tonight</Text>
      </View>
      <Text style={aiStyles.title}>
        {title}
        {italic ? (
          <>
            {' '}
            <Text style={aiStyles.italic}>{italic}</Text>
          </>
        ) : null}
      </Text>
      <View style={aiStyles.foot}>
        <Text style={aiStyles.meta}>
          {metaLeft}  ·  <Text style={aiStyles.metaPrice}>{metaRight}</Text>
        </Text>
        <Pressable onPress={onAdd} style={aiStyles.cta}>
          <LinearGradient
            colors={['#F4C97E', '#D4A857', '#9A7A3F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={aiStyles.ctaLabel}>{ctaLabel.toUpperCase()}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const aiStyles = StyleSheet.create({
  miniWrap: {
    width: 16,
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: Luxe.amberGlow,
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  card: {
    borderRadius: 22,
    padding: 18,
    paddingTop: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.20)',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: LuxeFonts.serif,
    fontSize: 20,
    lineHeight: 25,
    color: Luxe.ivory,
    letterSpacing: -0.3,
  },
  italic: { fontFamily: LuxeFonts.serifItalic, color: Luxe.goldBright },
  foot: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  meta: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.ivoryDim,
    letterSpacing: 0.6,
  },
  metaPrice: { color: Luxe.goldBright },
  cta: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 9999,
    overflow: 'hidden',
    shadowColor: '#D4A857',
    shadowOpacity: 0.32,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  ctaLabel: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 11,
    color: '#1A1410',
    letterSpacing: 0.6,
  },
});

// ───────────────────────────────────────────────────────────
// CategoryRail — numbered with gold underline
// ───────────────────────────────────────────────────────────
export function CategoryRail({
  categories,
  active,
  onChange,
}: {
  categories: string[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <View style={railStyles.row}>
      {categories.map((c, i) => {
        const isActive = c === active;
        return (
          <Pressable
            key={c}
            onPress={() => onChange(c)}
            hitSlop={{ top: 16, bottom: 16, left: 8, right: 8 }}
            style={({ pressed }) => [
              railStyles.col,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text style={[railStyles.num, isActive && railStyles.numActive]}>
              {String(i + 1).padStart(2, '0')}
            </Text>
            <Text style={[railStyles.label, isActive && railStyles.labelActive]}>
              {prettify(c)}
            </Text>
            <View
              style={[
                railStyles.underline,
                isActive && railStyles.underlineActive,
              ]}
            >
              {isActive && (
                <LinearGradient
                  colors={['#F4C97E', '#9A7A3F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function prettify(s: string) {
  return s
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

const railStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 22, paddingHorizontal: 24, paddingVertical: 4 },
  col: { alignItems: 'flex-start', gap: 4, paddingVertical: 6 },
  num: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.muted,
    letterSpacing: 1.2,
  },
  numActive: { color: Luxe.goldBright },
  label: {
    fontFamily: LuxeFonts.serif,
    fontSize: 20,
    color: Luxe.titanium,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  labelActive: { color: Luxe.ivory },
  underline: {
    width: 0,
    height: 1,
    marginTop: 5,
    borderRadius: 1,
    overflow: 'hidden',
  },
  underlineActive: {
    width: '100%',
    shadowColor: Luxe.amberGlow,
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
});

// ───────────────────────────────────────────────────────────
// SectionHeader (dining variant)
// ───────────────────────────────────────────────────────────
export function DiningSectionHeader({
  kicker,
  title,
  right,
}: {
  kicker: string;
  title: string;
  right?: string;
}) {
  return (
    <View style={sectionStyles.row}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={sectionStyles.kicker}>{kicker}</Text>
        <Text style={sectionStyles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {right ? <Text style={sectionStyles.right}>{right}</Text> : null}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 16,
  },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontFamily: LuxeFonts.serif,
    fontSize: 26,
    color: Luxe.ivory,
    letterSpacing: -0.6,
    lineHeight: 28,
  },
  right: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.ivoryDim,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    paddingBottom: 3,
  },
});

// ───────────────────────────────────────────────────────────
// ChefsPick — large featured card
// ───────────────────────────────────────────────────────────
export function ChefsPick({
  category,
  byline,
  name,
  italic,
  desc,
  tags,
  priceLabel,
  price,
  onAdd,
  onFavorite,
  tone = 'bronze',
}: {
  category: string;
  byline: string;
  name: string;
  italic?: string;
  desc: string;
  tags: string[];
  priceLabel: string;
  price: string;
  onAdd?: () => void;
  onFavorite?: () => void;
  tone?: FoodTone;
}) {
  return (
    <View style={chefStyles.wrap}>
      {/* image area */}
      <View style={chefStyles.imgArea}>
        <FoodImage tone={tone} showRing showLabel={false} />
        {/* badge */}
        <View style={chefStyles.badge}>
          <LinearGradient
            colors={['#F4C97E', '#D4A857', '#9A7A3F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={chefStyles.badgeText}>CHEF'S CHOICE</Text>
        </View>
        {/* favorite */}
        <View style={chefStyles.fav}>
          <GlassPill onPress={onFavorite}>
            <Ionicons name="heart-outline" size={15} color={Luxe.ivoryDim} />
          </GlassPill>
        </View>
        {/* bottom fade */}
        <LinearGradient
          colors={['transparent', 'rgba(8,7,10,0.85)']}
          locations={[0.5, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      {/* content */}
      <LinearGradient
        colors={['#14110D', '#0B0907']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={chefStyles.content}
      >
        <View style={chefStyles.byline}>
          <Text style={chefStyles.bylineText}>{category.toUpperCase()}</Text>
          <View style={chefStyles.dot} />
          <Text style={chefStyles.bylineText}>{byline.toUpperCase()}</Text>
        </View>
        <Text style={chefStyles.name}>
          {name}
          {italic ? (
            <>
              {' '}
              <Text style={chefStyles.italic}>{italic}</Text>
            </>
          ) : null}
        </Text>
        <Text style={chefStyles.desc}>{desc}</Text>
        <View style={chefStyles.tagRow}>
          {tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </View>
        <View style={chefStyles.foot}>
          <View>
            <Text style={chefStyles.priceLabel}>{priceLabel.toUpperCase()}</Text>
            <Text style={chefStyles.price}>{price}</Text>
          </View>
          <Pressable onPress={onAdd} style={chefStyles.addBtn}>
            <LinearGradient
              colors={['#F4C97E', '#D4A857', '#9A7A3F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={chefStyles.addLabel}>ADD TO SUITE</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

const chefStyles = StyleSheet.create({
  wrap: {
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.18)',
    shadowColor: '#000',
    shadowOpacity: 0.85,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
  },
  imgArea: { height: 220, position: 'relative', overflow: 'hidden' },
  badge: {
    position: 'absolute',
    left: 18,
    top: 18,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  badgeText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: '#1A1410',
    letterSpacing: 1.4,
    fontWeight: '600',
  },
  fav: { position: 'absolute', right: 18, top: 18 },
  content: { padding: 20, paddingTop: 18 },
  byline: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  bylineText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.muted,
    letterSpacing: 1.4,
  },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Luxe.muted },
  name: {
    fontFamily: LuxeFonts.serif,
    fontSize: 28,
    lineHeight: 30,
    color: Luxe.ivory,
    letterSpacing: -0.7,
  },
  italic: { fontFamily: LuxeFonts.serifItalic, color: Luxe.goldBright },
  desc: {
    marginTop: 8,
    fontFamily: LuxeFonts.sansLight,
    fontSize: 13,
    lineHeight: 19.5,
    color: Luxe.ivoryDim,
    letterSpacing: -0.05,
  },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' },
  foot: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: Luxe.hairlineStrong,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.muted,
    letterSpacing: 1.4,
  },
  price: {
    fontFamily: LuxeFonts.serif,
    fontSize: 24,
    color: Luxe.ivory,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  addBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#D4A857',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  addLabel: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 12,
    color: '#1A1410',
    letterSpacing: 0.6,
  },
});

// ───────────────────────────────────────────────────────────
// MenuItem row
// ───────────────────────────────────────────────────────────
export function MenuItem({
  kicker,
  name,
  italic,
  desc,
  tags = [],
  price,
  time,
  tone = 'amber',
  qty = 0,
  onAdd,
  onStep,
  onPress,
}: {
  kicker?: string;
  name: string;
  italic?: string;
  desc: string;
  tags?: string[];
  price: string;
  time: string;
  tone?: FoodTone;
  qty?: number;
  onAdd?: () => void;
  onStep?: (n: number) => void;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={menuStyles.row}>
      <View style={{ flex: 1, minWidth: 0, paddingRight: 14 }}>
        {kicker ? <Text style={menuStyles.kicker}>{kicker.toUpperCase()}</Text> : null}
        <Text style={menuStyles.name}>
          {name}
          {italic ? (
            <>
              {' '}
              <Text style={menuStyles.italic}>{italic}</Text>
            </>
          ) : null}
        </Text>
        <Text style={menuStyles.desc}>{desc}</Text>
        {tags.length > 0 && (
          <View style={menuStyles.tagRow}>
            {tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </View>
        )}
        <View style={menuStyles.foot}>
          <View style={menuStyles.priceRow}>
            <Text style={menuStyles.price}>{price}</Text>
            <Text style={menuStyles.time}>{time.toUpperCase()}</Text>
          </View>
          {qty === 0 ? (
            <Pressable onPress={onAdd} style={menuStyles.addBtn} hitSlop={6}>
              <Ionicons name="add" size={11} color={Luxe.goldBright} />
              <Text style={menuStyles.addLabel}>ADD</Text>
            </Pressable>
          ) : (
            <QuantityStepper value={qty} onChange={(n) => onStep?.(n)} size="sm" />
          )}
        </View>
      </View>
      <View style={menuStyles.imgSlot}>
        <FoodImage tone={tone} />
      </View>
    </Pressable>
  );
}

const menuStyles = StyleSheet.create({
  row: { flexDirection: 'row', paddingBottom: 18, gap: 14 },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.gold,
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  name: {
    fontFamily: LuxeFonts.serif,
    fontSize: 22,
    lineHeight: 24,
    color: Luxe.ivory,
    letterSpacing: -0.4,
  },
  italic: { fontFamily: LuxeFonts.serifItalic, color: Luxe.goldBright },
  desc: {
    marginTop: 6,
    fontFamily: LuxeFonts.sansLight,
    fontSize: 12.5,
    lineHeight: 18,
    color: Luxe.ivoryDim,
    letterSpacing: -0.05,
  },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  foot: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  price: {
    fontFamily: LuxeFonts.serif,
    fontSize: 20,
    color: Luxe.ivory,
    letterSpacing: -0.3,
  },
  time: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.muted,
    letterSpacing: 1.2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: 'rgba(244,201,126,0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.32)',
  },
  addLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.goldBright,
    letterSpacing: 1.2,
  },
  imgSlot: {
    width: 100,
    height: 130,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.06)',
  },
});

// ───────────────────────────────────────────────────────────
// PairingCard
// ───────────────────────────────────────────────────────────
export function PairingCard({
  kicker,
  name,
  region,
  year,
  price,
  tone = 'crimson',
}: {
  kicker: string;
  name: string;
  region: string;
  year: string;
  price: string;
  tone?: FoodTone;
}) {
  return (
    <View style={pairingStyles.card}>
      <FoodImage tone={tone} showLabel={false} />
      <LinearGradient
        colors={['rgba(8,7,10,0.10)', 'rgba(8,7,10,0.92)']}
        locations={[0.3, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* bottle silhouette */}
      <View style={pairingStyles.bottle}>
        <View style={pairingStyles.bottleLabel}>
          <LinearGradient
            colors={['rgba(244,201,126,0.18)', 'rgba(139,111,71,0.10)']}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </View>
      <Text style={pairingStyles.kicker}>{kicker.toUpperCase()}</Text>
      <View style={pairingStyles.foot}>
        <Text style={pairingStyles.name}>{name}</Text>
        <View style={pairingStyles.row}>
          <Text style={pairingStyles.region}>
            {region} · {year}
          </Text>
          <Text style={pairingStyles.price}>{price}</Text>
        </View>
      </View>
    </View>
  );
}

const pairingStyles = StyleSheet.create({
  card: {
    width: 180,
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.75,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
  },
  bottle: {
    position: 'absolute',
    left: '50%',
    marginLeft: -12,
    top: 24,
    width: 24,
    height: 110,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: 'rgba(20,18,15,0.85)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.25)',
    overflow: 'hidden',
  },
  bottleLabel: {
    position: 'absolute',
    top: 22,
    left: 3,
    right: 3,
    height: 28,
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.35)',
    overflow: 'hidden',
  },
  kicker: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 14,
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.gold,
    letterSpacing: 1.6,
  },
  foot: { position: 'absolute', left: 14, right: 14, bottom: 14 },
  name: {
    fontFamily: LuxeFonts.serif,
    fontSize: 18,
    lineHeight: 20,
    color: Luxe.ivory,
    letterSpacing: -0.3,
  },
  row: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  region: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.ivoryDim,
    letterSpacing: 0.6,
  },
  price: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.goldBright,
    letterSpacing: 0.6,
  },
});

// ───────────────────────────────────────────────────────────
// CartBar — floating gold-rimmed
// ───────────────────────────────────────────────────────────
export function CartBar({
  count,
  total,
  etaMinutes,
  onSend,
}: {
  count: number;
  total: string;
  etaMinutes: number;
  onSend?: () => void;
}) {
  if (count === 0) return null;
  return (
    <View style={cartStyles.outer}>
      <View style={cartStyles.fill} />
      {/* top hairline */}
      <LinearGradient
        colors={['transparent', 'rgba(244,201,126,0.45)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={cartStyles.topLine}
      />
      <View style={cartStyles.row}>
        <View style={cartStyles.countBadge}>
          <LinearGradient
            colors={['rgba(244,201,126,0.18)', 'rgba(139,111,71,0.06)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 19 }]}
          />
          <Text style={cartStyles.countText}>{count}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={cartStyles.total}>{total}</Text>
          <Text style={cartStyles.meta}>
            {count} {count === 1 ? 'item' : 'items'}  ·  {etaMinutes} MIN
          </Text>
        </View>
        <Pressable onPress={onSend} style={cartStyles.cta}>
          <LinearGradient
            colors={['#F4C97E', '#D4A857', '#9A7A3F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={cartStyles.ctaLabel}>SEND UP →</Text>
        </Pressable>
      </View>
    </View>
  );
}

const cartStyles = StyleSheet.create({
  outer: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.30)',
    shadowColor: '#000',
    shadowOpacity: 0.85,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18,16,12,0.92)',
  },
  topLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 12,
  },
  countBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.30)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontFamily: LuxeFonts.serif,
    fontSize: 17,
    color: Luxe.goldBright,
  },
  total: {
    fontFamily: LuxeFonts.serif,
    fontSize: 18,
    color: Luxe.ivory,
    letterSpacing: -0.3,
  },
  meta: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.ivoryDim,
    letterSpacing: 1.2,
    marginTop: 1,
  },
  cta: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#D4A857',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  ctaLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: '#1A1410',
    letterSpacing: 1.2,
    fontWeight: '600',
  },
});
