import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { usePlanStore } from '@/store/usePlanStore';

export default function AuthLayout() {
  const { user } = useAuth();
  const plan = usePlanStore((s) => s.plan);

  if (user) {
    return <Redirect href={plan ? '/(app)/(tabs)' : '/(app)/onboarding'} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
