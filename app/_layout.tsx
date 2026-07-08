import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../src/shared/hooks/useAuth';
import { useHydrateUserPlan } from '../src/shared/hooks/useHydrateUserPlan';
import { usePlanStore } from '../src/shared/store/usePlanStore';
import { colors } from '../src/shared/theme/tokens';

const queryClient = new QueryClient();

function AuthHydration({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const setUserId = usePlanStore((s) => s.setUserId);

  useHydrateUserPlan(user?.id, Boolean(user));

  useEffect(() => {
    setUserId(user?.id ?? null);
  }, [setUserId, user?.id]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return children;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydration>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </AuthHydration>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
});
