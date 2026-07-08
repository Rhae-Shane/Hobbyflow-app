import { useEffect } from 'react';
import { fetchUserPlan } from '../api/userState';
import { usePlanStore } from '../store/usePlanStore';

export function useHydrateUserPlan(userId: string | undefined, isAuthenticated: boolean) {
  const hydrateFromCloud = usePlanStore((s) => s.hydrateFromCloud);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      return;
    }

    let cancelled = false;

    fetchUserPlan(userId)
      .then((row) => {
        if (cancelled || !row) return;
        hydrateFromCloud({
          plan: row.plan,
          profile: row.profile,
          streakDays: row.streak_days,
        });
      })
      .catch(() => {
        // Offline or first login — local AsyncStorage state still works.
      });

    return () => {
      cancelled = true;
    };
  }, [hydrateFromCloud, isAuthenticated, userId]);
}
