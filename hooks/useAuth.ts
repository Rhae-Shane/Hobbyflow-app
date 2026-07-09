import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { ErrorCodes, getKnownUserMessage } from '@/lib/errors';
import { createLogger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

const log = createLogger('auth-hook');

type AuthState = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
};

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!mounted) return;

        if (sessionError) {
          log.error('Failed to load session', { error: sessionError.message });
          setError(getKnownUserMessage(ErrorCodes.AUTH_FAILED));
          setSession(null);
          return;
        }

        setSession(data.session);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        log.error('Session load threw', {
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        setError(getKnownUserMessage(ErrorCodes.AUTH_FAILED));
        setSession(null);
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setError(null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    isLoading,
    error,
  };
}
