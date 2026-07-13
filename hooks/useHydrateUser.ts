import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';
import { fetchUser } from '@/services/profile';
import { completeOnboarding } from '@/services/user';
import { usePlanStore } from '@/store/usePlanStore';
import { useUserStore } from '@/store/useUserStore';

const log = createLogger('hydrate-user');

export function useHydrateUser(userId: string | undefined, isAuthenticated: boolean) {
  const setCompletedOnboardingAt = useUserStore((s) => s.setCompletedOnboardingAt);
  const setProfileFields = useUserStore((s) => s.setProfileFields);
  const setHydrationStatus = useUserStore((s) => s.setHydrationStatus);
  const hobbies = usePlanStore((s) => s.hobbies);
  const cloudHydrationStatus = usePlanStore((s) => s.cloudHydrationStatus);
  const completedOnboardingAt = useUserStore((s) => s.completedOnboardingAt);

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

  // Backfill cloud flag for users who already have hobbies but never got completed_onboarding_at.
  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    if (cloudHydrationStatus !== 'done') return;
    if (completedOnboardingAt) return;
    if (hobbies.length === 0) return;

    let cancelled = false;
    void completeOnboarding(userId)
      .then(() => {
        if (cancelled) return;
        setCompletedOnboardingAt(new Date().toISOString());
        log.info('Backfilled completed_onboarding_at for existing hobby user', { userId });
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
    setCompletedOnboardingAt,
    userId,
  ]);
}
