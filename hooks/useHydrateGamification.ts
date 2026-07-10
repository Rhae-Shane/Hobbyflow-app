import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';
import { usePlanStore } from '@/store/usePlanStore';
import { useGamificationStore } from '@/store/useGamificationStore';

const log = createLogger('hydrate-gamification');

export function useHydrateGamification(userId: string | undefined, isAuthenticated: boolean) {
  const hobbies = usePlanStore((s) => s.hobbies);
  const hydrate = useGamificationStore((s) => s.hydrate);
  const clearSession = useGamificationStore((s) => s.clearSession);
  const setUserId = useGamificationStore((s) => s.setUserId);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      clearSession();
      return;
    }

    setUserId(userId);
    log.debug('Hydrating gamification', { userId, hobbyCount: hobbies.length });
    void hydrate(userId, hobbies);
  }, [clearSession, hobbies, hydrate, isAuthenticated, setUserId, userId]);
}
