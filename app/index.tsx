import { Redirect } from 'expo-router';
import { BootSpinner } from '@/components/BootSpinner';
import { useAuth } from '@/hooks/useAuth';
import { usePlanStoreHydrated } from '@/hooks/usePlanStoreHydrated';
import { getPostAuthRoute, hasCompletedPreferences } from '@/lib/routing';
import { usePlanStore } from '@/store/usePlanStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { useUserStore } from '@/store/useUserStore';

export default function Index() {
  const { user, isLoading: authLoading } = useAuth();
  const plan = usePlanStore((s) => s.plan);
  const hobbies = usePlanStore((s) => s.hobbies);
  const cloudHydrationStatus = usePlanStore((s) => s.cloudHydrationStatus);
  const preferences = usePreferencesStore((s) => s.preferences);
  const preferencesHydrationStatus = usePreferencesStore((s) => s.hydrationStatus);
  const completedOnboardingAt = useUserStore((s) => s.completedOnboardingAt);
  const username = useUserStore((s) => s.username);
  const userHydrationStatus = useUserStore((s) => s.hydrationStatus);
  const storeHydrated = usePlanStoreHydrated();

  const waitingForCloudPlan = Boolean(
    user && hobbies.length === 0 && !plan && cloudHydrationStatus === 'loading',
  );
  const waitingForPreferences = Boolean(
    user && preferencesHydrationStatus === 'loading',
  );
  const waitingForUser = Boolean(user && userHydrationStatus === 'loading');

  if (
    authLoading ||
    !storeHydrated ||
    waitingForCloudPlan ||
    waitingForPreferences ||
    waitingForUser
  ) {
    return <BootSpinner />;
  }

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Redirect
      href={
        getPostAuthRoute({
          username,
          completedOnboardingAt,
          hasPreferences: hasCompletedPreferences(preferences),
          hasHobbies: hobbies.length > 0,
        }) as never
      }
    />
  );
}
