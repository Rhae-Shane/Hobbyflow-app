import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { BootSpinner } from '@/components/BootSpinner';
import { AppChromeHeader } from '@/components/navigation/AppChromeHeader';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useIsUserHydrated } from '@/hooks/useIsUserHydrated';
import { hasCompletedOnboarding, useUserStore } from '@/store/useUserStore';

/**
 * App stack (outside floating tabs):
 * - welcome, preferences, claim-username → first-run only
 * - roadmap-creation → redirects to Generation tab
 * - onboarding → legacy redirect
 * - roadmap-preview/[id] → after CREATE ROADMAP
 * - roadmap/[id] → learning-path detail (from Home / Courses)
 * - (tabs) → Home | Feed | Generation (roadmap creation chat) | Profile via avatar
 * - technique/[techniqueId] → detail
 */
function isFirstRunOnlySegment(segments: string[]): boolean {
  const leaf = String(segments[segments.length - 1] ?? '');
  return (
    leaf === 'welcome' ||
    leaf === 'preferences' ||
    leaf === 'onboarding' ||
    leaf === 'claim-username'
  );
}

function shouldShowChrome(pathname: string, segments: string[]): boolean {
  if (isFirstRunOnlySegment(segments)) return false;
  // Feed uses the shared chrome header.
  return true;
}

export default function AppLayout() {
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const isUserHydrated = useIsUserHydrated();
  const completedOnboardingAt = useUserStore((s) => s.completedOnboardingAt);
  const username = useUserStore((s) => s.username);
  const showChrome = shouldShowChrome(pathname, segments as string[]);

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
      isFirstRunOnlySegment(segments as string[]) &&
      !onClaimUsername
    ) {
      router.replace('/(app)/(tabs)' as never);
    }
  }, [completedOnboardingAt, isUserHydrated, router, segments, user, username]);

  if (isLoading || !user) {
    return <BootSpinner />;
  }

  return (
    <View style={styles.root}>
      {showChrome ? <AppChromeHeader /> : null}
      <View style={styles.stack}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="claim-username" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="preferences" />
          <Stack.Screen name="roadmap-creation" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="roadmap-preview/[id]" />
          <Stack.Screen name="roadmap/[id]" />
          <Stack.Screen name="technique/[techniqueId]" />
          <Stack.Screen name="streak" />
          <Stack.Screen name="leaderboard" />
          <Stack.Screen name="daily-tasks" />
          <Stack.Screen name="my-posts" />
          <Stack.Screen name="pact" />
          <Stack.Screen name="search" />
          <Stack.Screen name="u/[username]" />
          <Stack.Screen name="post/[id]" />
        </Stack>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  stack: {
    flex: 1,
  },
});
