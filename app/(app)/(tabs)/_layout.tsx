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
import { learnInPublic } from '@/constants/learnInPublic';

export default function TabsLayout() {
  const router = useRouter();
  const hobbies = usePlanStore((s) => s.hobbies);
  const cloudHydrationStatus = usePlanStore((s) => s.cloudHydrationStatus);
  const preferences = usePreferencesStore((s) => s.preferences);
  const preferencesHydrationStatus = usePreferencesStore((s) => s.hydrationStatus);
  const completedOnboardingAt = useUserStore((s) => s.completedOnboardingAt);
  const username = useUserStore((s) => s.username);
  const userHydrationStatus = useUserStore((s) => s.hydrationStatus);
  const storeHydrated = usePlanStoreHydrated();

  const onboardingComplete = hasCompletedOnboarding(completedOnboardingAt);
  const preferencesDone = hasCompletedPreferences(preferences);
  const waitingForCloud =
    !onboardingComplete && !preferencesDone && hobbies.length === 0 && cloudHydrationStatus !== 'done';
  const waitingForUser = userHydrationStatus !== 'done';
  const waitingForPreferences = preferencesHydrationStatus !== 'done';

  useEffect(() => {
    if (!storeHydrated || waitingForCloud || waitingForUser || waitingForPreferences) return;

    const route = getPostAuthRoute({
      username,
      completedOnboardingAt,
      hasPreferences: preferencesDone,
      hasHobbies: hobbies.length > 0,
    });

    if (route !== '/(app)/(tabs)') {
      router.replace(route as never);
    }
  }, [
    completedOnboardingAt,
    hobbies.length,
    preferencesDone,
    router,
    storeHydrated,
    username,
    waitingForCloud,
    waitingForPreferences,
    waitingForUser,
  ]);

  if (!storeHydrated || waitingForUser || waitingForPreferences) {
    return <BootSpinner />;
  }

  if (!onboardingComplete && !preferencesDone && (waitingForCloud || hobbies.length === 0)) {
    return <BootSpinner />;
  }

  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: onboardingColors.background },
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          // Height comes from FloatingTabBar + safe-area padding (button vs gesture nav).
          position: 'absolute',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarLabel: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarLabel: 'Explore' }} />
      <Tabs.Screen name="generate" options={{ title: 'Generation', tabBarLabel: 'Generation' }} />
      <Tabs.Screen
        name="feed"
        options={{ title: learnInPublic.tabLabel, tabBarLabel: learnInPublic.tabLabel }}
      />
      {/* Courses / all roadmaps — opened via Home “See all”, not the tab bar */}
      <Tabs.Screen name="courses" options={{ href: null }} />
      {/* Profile opens from home header avatar, not the tab bar */}
      <Tabs.Screen name="profile" options={{ href: null }} />
      {/* Keep file for deep links / old Progress tab redirects if needed */}
      <Tabs.Screen name="progress" options={{ href: null }} />
    </Tabs>
  );
}
