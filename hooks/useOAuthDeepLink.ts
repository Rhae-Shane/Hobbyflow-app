import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { createSessionFromUrl } from '@/lib/auth';
import { createLogger } from '@/lib/logger';

const log = createLogger('oauth-deeplink');

function isAuthCallbackUrl(url: string): boolean {
  return url.includes('access_token=') || url.includes('error=') || url.includes('code=');
}

export function useOAuthDeepLink() {
  useEffect(() => {
    const handleUrl = async (url: string) => {
      if (!isAuthCallbackUrl(url)) return;

      try {
        log.info('Processing OAuth callback URL');
        await createSessionFromUrl(url);
      } catch (err) {
        log.error('OAuth callback failed', {
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    };

    void Linking.getInitialURL().then((url) => {
      if (url) void handleUrl(url);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url);
    });

    return () => subscription.remove();
  }, []);
}
