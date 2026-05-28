import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

export default function ServicesScreen() {
  void useLuxeFonts();
  const router = useRouter();
  const apiMenu = useOrdersStore((s) => s.menu);
  const loading = useOrdersStore((s) => s.menuLoading);
  const fetchMenu = useOrdersStore((s) => s.fetchMenu);
  // Fallback to DEMO_MENU when API returns empty so the UI is always populated.
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

  // Chef's pick swaps per active category — first item in that category,
  // falling back to recommended/global first so the card never goes empty.
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
          onBack={() => router.push('/(app)/home')}
        />

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
                />
              ))}
            </ScrollView>
          </View>
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
            });
          }
          setDetailItem(null);
        }}
      />
    </View>
  );
}

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
  emptyWrap: { paddingTop: 60, alignItems: 'center', gap: 8 },
  empty: {
    fontFamily: LuxeFonts.serifItalic,
    fontSize: 17,
    color: Luxe.titanium,
  },
  emptySub: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.muted,
    letterSpacing: 1.6,
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
