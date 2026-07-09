import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { BootSpinner } from '@/components/BootSpinner';
import { useAuth } from '@/hooks/useAuth';
import { usePlanStoreHydrated } from '@/hooks/usePlanStoreHydrated';
import { getPostAuthRoute, hasCompletedPreferences } from '@/lib/routing';
import { usePlanStore } from '@/store/usePlanStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';

export default function AuthLayout() {
  const router = useRouter();
  const { user } = useAuth();
  const plan = usePlanStore((s) => s.plan);
  const cloudHydrationStatus = usePlanStore((s) => s.cloudHydrationStatus);
  const preferences = usePreferencesStore((s) => s.preferences);
  const preferencesHydrationStatus = usePreferencesStore((s) => s.hydrationStatus);
  const storeHydrated = usePlanStoreHydrated();

  const waitingForCloudPlan = Boolean(user && !plan && cloudHydrationStatus === 'loading');
  const waitingForPreferences = Boolean(
    user && preferencesHydrationStatus === 'loading',
  );

  useEffect(() => {
    if (!user || !storeHydrated || waitingForCloudPlan || waitingForPreferences) return;
    router.replace(
      getPostAuthRoute({
        hasPreferences: hasCompletedPreferences(preferences),
        hasPlan: Boolean(plan),
      }),
    );
  }, [
    plan,
    preferences,
    preferencesHydrationStatus,
    router,
    storeHydrated,
    user,
    waitingForCloudPlan,
    waitingForPreferences,
  ]);

  if (user) {
    return <BootSpinner />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
