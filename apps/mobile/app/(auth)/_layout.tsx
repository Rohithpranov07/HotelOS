import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { Luxe } from '../../src/theme/luxe';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const staffUser = useAuthStore((s) => s.staffUser);
  if (isAuthenticated)
    return <Redirect href={staffUser ? '/(staff)/tasks' : '/(app)/home'} />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Luxe.obsidian },
        animation: 'fade',
      }}
    />
  );
}
