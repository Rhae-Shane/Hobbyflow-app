import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';
import { fetchUser } from '@/services/profile';
import { useUserStore } from '@/store/useUserStore';

const log = createLogger('hydrate-user');

export function useHydrateUser(userId: string | undefined, isAuthenticated: boolean) {
  const setCompletedOnboardingAt = useUserStore((s) => s.setCompletedOnboardingAt);
  const setProfileFields = useUserStore((s) => s.setProfileFields);
  const setHydrationStatus = useUserStore((s) => s.setHydrationStatus);

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
          isProfilePublic: row?.is_profile_public ?? true,
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
}
