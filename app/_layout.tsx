import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack, useNavigationContainerRef } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import 'react-native-reanimated';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemedAlertHost } from '@/components/ui/ThemedAlertHost';
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
import { initSentry, navigationIntegration, Sentry } from '@/lib/sentry';
import { isSupabaseConfigured } from '@/lib/supabase';
import { usePlanStore } from '@/store/usePlanStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import { usePactStore } from '@/store/usePactStore';
import { colors, fonts, spacing } from '@/constants/tokens';
import { onboardingColors } from '@/constants/onboardingTokens';

initSentry();

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
      Sentry.setUser(null);
      return;
    }
    Sentry.setUser({ id: user.id, email: user.email ?? undefined });
  }, [clearGamification, clearPact, setUserId, user?.email, user?.id]);

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

function RootLayout() {
  const navigationRef = useNavigationContainerRef();
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (navigationRef) {
      navigationIntegration.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        {/* Bottom edge is open so inputs can stick flush to the keyboard (Expo 54 edge-to-edge). */}
        <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'left']}>
          <KeyboardProvider>
            <QueryClientProvider client={queryClient}>
              <AuthHydration>
                <StatusBar style="dark" />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="auth" />
                  <Stack.Screen name="(app)" />
                </Stack>
                <ThemedAlertHost />
              </AuthHydration>
            </QueryClientProvider>
          </KeyboardProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default Sentry.wrap(RootLayout);

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
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    textAlign: 'center',
  },
  errorHint: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
