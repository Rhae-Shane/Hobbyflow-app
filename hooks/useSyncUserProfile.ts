import { useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { createLogger } from '@/lib/logger';
import { syncProfileFromAuth } from '@/services/profile';

const log = createLogger('profile-sync');

export function useSyncUserProfile(user: User | null | undefined) {
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    syncProfileFromAuth(user)
      .catch((err: unknown) => {
        if (cancelled) return;
        log.warn('Profile sync failed — auth session still valid', {
          userId: user.id,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [user]);
}
