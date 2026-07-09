import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';
import { fetchUserPreferences } from '@/services/preferences';
import { usePreferencesStore } from '@/store/usePreferencesStore';

const log = createLogger('hydrate-preferences');

export function useHydratePreferences(userId: string | undefined, isAuthenticated: boolean) {
  const setPreferences = usePreferencesStore((s) => s.setPreferences);
  const setHydrationStatus = usePreferencesStore((s) => s.setHydrationStatus);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setHydrationStatus('idle');
      return;
    }

    let cancelled = false;

    log.debug('Hydrating preferences from cloud', { userId });
    setHydrationStatus('loading');

    fetchUserPreferences(userId)
      .then((preferences) => {
        if (cancelled) return;
        setPreferences(preferences);
        log.info('Preferences hydrated', {
          userId,
          hasPreferences: Boolean(preferences),
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        log.warn('Preferences hydrate failed', {
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
  }, [isAuthenticated, setHydrationStatus, setPreferences, userId]);
}
