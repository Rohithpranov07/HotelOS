import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const staffUser = useAuthStore((s) => s.staffUser);
  if (isAuthenticated)
    return <Redirect href={staffUser ? '/(staff)/tasks' : '/(app)/home'} />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
        animation: 'slide_from_right',
      }}
    />
  );
}
