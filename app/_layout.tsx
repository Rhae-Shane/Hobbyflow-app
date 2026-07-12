import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { InlineError } from '@/components/ui/InlineError';
import { useAuth } from '@/hooks/useAuth';
import { useHydrateUser } from '@/hooks/useHydrateUser';
import { useHydratePreferences } from '@/hooks/useHydratePreferences';
import { useHydrateUserPlan } from '@/hooks/useHydrateUserPlan';
import { useHydrateGamification } from '@/hooks/useHydrateGamification';
import { useHydratePact } from '@/hooks/useHydratePact';
import { useOAuthDeepLink } from '@/hooks/useOAuthDeepLink';
import { useProfileDeepLink } from '@/hooks/useProfileDeepLink';
import { useSyncUserProfile } from '@/hooks/useSyncUserProfile';
import { ErrorCodes, getKnownUserMessage } from '@/lib/errors';
import { isSupabaseConfigured } from '@/lib/supabase';
import { usePlanStore } from '@/store/usePlanStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import { usePactStore } from '@/store/usePactStore';
import { colors, spacing } from '@/constants/tokens';
import { onboardingColors } from '@/constants/onboardingTokens';

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: 0,
    },
  },
});

function AuthHydration({ children }: { children: React.ReactNode }) {
  const { session, user, isLoading, error } = useAuth();
  const setUserId = usePlanStore((s) => s.setUserId);
  const clearGamification = useGamificationStore((s) => s.clearSession);
  const clearPact = usePactStore((s) => s.clearSession);

  useOAuthDeepLink();
  useProfileDeepLink();
  useSyncUserProfile(session?.user);
  useHydrateUser(user?.id, Boolean(user));
  useHydratePreferences(user?.id, Boolean(user));
  useHydrateUserPlan(user?.id, Boolean(user));
  useHydrateGamification(user?.id, Boolean(user));
  useHydratePact(user?.id, Boolean(user));

  useEffect(() => {
    setUserId(user?.id ?? null);
    if (!user?.id) {
      clearGamification();
      clearPact();
    }
  }, [clearGamification, clearPact, setUserId, user?.id]);

  if (!isSupabaseConfigured) {
    return (
      <View style={styles.loading}>
        <InlineError message="App configuration is incomplete. Please check your environment settings." />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorTitle}>Couldn't load your session</Text>
        <InlineError message={error} />
        <Text style={styles.errorHint}>
          {getKnownUserMessage(ErrorCodes.AUTH_FAILED)} Try restarting the app.
        </Text>
      </View>
    );
  }

  return children;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom', 'left']}>
          <QueryClientProvider client={queryClient}>
            <AuthHydration>
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="(app)" />
              </Stack>
            </AuthHydration>
          </QueryClientProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: onboardingColors.background,
    flex: 1,
  },
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorHint: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
