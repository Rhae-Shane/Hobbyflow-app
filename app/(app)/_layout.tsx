import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { BootSpinner } from '@/components/BootSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useIsUserHydrated } from '@/hooks/useIsUserHydrated';
import { hasCompletedOnboarding, useUserStore } from '@/store/useUserStore';

/**
 * App stack (outside floating tabs):
 * - preferences, roadmap-creation, onboarding → first-run only
 * - roadmap-preview/[id] → after CREATE ROADMAP
 * - roadmap/[id] → redirects into Roadmap tab
 * - (tabs) → Roadmap | Feed | Generation | Courses | Profile
 * - technique/[techniqueId] → detail
 */
function isFirstRunOnlySegment(segments: string[]): boolean {
  const leaf = String(segments[segments.length - 1] ?? '');
  return (
    leaf === 'preferences' ||
    leaf === 'roadmap-creation' ||
    leaf === 'onboarding' ||
    leaf === 'claim-username'
  );
}

export default function AppLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { user, isLoading } = useAuth();
  const isUserHydrated = useIsUserHydrated();
  const completedOnboardingAt = useUserStore((s) => s.completedOnboardingAt);
  const username = useUserStore((s) => s.username);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/(auth)');
    }
  }, [isLoading, router, user]);

  useEffect(() => {
    if (!user || !isUserHydrated) return;

    const leaf = String(segments[segments.length - 1] ?? '');
    const onClaimUsername = leaf === 'claim-username';

    if (!username && !onClaimUsername) {
      router.replace('/(app)/claim-username' as never);
      return;
    }

    if (
      username &&
      hasCompletedOnboarding(completedOnboardingAt) &&
      isFirstRunOnlySegment(segments) &&
      !onClaimUsername
    ) {
      router.replace('/(app)/(tabs)' as never);
    }
  }, [completedOnboardingAt, isUserHydrated, router, segments, user, username]);

  if (isLoading || !user) {
    return <BootSpinner />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="claim-username" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="roadmap-creation" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="roadmap-preview/[id]" />
      <Stack.Screen name="roadmap/[id]" />
      <Stack.Screen name="technique/[techniqueId]" />
      <Stack.Screen name="streak" />
      <Stack.Screen name="daily-tasks" />
      <Stack.Screen name="pact" />
      <Stack.Screen name="search" />
      <Stack.Screen name="u/[username]" />
      <Stack.Screen name="post/compose" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
