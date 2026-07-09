import { Stack, useGlobalSearchParams, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { BootSpinner } from '@/components/BootSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useIsUserHydrated } from '@/hooks/useIsUserHydrated';
import { hasCompletedOnboarding, useUserStore } from '@/store/useUserStore';

function isOnboardingFlowSegment(segments: string[]): boolean {
  const leaf = segments[segments.length - 1];
  return leaf === 'preferences' || leaf === 'onboarding';
}

export default function AppLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { mode } = useGlobalSearchParams<{ mode?: string }>();
  const isAddHobbyMode = mode === 'add';
  const { user, isLoading } = useAuth();
  const isUserHydrated = useIsUserHydrated();
  const completedOnboardingAt = useUserStore((s) => s.completedOnboardingAt);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/(auth)');
    }
  }, [isLoading, router, user]);

  useEffect(() => {
    if (!user || !isUserHydrated) return;

    if (
      hasCompletedOnboarding(completedOnboardingAt) &&
      isOnboardingFlowSegment(segments) &&
      !isAddHobbyMode
    ) {
      router.replace('/(app)/(tabs)');
    }
  }, [completedOnboardingAt, isAddHobbyMode, isUserHydrated, router, segments, user]);

  if (isLoading || !user) {
    return <BootSpinner />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="preferences" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="technique/[techniqueId]" />
    </Stack>
  );
}
