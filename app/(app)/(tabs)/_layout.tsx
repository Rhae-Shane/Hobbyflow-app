import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { BootSpinner } from '@/components/BootSpinner';
import { usePlanStoreHydrated } from '@/hooks/usePlanStoreHydrated';
import { getPostAuthRoute, hasCompletedPreferences } from '@/lib/routing';
import { usePlanStore } from '@/store/usePlanStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { hasCompletedOnboarding, useUserStore } from '@/store/useUserStore';
import { colors } from '@/constants/tokens';

export default function TabsLayout() {
  const router = useRouter();
  const hobbies = usePlanStore((s) => s.hobbies);
  const cloudHydrationStatus = usePlanStore((s) => s.cloudHydrationStatus);
  const preferences = usePreferencesStore((s) => s.preferences);
  const completedOnboardingAt = useUserStore((s) => s.completedOnboardingAt);
  const userHydrationStatus = useUserStore((s) => s.hydrationStatus);
  const storeHydrated = usePlanStoreHydrated();

  const onboardingComplete = hasCompletedOnboarding(completedOnboardingAt);
  const waitingForCloud =
    !onboardingComplete && hobbies.length === 0 && cloudHydrationStatus === 'loading';
  const waitingForUser = userHydrationStatus === 'loading';

  useEffect(() => {
    if (!storeHydrated || waitingForCloud || waitingForUser) return;
    if (hasCompletedOnboarding(completedOnboardingAt)) return;

    const route = getPostAuthRoute({
      completedOnboardingAt,
      hasPreferences: hasCompletedPreferences(preferences),
      hasHobbies: hobbies.length > 0,
    });

    if (route !== '/(app)/(tabs)') {
      router.replace(route);
    }
  }, [
    completedOnboardingAt,
    hobbies.length,
    preferences,
    router,
    storeHydrated,
    waitingForCloud,
    waitingForUser,
  ]);

  if (!storeHydrated || waitingForUser) {
    return <BootSpinner />;
  }

  if (!onboardingComplete && (waitingForCloud || hobbies.length === 0)) {
    return <BootSpinner />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Roadmap' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
    </Tabs>
  );
}
