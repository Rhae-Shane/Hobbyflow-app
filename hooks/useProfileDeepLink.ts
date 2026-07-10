import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';

const log = createLogger('profile-deeplink');

function usernameFromUrl(url: string): string | null {
  try {
    const parsed = Linking.parse(url);
    const path = (parsed.path ?? '').replace(/^\//, '');
    const match = path.match(/^u\/([a-z0-9_]{3,20})$/i);
    if (match?.[1]) return match[1].toLowerCase();

    // hobbyflow://u/alice sometimes puts host as "u"
    if (parsed.hostname === 'u' && typeof parsed.path === 'string') {
      const name = parsed.path.replace(/^\//, '').split('/')[0];
      if (name && /^[a-z0-9_]{3,20}$/i.test(name)) return name.toLowerCase();
    }
  } catch {
    return null;
  }
  return null;
}

export function useProfileDeepLink() {
  const router = useRouter();

  useEffect(() => {
    const open = (url: string) => {
      const username = usernameFromUrl(url);
      if (!username) return;
      log.info('Opening shared profile', { username });
      router.push(`/(app)/u/${username}` as never);
    };

    void Linking.getInitialURL().then((url) => {
      if (url) open(url);
    });

    const sub = Linking.addEventListener('url', ({ url }) => open(url));
    return () => sub.remove();
  }, [router]);
}
