import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { BootSpinner } from '@/components/BootSpinner';
import { useAuth } from '@/hooks/useAuth';
import { usePlanStoreHydrated } from '@/hooks/usePlanStoreHydrated';
import { getPostAuthRoute, hasCompletedPreferences } from '@/lib/routing';
import { usePlanStore } from '@/store/usePlanStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { useUserStore } from '@/store/useUserStore';

export default function AuthLayout() {
  const router = useRouter();
  const { user } = useAuth();
  const plan = usePlanStore((s) => s.plan);
  const hobbies = usePlanStore((s) => s.hobbies);
  const cloudHydrationStatus = usePlanStore((s) => s.cloudHydrationStatus);
  const preferences = usePreferencesStore((s) => s.preferences);
  const preferencesHydrationStatus = usePreferencesStore((s) => s.hydrationStatus);
  const completedOnboardingAt = useUserStore((s) => s.completedOnboardingAt);
  const userHydrationStatus = useUserStore((s) => s.hydrationStatus);
  const storeHydrated = usePlanStoreHydrated();

  const waitingForCloudPlan = Boolean(
    user && hobbies.length === 0 && !plan && cloudHydrationStatus === 'loading',
  );
  const waitingForPreferences = Boolean(
    user && preferencesHydrationStatus === 'loading',
  );
  const waitingForUser = Boolean(user && userHydrationStatus === 'loading');

  useEffect(() => {
    if (!user || !storeHydrated || waitingForCloudPlan || waitingForPreferences || waitingForUser) {
      return;
    }
    router.replace(
      getPostAuthRoute({
        completedOnboardingAt,
        hasPreferences: hasCompletedPreferences(preferences),
        hasHobbies: hobbies.length > 0,
      }),
    );
  }, [
    completedOnboardingAt,
    plan,
    preferences,
    preferencesHydrationStatus,
    router,
    storeHydrated,
    user,
    waitingForCloudPlan,
    waitingForPreferences,
    waitingForUser,
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
