import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { AuthScreen } from './src/features/auth/AuthScreen';
import { OnboardingScreen } from './src/features/onboarding/OnboardingScreen';
import { RoadmapScreen } from './src/features/roadmap/RoadmapScreen';
import { ProgressScreen } from './src/features/progress/ProgressScreen';
import { TechniqueDetailScreen } from './src/features/technique/TechniqueDetailScreen';
import { useAuth } from './src/shared/hooks/useAuth';
import { useHydrateUserPlan } from './src/shared/hooks/useHydrateUserPlan';
import { usePlanStore } from './src/shared/store/usePlanStore';
import { colors } from './src/shared/theme/tokens';

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Roadmap: undefined;
  TechniqueDetail: { techniqueId: string };
  Progress: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const queryClient = new QueryClient();

function AppNavigator() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const plan = usePlanStore((s) => s.plan);
  const setUserId = usePlanStore((s) => s.setUserId);

  useHydrateUserPlan(user?.id, Boolean(user));

  useEffect(() => {
    setUserId(user?.id ?? null);
  }, [setUserId, user?.id]);

  if (isAuthLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const initialRoute = !user ? 'Auth' : plan ? 'Roadmap' : 'Onboarding';

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Roadmap" component={RoadmapScreen} />
          <Stack.Screen name="TechniqueDetail" component={TechniqueDetailScreen} />
          <Stack.Screen name="Progress" component={ProgressScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <StatusBar style="dark" />
        <AppNavigator />
      </NavigationContainer>
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
