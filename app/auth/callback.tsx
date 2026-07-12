import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { createSessionFromUrl } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { colors, spacing } from '@/constants/tokens';

const log = createLogger('auth-callback');

function isAuthCallbackUrl(url: string): boolean {
  return url.includes('access_token=') || url.includes('error=') || url.includes('code=');
}

export default function AuthCallbackScreen() {
  const [message, setMessage] = useState('Signing you in…');

  useEffect(() => {
    let cancelled = false;

    const finish = async (url: string | null) => {
      if (!url || cancelled) return;

      try {
        if (isAuthCallbackUrl(url)) {
          log.info('Completing OAuth from deep link');
          await createSessionFromUrl(url);
        }
        if (!cancelled) {
          router.replace('/');
        }
      } catch (err) {
        log.error('OAuth callback failed', {
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        if (!cancelled) {
          setMessage(err instanceof Error ? err.message : "Couldn't complete sign-in.");
        }
      }
    };

    void Linking.getInitialURL().then((url) => void finish(url));

    const sub = Linking.addEventListener('url', ({ url }) => {
      void finish(url);
    });

    // If WebBrowser already handed off and there's no token in the URL, bounce home.
    const timeout = setTimeout(() => {
      if (!cancelled) {
        router.replace('/');
      }
    }, 2500);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      sub.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  text: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
});
