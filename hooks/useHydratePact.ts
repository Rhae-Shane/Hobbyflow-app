import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';
import { usePactStore } from '@/store/usePactStore';

const log = createLogger('hydrate-pact');

export function useHydratePact(userId: string | undefined, isAuthenticated: boolean) {
  const hydrate = usePactStore((s) => s.hydrate);
  const clearSession = usePactStore((s) => s.clearSession);
  const setUserId = usePactStore((s) => s.setUserId);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      clearSession();
      return;
    }

    setUserId(userId);
    log.debug('Hydrating pact', { userId });
    void hydrate(userId);
  }, [clearSession, hydrate, isAuthenticated, setUserId, userId]);
}
