import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { BootSpinner } from '@/components/BootSpinner';
import { FloatingTabBar } from '@/components/navigation/FloatingTabBar';
import { usePlanStoreHydrated } from '@/hooks/usePlanStoreHydrated';
import { getPostAuthRoute, hasCompletedPreferences } from '@/lib/routing';
import { usePlanStore } from '@/store/usePlanStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { hasCompletedOnboarding, useUserStore } from '@/store/useUserStore';
import { onboardingColors } from '@/constants/onboardingTokens';

export default function TabsLayout() {
  const router = useRouter();
  const hobbies = usePlanStore((s) => s.hobbies);
  const cloudHydrationStatus = usePlanStore((s) => s.cloudHydrationStatus);
  const preferences = usePreferencesStore((s) => s.preferences);
  const completedOnboardingAt = useUserStore((s) => s.completedOnboardingAt);
  const username = useUserStore((s) => s.username);
  const userHydrationStatus = useUserStore((s) => s.hydrationStatus);
  const storeHydrated = usePlanStoreHydrated();

  const onboardingComplete = hasCompletedOnboarding(completedOnboardingAt);
  const waitingForCloud =
    !onboardingComplete && hobbies.length === 0 && cloudHydrationStatus === 'loading';
  const waitingForUser = userHydrationStatus === 'loading';

  useEffect(() => {
    if (!storeHydrated || waitingForCloud || waitingForUser) return;

    const route = getPostAuthRoute({
      username,
      completedOnboardingAt,
      hasPreferences: hasCompletedPreferences(preferences),
      hasHobbies: hobbies.length > 0,
    });

    if (route !== '/(app)/(tabs)') {
      router.replace(route as never);
    }
  }, [
    completedOnboardingAt,
    hobbies.length,
    preferences,
    router,
    storeHydrated,
    username,
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
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: onboardingColors.background },
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 90,
          position: 'absolute',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Roadmap', tabBarLabel: 'Roadmap' }} />
      <Tabs.Screen name="feed" options={{ title: 'Feed', tabBarLabel: 'Feed' }} />
      <Tabs.Screen name="generate" options={{ title: 'Generation', tabBarLabel: 'Generation' }} />
      <Tabs.Screen name="courses" options={{ title: 'Courses', tabBarLabel: 'Courses' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarLabel: 'Profile' }} />
      {/* Keep file for deep links / old Progress tab redirects if needed */}
      <Tabs.Screen name="progress" options={{ href: null }} />
    </Tabs>
  );
}
