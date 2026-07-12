import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';
import { useGamificationStore } from '@/store/useGamificationStore';

const log = createLogger('hydrate-gamification');

export function useHydrateGamification(userId: string | undefined, isAuthenticated: boolean) {
  const hydrate = useGamificationStore((s) => s.hydrate);
  const clearSession = useGamificationStore((s) => s.clearSession);
  const setUserId = useGamificationStore((s) => s.setUserId);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      clearSession();
      return;
    }

    setUserId(userId);
    log.debug('Hydrating gamification', { userId });
    void hydrate(userId);
  }, [clearSession, hydrate, isAuthenticated, setUserId, userId]);
}
