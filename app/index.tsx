import { Redirect } from 'expo-router';
import { BootSpinner } from '@/components/BootSpinner';
import { useAuth } from '@/hooks/useAuth';
import { usePlanStoreHydrated } from '@/hooks/usePlanStoreHydrated';
import { getPostAuthRoute, hasCompletedPreferences } from '@/lib/routing';
import { usePlanStore } from '@/store/usePlanStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';

export default function Index() {
  const { user, isLoading: authLoading } = useAuth();
  const plan = usePlanStore((s) => s.plan);
  const cloudHydrationStatus = usePlanStore((s) => s.cloudHydrationStatus);
  const preferences = usePreferencesStore((s) => s.preferences);
  const preferencesHydrationStatus = usePreferencesStore((s) => s.hydrationStatus);
  const storeHydrated = usePlanStoreHydrated();

  const waitingForCloudPlan = Boolean(user && !plan && cloudHydrationStatus === 'loading');
  const waitingForPreferences = Boolean(
    user && preferencesHydrationStatus === 'loading',
  );

  if (authLoading || !storeHydrated || waitingForCloudPlan || waitingForPreferences) {
    return <BootSpinner />;
  }

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Redirect
      href={getPostAuthRoute({
        hasPreferences: hasCompletedPreferences(preferences),
        hasPlan: Boolean(plan),
      })}
    />
  );
}
