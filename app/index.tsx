import { Redirect } from 'expo-router';
import { BootSpinner } from '@/components/BootSpinner';
import { useAuth } from '@/hooks/useAuth';
import { usePlanStoreHydrated } from '@/hooks/usePlanStoreHydrated';
import { usePlanStore } from '@/store/usePlanStore';

export default function Index() {
  const { user, isLoading: authLoading } = useAuth();
  const plan = usePlanStore((s) => s.plan);
  const cloudHydrationStatus = usePlanStore((s) => s.cloudHydrationStatus);
  const storeHydrated = usePlanStoreHydrated();

  const waitingForCloudPlan = Boolean(user && !plan && cloudHydrationStatus === 'loading');

  if (authLoading || !storeHydrated || waitingForCloudPlan) {
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
