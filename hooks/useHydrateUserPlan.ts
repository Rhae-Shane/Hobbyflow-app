import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';
import { fetchUserPlan } from '@/services/userState';
import { usePlanStore } from '@/store/usePlanStore';

const log = createLogger('hydrate');

export function useHydrateUserPlan(userId: string | undefined, isAuthenticated: boolean) {
  const hydrateFromCloud = usePlanStore((s) => s.hydrateFromCloud);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      return;
    }

    let cancelled = false;

    log.debug('Hydrating plan from cloud', { userId });

    fetchUserPlan(userId)
      .then((row) => {
        if (cancelled) return;

        if (!row) {
          log.info('No cloud plan found for user', { userId });
          return;
        }

        hydrateFromCloud({
          plan: row.plan,
          profile: row.profile,
          streakDays: row.streak_days,
          updatedAt: row.updated_at,
        });
        log.info('Cloud plan hydrated', {
          userId,
          hasPlan: Boolean(row.plan),
          streakDays: row.streak_days,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        log.warn('Cloud hydrate failed — using local cache', {
          userId,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [hydrateFromCloud, isAuthenticated, userId]);
}
