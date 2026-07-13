import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';
import { fetchUser } from '@/services/profile';
import { completeOnboarding } from '@/services/user';
import { usePlanStore } from '@/store/usePlanStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { useUserStore } from '@/store/useUserStore';
import { hasCompletedPreferences } from '@/types/preferences.types';

const log = createLogger('hydrate-user');

export function useHydrateUser(userId: string | undefined, isAuthenticated: boolean) {
  const setCompletedOnboardingAt = useUserStore((s) => s.setCompletedOnboardingAt);
  const setProfileFields = useUserStore((s) => s.setProfileFields);
  const setHydrationStatus = useUserStore((s) => s.setHydrationStatus);
  const hobbies = usePlanStore((s) => s.hobbies);
  const cloudHydrationStatus = usePlanStore((s) => s.cloudHydrationStatus);
  const preferences = usePreferencesStore((s) => s.preferences);
  const preferencesHydrationStatus = usePreferencesStore((s) => s.hydrationStatus);
  const completedOnboardingAt = useUserStore((s) => s.completedOnboardingAt);
  const userHydrationStatus = useUserStore((s) => s.hydrationStatus);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setHydrationStatus('idle');
      return;
    }

    let cancelled = false;

    log.debug('Hydrating user row from cloud', { userId });
    setHydrationStatus('loading');

    fetchUser(userId)
      .then((row) => {
        if (cancelled) return;
        setCompletedOnboardingAt(row?.completed_onboarding_at ?? null);
        setProfileFields({
          username: row?.username ?? null,
          bio: row?.bio ?? '',
        });
        log.info('User row hydrated', {
          userId,
          completedOnboarding: Boolean(row?.completed_onboarding_at),
          hasUsername: Boolean(row?.username),
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        log.warn('User hydrate failed', {
          userId,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      })
      .finally(() => {
        if (!cancelled) {
          setHydrationStatus('done');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, setCompletedOnboardingAt, setHydrationStatus, setProfileFields, userId]);

  // Backfill cloud flag when prefs or hobbies are done but completed_onboarding_at is still null.
  // Wait for user hydrate first so a stale fetch can't wipe a just-written flag.
  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    if (userHydrationStatus !== 'done') return;
    if (completedOnboardingAt) return;

    const prefsDone =
      preferencesHydrationStatus === 'done' && hasCompletedPreferences(preferences);
    const hobbiesDone = cloudHydrationStatus === 'done' && hobbies.length > 0;
    if (!prefsDone && !hobbiesDone) return;

    let cancelled = false;
    void completeOnboarding(userId)
      .then(() => {
        if (cancelled) return;
        setCompletedOnboardingAt(new Date().toISOString());
        log.info('Backfilled completed_onboarding_at', {
          userId,
          reason: prefsDone ? 'preferences' : 'hobbies',
        });
      })
      .catch((err: unknown) => {
        log.warn('Onboarding backfill failed', {
          userId,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [
    cloudHydrationStatus,
    completedOnboardingAt,
    hobbies.length,
    isAuthenticated,
    preferences,
    preferencesHydrationStatus,
    setCompletedOnboardingAt,
    userHydrationStatus,
    userId,
  ]);
}
