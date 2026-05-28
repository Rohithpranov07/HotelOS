import { useEffect } from 'react';
import { Redirect, Tabs } from 'expo-router';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { registerStaffNotifications, registerPushToken } from '../../src/lib/notifications';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../../src/stores/auth.store';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';

type StaffTab = 'tasks' | 'guests' | 'alerts';

const ICONS: Record<StaffTab, keyof typeof Ionicons.glyphMap> = {
  tasks: 'list-outline',
  guests: 'people-outline',
  alerts: 'notifications-outline',
};

const LABELS: Record<StaffTab, string> = {
  tasks: 'Tasks',
  guests: 'Guests',
  alerts: 'Alerts',
};

const HIDDEN_ON: ReadonlySet<string> = new Set(['task', 'guest']);

function StaffDock({ state, navigation }: BottomTabBarProps) {
  const currentRoute = state.routes[state.index]?.name;
  if (currentRoute && HIDDEN_ON.has(currentRoute)) return null;
  const visible = state.routes.filter((r) => r.name in ICONS);

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={styles.dock}>
        <View style={styles.tint} />
        <LinearGradient
          colors={['transparent', 'rgba(244,201,126,0.30)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topHairline}
        />
        <View style={styles.border} pointerEvents="none" />

        <View style={styles.row}>
          {visible.map((route) => {
            const kind = route.name as StaffTab;
            const idx = state.routes.findIndex((r) => r.key === route.key);
            const active = state.index === idx;
            const onPress = (_e: GestureResponderEvent) => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!active && !event.defaultPrevented) navigation.navigate(route.name);
            };
            return (
              <Pressable key={route.key} onPress={onPress} style={styles.item} hitSlop={6}>
                <View style={[styles.activeDot, { opacity: active ? 1 : 0 }]} />
                <Ionicons
                  name={ICONS[kind]}
                  size={22}
                  color={active ? Luxe.goldBright : Luxe.titanium}
                />
                <Text
                  style={[styles.label, { color: active ? Luxe.goldBright : Luxe.muted }]}
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

export default function StaffLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const staffUser = useAuthStore((s) => s.staffUser);

  useEffect(() => {
    if (!staffUser) return;
    const cleanup = registerStaffNotifications();
    void registerPushToken(staffUser.id);
    return cleanup;
  }, [staffUser?.id]);

  if (!isAuthenticated) return <Redirect href="/(auth)/splash" />;
  if (!staffUser) return <Redirect href="/(app)/home" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Luxe.obsidian },
      }}
      tabBar={(props) => <StaffDock {...props} />}
    >
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="guests" />
      <Tabs.Screen name="alerts" />
      <Tabs.Screen name="task" options={{ href: null }} />
      <Tabs.Screen name="guest" options={{ href: null }} />
    </Tabs>
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
  },
  activeDot: {
    position: 'absolute',
    top: -1,
    width: 4,
    height: 4,
    borderRadius: 9999,
    backgroundColor: Luxe.goldBright,
  },
  label: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8.5,
    letterSpacing: 1.2,
    fontWeight: '500',
  },
});
