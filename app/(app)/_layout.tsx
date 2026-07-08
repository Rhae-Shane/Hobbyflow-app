import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function AppLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="technique/[techniqueId]" />
    </Stack>
  );
}
