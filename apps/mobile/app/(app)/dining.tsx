import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  AIPick,
  CartBar,
  CategoryRail,
  ChefsPick,
  DiningHero,
  DiningSectionHeader,
  MenuItem,
} from '../../src/components/luxe/OrderingPrimitives';
import { PairingCard } from '../../src/components/luxe/OrderingPrimitives';
import { ItemDetailSheet } from '../../src/components/luxe/ItemDetailSheet';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { useOrdersStore, type MenuItem as MenuItemType } from '../../src/stores/orders.store';
import { useReservationStore } from '../../src/stores/reservation.store';
import { DEMO_MENU } from '../../src/lib/demoMenu';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';

type FoodTone = 'amber' | 'bronze' | 'ink' | 'ivory' | 'crimson';
const TONES: FoodTone[] = ['amber', 'bronze', 'ivory', 'crimson', 'ink'];
const KICKERS = ['Guest favourite', 'Perfect tonight', 'Quiet plate', 'Of the night'];

function toneFor(seed: string): FoodTone {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length]!;
}

function splitItalic(name: string): { head: string; italic?: string } {
  const idx = name.indexOf(',');
  if (idx > 0 && idx < name.length - 2) {
    return { head: name.slice(0, idx + 1), italic: name.slice(idx + 1).trim() + '.' };
  }
  return { head: name };
}

export default function DiningScreen() {
  void useLuxeFonts();
  const router = useRouter();
  const apiMenu = useOrdersStore((s) => s.menu);
  const loading = useOrdersStore((s) => s.menuLoading);
  const fetchMenu = useOrdersStore((s) => s.fetchMenu);
  const menu = useMemo(() => {
    if (apiMenu && apiMenu.items.length > 0) return apiMenu;
    return DEMO_MENU;
  }, [apiMenu]);
  const cart = useOrdersStore((s) => s.cart);
  const addToCart = useOrdersStore((s) => s.addToCart);
  const updateCartItem = useOrdersStore((s) => s.updateCartItem);
  const cartCount = useOrdersStore((s) => s.cartCount());
  const cartTotal = useOrdersStore((s) => s.cartTotal());
  const [detailItem, setDetailItem] = useState<MenuItemType | null>(null);
  const [query, setQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [bestOnly, setBestOnly] = useState(false);
  const [quickOnly, setQuickOnly] = useState(false);

  const qtyFor = (id: string) =>
    cart.find((c) => c.menuItemId === id)?.quantity ?? 0;
  const notesFor = (id: string) =>
    cart.find((c) => c.menuItemId === id)?.notes ?? '';
  const fetchActiveOrders = useOrdersStore((s) => s.fetchActiveOrders);
  const reservation = useReservationStore((s) => s.reservation);

  useFocusEffect(
    useCallback(() => {
      fetchMenu({ recommended: true });
      fetchActiveOrders();
    }, [fetchMenu, fetchActiveOrders]),
  );

  useEffect(() => {
    if (!apiMenu) fetchMenu({ recommended: true });
  }, [apiMenu, fetchMenu]);

  const categories = useMemo(() => menu?.categories ?? [], [menu]);
  const [activeCategory, setActiveCategory] = useState<string>(categories[0] ?? '');
  useEffect(() => {
    if (!activeCategory && categories.length) setActiveCategory(categories[0]!);
  }, [categories, activeCategory]);

  const chefsPickItem: MenuItemType | undefined = useMemo(() => {
    const cat = activeCategory || categories[0];
    const inCat = menu?.items.find((i) => i.category === cat);
    return inCat ?? menu?.recommended?.[0] ?? menu?.items?.[0];
  }, [menu, activeCategory, categories]);

  const listForCategory = useMemo(() => {
    if (!menu) return [];
    const cat = activeCategory || categories[0];
    return menu.items
      .filter((i) => (cat ? i.category === cat : true))
      .filter((i) => i.id !== chefsPickItem?.id);
  }, [menu, activeCategory, categories, chefsPickItem]);

  const pairings = useMemo(() => {
    if (!menu) return [];
    return menu.items
      .filter((i) => i.category === 'beverage' || i.category === 'drinks')
      .slice(0, 4);
  }, [menu]);

  const isFiltering = query.trim().length > 0 || vegOnly || bestOnly || quickOnly;

  const recommendedIds = useMemo(
    () => new Set((menu?.recommended ?? []).map((i) => i.id)),
    [menu],
  );

  const results = useMemo(() => {
    if (!menu) return [];
    const q = query.trim().toLowerCase();
    return menu.items.filter((it) => {
      if (q) {
        const hay = `${it.name} ${it.description ?? ''} ${it.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (vegOnly && !it.dietaryTags.some((t) => t === 'vegetarian' || t === 'vegan')) return false;
      if (bestOnly && !recommendedIds.has(it.id)) return false;
      if (quickOnly && it.prepTimeMinutes > 20) return false;
      return true;
    });
  }, [menu, query, vegOnly, bestOnly, quickOnly, recommendedIds]);

  const suite = reservation?.room?.roomNumber ?? '1604';
  const eta = chefsPickItem?.prepTimeMinutes ?? 24;
  const closesAt = menu?.kitchen_hours.close ?? '02:00';

  const handleAdd = (item: MenuItemType) => {
    addToCart({
      menuItemId: item.id,
      name: item.name,
      quantity: 1,
      unitPrice: item.price,
      notes: '',
      imageUrl: item.imageUrl,
    });
  };

  const totalFormatted = `₹${cartTotal.toFixed(0)}`;
  const cartEta = chefsPickItem?.prepTimeMinutes ?? 24;

  if (loading && !menu) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={Luxe.gold} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 260 }}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: Luxe.obsidian }}
        bounces={false}
        overScrollMode="never"
      >
        <DiningHero
          suite={suite}
          etaMinutes={eta}
          closesAt={closesAt}
          kitchenOpen={menu?.kitchen_open ?? true}
          onBack={() => router.back()}
        />

        {/* SEARCH + CART */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={Luxe.titanium} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search dishes, drinks…"
              placeholderTextColor={Luxe.muted}
              style={styles.searchInput}
              returnKeyType="search"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={Luxe.muted} />
              </Pressable>
            )}
          </View>
          <Pressable
            style={styles.cartBtn}
            onPress={() => router.push('/(app)/cart')}
            accessibilityRole="button"
            accessibilityLabel="View cart"
          >
            <Ionicons name="bag-handle-outline" size={20} color={Luxe.goldBright} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* QUICK FILTERS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <FilterChip
            label="Pure veg"
            vegDot
            active={vegOnly}
            onPress={() => setVegOnly((v) => !v)}
          />
          <FilterChip
            icon="star"
            label="Bestsellers"
            active={bestOnly}
            onPress={() => setBestOnly((v) => !v)}
          />
          <FilterChip
            icon="flash"
            label="Under 20 min"
            active={quickOnly}
            onPress={() => setQuickOnly((v) => !v)}
          />
          {isFiltering && (
            <FilterChip
              icon="close"
              label="Clear"
              active={false}
              onPress={() => {
                setQuery('');
                setVegOnly(false);
                setBestOnly(false);
                setQuickOnly(false);
              }}
            />
          )}
        </ScrollView>

        {isFiltering ? (
          <View style={{ marginTop: 26 }}>
            <DiningSectionHeader
              kicker={query.trim() ? 'Search results' : 'Filtered'}
              title={
                results.length
                  ? `${results.length} ${results.length === 1 ? 'dish' : 'dishes'}`
                  : 'Nothing found'
              }
              right={results.length ? String(results.length).padStart(2, '0') : undefined}
            />
            {results.length > 0 ? (
              <View style={{ paddingHorizontal: 24 }}>
                {results.map((it, i) => {
                  const split = splitItalic(it.name);
                  return (
                    <View
                      key={it.id}
                      style={[
                        styles.menuRowWrap,
                        i === 0 && { borderTopWidth: 0.5, borderTopColor: Luxe.hairlineStrong },
                      ]}
                    >
                      <MenuItem
                        kicker={recommendedIds.has(it.id) ? 'Bestseller' : prettify(it.category)}
                        name={split.head}
                        italic={split.italic}
                        desc={it.description ?? ''}
                        tags={[
                          ...(it.dietaryTags[0] ? [prettify(it.dietaryTags[0])] : []),
                          `· ${it.prepTimeMinutes} min`,
                        ]}
                        price={`₹${it.price.toFixed(0)}`}
                        time={`${it.prepTimeMinutes} min`}
                        tone={toneFor(it.id)}
                        qty={qtyFor(it.id)}
                        imageUrl={it.imageUrl}
                        onAdd={() => handleAdd(it)}
                        onStep={(n) => updateCartItem(it.id, n)}
                        onPress={() => setDetailItem(it)}
                      />
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyResults}>
                <Ionicons name="restaurant-outline" size={26} color={Luxe.muted} />
                <Text style={styles.emptyTitle}>No dishes match</Text>
                <Text style={styles.emptySub}>Try a different search or clear your filters.</Text>
              </View>
            )}
          </View>
        ) : (
          <>
        {/* LIVE SERVICE STRIP */}
        <LiveServiceStrip etaMinutes={eta} />

        {/* AI PICK */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <AIPick
            title={
              chefsPickItem
                ? `A quiet ${chefsPickItem.name.toLowerCase()} set with your`
                : 'A quiet wagyu set with your'
            }
            italic="usual cappuccino after."
            metaLeft={
              menu?.recommended?.length
                ? `${menu.recommended.length} dishes`
                : '3 dishes'
            }
            metaRight={`₹${(chefsPickItem ? chefsPickItem.price * 2 : 12200).toFixed(0)}`}
            ctaLabel="Add set"
            onAdd={() => chefsPickItem && handleAdd(chefsPickItem)}
          />
        </View>

        {/* LIVE FROM THE PASS */}
        <KitchenTicker />

        {/* CATEGORIES */}
        {categories.length > 0 && (
          <View style={{ marginTop: 36 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.railScroll}
            >
              <CategoryRail
                categories={categories}
                active={activeCategory || categories[0]!}
                onChange={setActiveCategory}
              />
            </ScrollView>
          </View>
        )}

        {/* CHEF'S PICK */}
        {chefsPickItem && (
          <View style={{ marginTop: 28, paddingHorizontal: 20 }}>
            <ChefsPick
              category={chefsPickItem.category}
              byline="By Chef Aoyama"
              {...splitChef(chefsPickItem.name)}
              desc={chefsPickItem.description ?? 'A signature of the house — prepared to order, served with precision.'}
              tags={[
                `· ${chefsPickItem.prepTimeMinutes} min`,
                ...chefsPickItem.dietaryTags.slice(0, 2).map((t) => `· ${prettify(t)}`),
              ]}
              priceLabel="For two"
              price={`₹${(chefsPickItem.price * 2).toFixed(0)}`}
              tone="bronze"
              imageUrl={chefsPickItem.imageUrl}
              onAdd={() => handleAdd(chefsPickItem)}
            />
          </View>
        )}

        {/* MENU LIST */}
        {listForCategory.length > 0 && (
          <View style={{ marginTop: 40 }}>
            <DiningSectionHeader
              kicker={prettify(activeCategory || 'Menu')}
              title={titleForCategory(activeCategory)}
              right={String(listForCategory.length).padStart(2, '0')}
            />
            <View style={{ paddingHorizontal: 24 }}>
              {listForCategory.map((it, i) => {
                const split = splitItalic(it.name);
                return (
                  <View
                    key={it.id}
                    style={[
                      styles.menuRowWrap,
                      i === 0 && { borderTopWidth: 0.5, borderTopColor: Luxe.hairlineStrong },
                    ]}
                  >
                    <MenuItem
                      kicker={KICKERS[i % KICKERS.length]}
                      name={split.head}
                      italic={split.italic}
                      desc={it.description ?? ''}
                      tags={[
                        ...(it.dietaryTags[0] ? [prettify(it.dietaryTags[0])] : []),
                        `· ${it.prepTimeMinutes} min`,
                      ]}
                      price={`₹${it.price.toFixed(0)}`}
                      time={`${it.prepTimeMinutes} min`}
                      tone={toneFor(it.id)}
                      qty={qtyFor(it.id)}
                      imageUrl={it.imageUrl}
                      onAdd={() => handleAdd(it)}
                      onStep={(n) => updateCartItem(it.id, n)}
                      onPress={() => setDetailItem(it)}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* PAIRINGS */}
        {pairings.length > 0 && (
          <View style={{ marginTop: 40 }}>
            <DiningSectionHeader
              kicker="From the cellar"
              title="Tonight's pairings"
              right="See list"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingHorizontal: 24 }}
            >
              {pairings.map((p, i) => (
                <PairingCard
                  key={p.id}
                  kicker={['Sommelier', 'Of the night', 'House', 'Pairs nicely'][i % 4]!}
                  name={p.name}
                  region={p.category || 'Cellar'}
                  year="2019"
                  price={`₹${p.price.toFixed(0)}`}
                  tone={toneFor(p.id)}
                  imageUrl={p.imageUrl}
                />
              ))}
            </ScrollView>
          </View>
        )}

          </>
        )}

        {/* Footnote */}
        <View style={styles.footnote}>
          <Text style={styles.footText}>Kitchen open · {closesAt}</Text>
          <Text style={styles.footText}>All charges to folio</Text>
        </View>

      </ScrollView>

      {/* DOCK OBSCURATION FADE */}
      <LinearGradient
        colors={['transparent', 'rgba(8,7,10,0.85)', Luxe.obsidian]}
        locations={[0, 0.5, 0.85]}
        pointerEvents="none"
        style={styles.dockFade}
      />

      {/* FLOATING CART BAR */}
      {cart.length > 0 && (
        <View style={styles.cartWrap} pointerEvents="box-none">
          <CartBar
            count={cartCount}
            total={totalFormatted}
            etaMinutes={cartEta}
            onSend={() => router.push('/(app)/cart')}
          />
        </View>
      )}

      {/* ITEM DETAIL SHEET */}
      <ItemDetailSheet
        item={
          detailItem
            ? {
                id: detailItem.id,
                name: detailItem.name,
                description: detailItem.description,
                price: detailItem.price,
                prepTimeMinutes: detailItem.prepTimeMinutes,
                dietaryTags: detailItem.dietaryTags,
                allergens: detailItem.allergens,
                imageUrl: detailItem.imageUrl,
                tone: toneFor(detailItem.id),
              }
            : null
        }
        initialQty={detailItem ? qtyFor(detailItem.id) || 1 : 1}
        initialNotes={detailItem ? notesFor(detailItem.id) : ''}
        onClose={() => setDetailItem(null)}
        onAdd={(qty, notes) => {
          if (!detailItem) return;
          const existing = qtyFor(detailItem.id);
          if (existing > 0) {
            updateCartItem(detailItem.id, qty, notes);
          } else {
            addToCart({
              menuItemId: detailItem.id,
              name: detailItem.name,
              quantity: qty,
              unitPrice: detailItem.price,
              notes,
              imageUrl: detailItem.imageUrl,
            });
          }
          setDetailItem(null);
        }}
      />
    </View>
  );
}

/* ─────────────────────────── search & filters ─────────────────────────── */

function FilterChip({
  label,
  icon,
  vegDot,
  active,
  onPress,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  vegDot?: boolean;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={[filterStyles.chip, active && filterStyles.chipActive]}
    >
      {vegDot ? (
        <View style={filterStyles.vegBox}>
          <View style={filterStyles.vegDot} />
        </View>
      ) : icon ? (
        <Ionicons name={icon} size={12} color={active ? Luxe.goldBright : Luxe.titanium} />
      ) : null}
      <Text style={[filterStyles.chipText, active && filterStyles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const filterStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: 'rgba(21,19,15,0.6)',
  },
  chipActive: {
    borderColor: 'rgba(244,201,126,0.5)',
    backgroundColor: 'rgba(244,201,126,0.12)',
  },
  chipText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10.5,
    color: Luxe.ivoryDim,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  chipTextActive: { color: Luxe.goldBright },
  vegBox: {
    width: 13,
    height: 13,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#5BA85B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#5BA85B' },
});

/* ─────────────────────────── live elements ─────────────────────────── */

function PulsingDot({ color = Luxe.goldBright, size = 7 }: { color?: string; size?: number }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.6, 0.15, 0] });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ scale: ringScale }],
          opacity: ringOpacity,
        }}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: Luxe.amberGlow,
          shadowOpacity: 0.8,
          shadowRadius: 4,
        }}
      />
    </View>
  );
}

function LiveServiceStrip({ etaMinutes }: { etaMinutes: number }) {
  return (
    <View style={liveStyles.strip}>
      <LinearGradient
        colors={['rgba(244,201,126,0.12)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
      />
      <View style={liveStyles.stripLead}>
        <PulsingDot />
        <Text style={liveStyles.stripLive}>Kitchen live</Text>
      </View>
      <View style={liveStyles.stripStats}>
        <LiveStat value={`~${etaMinutes}`} unit="min" label="Avg" />
        <View style={liveStyles.stripDivider} />
        <LiveStat value="7" label="In the pass" />
        <View style={liveStyles.stripDivider} />
        <LiveStat value="On call" label="Sommelier" />
      </View>
    </View>
  );
}

function LiveStat({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <View style={liveStyles.stat}>
      <Text style={liveStyles.statValue}>
        {value}
        {unit ? <Text style={liveStyles.statUnit}>{unit}</Text> : null}
      </Text>
      <Text style={liveStyles.statLabel}>{label}</Text>
    </View>
  );
}

const TICKER_FEED: { suite: string; dish: string; ago: string }[] = [
  { suite: '1612', dish: 'Charcoal-seared wagyu', ago: 'just now' },
  { suite: '0907', dish: 'Truffle tagliatelle', ago: '2 min ago' },
  { suite: '1405', dish: 'Yuzu cheesecake', ago: '4 min ago' },
  { suite: '2011', dish: 'Old fashioned, smoked', ago: '6 min ago' },
  { suite: '1208', dish: 'Miso black cod', ago: '8 min ago' },
];

function KitchenTicker() {
  const [idx, setIdx] = useState(0);
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(anim, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => {
        setIdx((i) => (i + 1) % TICKER_FEED.length);
        Animated.timing(anim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
      });
    }, 2800);
    return () => clearInterval(id);
  }, [anim]);

  const entry = TICKER_FEED[idx]!;
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });

  return (
    <View style={liveStyles.tickerWrap}>
      <View style={liveStyles.tickerCard}>
        <LinearGradient
          colors={['rgba(139,111,71,0.16)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
        />
        <View style={liveStyles.tickerBadge}>
          <PulsingDot size={6} />
          <Text style={liveStyles.tickerBadgeText}>From the pass</Text>
        </View>
        <Animated.View style={[liveStyles.tickerRow, { opacity: anim, transform: [{ translateY }] }]}>
          <Ionicons name="restaurant-outline" size={13} color={Luxe.gold} />
          <Text style={liveStyles.tickerText} numberOfLines={1}>
            <Text style={liveStyles.tickerSuite}>Suite {entry.suite}</Text>
            {`  ${entry.dish}`}
          </Text>
          <Text style={liveStyles.tickerAgo}>{entry.ago}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const liveStyles = StyleSheet.create({
  strip: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.2)',
    backgroundColor: 'rgba(21,19,15,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stripLead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  stripLive: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.goldBright,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  stripStats: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  stat: { alignItems: 'center', paddingHorizontal: 10 },
  statValue: { fontFamily: LuxeFonts.serif, fontSize: 16, color: Luxe.ivory, letterSpacing: -0.3 },
  statUnit: { fontFamily: LuxeFonts.monoMedium, fontSize: 9, color: Luxe.gold },
  statLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 7.5,
    color: Luxe.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  stripDivider: { width: StyleSheet.hairlineWidth, height: 26, backgroundColor: Luxe.hairlineStrong },

  tickerWrap: { paddingHorizontal: 20, marginTop: 24 },
  tickerCard: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: 'rgba(18,16,12,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  tickerBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tickerBadgeText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8.5,
    color: Luxe.titanium,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  tickerRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tickerText: { flex: 1, fontFamily: LuxeFonts.sansLight, fontSize: 12.5, color: Luxe.ivoryDim },
  tickerSuite: { fontFamily: LuxeFonts.monoMedium, fontSize: 11, color: Luxe.gold, letterSpacing: 0.4 },
  tickerAgo: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8.5,
    color: Luxe.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});

function prettify(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function titleForCategory(c: string): string {
  const map: Record<string, string> = {
    chef_specials: "Chef's table",
    mains: 'On tonight',
    beverage: 'From the bar',
    drinks: 'From the bar',
    dessert: 'To finish',
    breakfast: 'In the morning',
    late_night: 'After hours',
  };
  return map[c] ?? 'On tonight';
}

function splitChef(name: string): { name: string; italic?: string } {
  const split = splitItalic(name);
  return { name: split.head, italic: split.italic };
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },
  center: { alignItems: 'center', justifyContent: 'center' },
  railScroll: { flexGrow: 0 },

  // SEARCH + CART
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 18,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: 'rgba(21,19,15,0.7)',
  },
  searchInput: {
    flex: 1,
    fontFamily: LuxeFonts.sans,
    fontSize: 14,
    color: Luxe.ivory,
    padding: 0,
  },
  cartBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.3)',
    backgroundColor: 'rgba(244,201,126,0.08)',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: Luxe.goldBright,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Luxe.obsidian,
  },
  cartBadgeText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: '#1A1206',
    letterSpacing: -0.2,
  },
  filterRow: { gap: 9, paddingHorizontal: 20, paddingTop: 14 },

  emptyResults: { alignItems: 'center', paddingTop: 30, paddingHorizontal: 40, gap: 10 },
  emptyTitle: { fontFamily: LuxeFonts.serif, fontSize: 19, color: Luxe.ivoryDim, letterSpacing: -0.3 },
  emptySub: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 13,
    color: Luxe.muted,
    textAlign: 'center',
    lineHeight: 19,
  },
  menuRowWrap: {
    borderBottomWidth: 0.5,
    borderBottomColor: Luxe.hairlineStrong,
    paddingTop: 18,
  },
  footnote: {
    marginTop: 40,
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
  dockFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
    pointerEvents: 'none',
  },
  cartWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 110,
  },
});
