import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';
import { fetchUserHobbies } from '@/services/hobbies';
import { fetchUserPlan } from '@/services/userState';
import { usePlanStore } from '@/store/usePlanStore';

const log = createLogger('hydrate');

export function useHydrateUserPlan(userId: string | undefined, isAuthenticated: boolean) {
  const hydrateFromCloud = usePlanStore((s) => s.hydrateFromCloud);
  const setCloudHydrationStatus = usePlanStore((s) => s.setCloudHydrationStatus);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setCloudHydrationStatus('idle');
      return;
    }

    let cancelled = false;

    log.debug('Hydrating plan from cloud', { userId });
    setCloudHydrationStatus('loading');

    Promise.all([fetchUserHobbies(userId), fetchUserPlan(userId)])
      .then(([hobbies, row]) => {
        if (cancelled) return;

        if (hobbies.length === 0) {
          log.info('No hobbies found for user', { userId });
          return;
        }

        const activeHobby = hobbies.find((h) => h.is_active) ?? hobbies[0];

        hydrateFromCloud({
          hobbies,
          activeHobbyId: row?.hobby_id ?? activeHobby?.id ?? null,
          plan: row?.plan ?? null,
          profile: row?.profile ?? null,
          streakDays: row?.streak_days ?? 0,
          updatedAt: row?.updated_at ?? new Date(0).toISOString(),
        });

        log.info('Cloud plan hydrated', {
          userId,
          hobbyCount: hobbies.length,
          activeHobbyId: activeHobby?.id,
          hasPlan: Boolean(row?.plan),
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        log.warn('Cloud hydrate failed — using local cache', {
          userId,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      })
      .finally(() => {
        if (!cancelled) {
          setCloudHydrationStatus('done');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hydrateFromCloud, isAuthenticated, setCloudHydrationStatus, userId]);
}
