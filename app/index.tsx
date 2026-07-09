import { Redirect } from 'expo-router';
import { BootSpinner } from '@/components/BootSpinner';
import { useAuth } from '@/hooks/useAuth';
import { usePlanStoreHydrated } from '@/hooks/usePlanStoreHydrated';
import { usePlanStore } from '@/store/usePlanStore';

export default function Index() {
  const { user, isLoading: authLoading } = useAuth();
  const plan = usePlanStore((s) => s.plan);
  const storeHydrated = usePlanStoreHydrated();

  if (authLoading || !storeHydrated) {
    return <BootSpinner />;
  }

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  if (!plan) {
    return <Redirect href="/(app)/onboarding" />;
  }

  return <Redirect href="/(app)/(tabs)" />;
}
