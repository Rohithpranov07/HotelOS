import { Redirect, Tabs } from 'expo-router';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../../src/stores/auth.store';
import { ServiceFeedbackHost } from '../../src/components/luxe/ServiceFeedbackHost';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';

type DockKind = 'home' | 'services' | 'key' | 'concierge' | 'account';

const ICONS: Record<DockKind, keyof typeof Ionicons.glyphMap> = {
  home: 'home-outline',
  services: 'restaurant-outline',
  key: 'key-outline',
  concierge: 'chatbubble-ellipses-outline',
  account: 'person-outline',
};

const LABELS: Record<DockKind, string> = {
  home: 'Home',
  services: 'Services',
  key: 'Key',
  concierge: 'Concierge',
  account: 'Account',
};

const HIDDEN_ON: ReadonlySet<string> = new Set([
  'housekeeping',
  'dining',
  'other-services',
  'complaints',
  'cart',
  'orders',
  'order-confirmation',
  'checkin',
  'concierge',
  'loyalty',
  'feedback',
  'checkout-complete',
  'discover',
]);

function FloatingDock({ state, navigation }: BottomTabBarProps) {
  const currentRoute = state.routes[state.index]?.name;
  if (currentRoute && HIDDEN_ON.has(currentRoute)) return null;
  const visibleRoutes = state.routes.filter((r) => r.name in ICONS);

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={styles.dock}>
        {/* glass tint */}
        <View style={styles.tint} />
        {/* gold hairline top edge */}
        <LinearGradient
          colors={['transparent', 'rgba(244,201,126,0.30)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topHairline}
        />
        {/* border */}
        <View style={styles.border} pointerEvents="none" />

        <View style={styles.row}>
          {visibleRoutes.map((route) => {
            const kind = route.name as DockKind;
            const routeIndex = state.routes.findIndex((r) => r.key === route.key);
            const isActive = state.index === routeIndex;

            const onPress = (_e: GestureResponderEvent) => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isActive && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const color = isActive ? Luxe.goldBright : Luxe.titanium;
            const labelColor = isActive ? Luxe.goldBright : Luxe.muted;

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={styles.item}
                hitSlop={6}
                android_ripple={null}
              >
                {/* active gold dot */}
                <View
                  style={[
                    styles.activeDot,
                    { opacity: isActive ? 1 : 0 },
                  ]}
                />
                <Ionicons name={ICONS[kind]} size={22} color={color} />
                <Text
                  style={[styles.label, { color: labelColor }]}
                  numberOfLines={1}
                >
                  {LABELS[kind].toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const staffUser = useAuthStore((s) => s.staffUser);
  if (!isAuthenticated) return <Redirect href="/(auth)/splash" />;
  if (staffUser) return <Redirect href="/(staff)/tasks" />;

  return (
    <>
      <Tabs
        backBehavior="history"
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: Luxe.obsidian },
        }}
        tabBar={(props) => <FloatingDock {...props} />}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="services" />
        <Tabs.Screen name="key" />
        <Tabs.Screen name="concierge" />
        <Tabs.Screen name="account" />
        <Tabs.Screen name="housekeeping" options={{ href: null }} />
        <Tabs.Screen name="dining" options={{ href: null }} />
        <Tabs.Screen name="other-services" options={{ href: null }} />
        <Tabs.Screen name="complaints" options={{ href: null }} />
        <Tabs.Screen name="reservation" options={{ href: null }} />
        <Tabs.Screen name="folio" options={{ href: null }} />
        <Tabs.Screen name="cart" options={{ href: null }} />
        <Tabs.Screen name="orders" options={{ href: null }} />
        <Tabs.Screen name="order-confirmation" options={{ href: null }} />
        <Tabs.Screen name="checkin" options={{ href: null }} />
        <Tabs.Screen name="loyalty" options={{ href: null }} />
        <Tabs.Screen name="feedback" options={{ href: null }} />
        <Tabs.Screen name="checkout-complete" options={{ href: null }} />
        <Tabs.Screen name="discover" options={{ href: null }} />
      </Tabs>
      <ServiceFeedbackHost />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === 'ios' ? 22 : 16,
    pointerEvents: 'box-none',
  },
  dock: {
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(18,16,12,0.92)',
    shadowColor: '#000',
    shadowOpacity: 0.85,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 20,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18,16,12,0.65)',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,240,210,0.10)',
  },
  topHairline: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 6,
  },
  item: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    top: -1,
    width: 4,
    height: 4,
    borderRadius: 9999,
    backgroundColor: Luxe.goldBright,
    shadowColor: Luxe.amberGlow,
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  label: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8.5,
    letterSpacing: 1.2,
    fontWeight: '500',
  },
});
