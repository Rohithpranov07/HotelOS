import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/auth.store';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const staffUser = useAuthStore((s) => s.staffUser);
  if (!isAuthenticated) return <Redirect href="/(auth)/splash" />;
  if (staffUser) return <Redirect href="/(staff)/tasks" />;
  return <Redirect href="/(app)/home" />;
}
