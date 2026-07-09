import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { BootSpinner } from '@/components/BootSpinner';
import { useAuth } from '@/hooks/useAuth';
import { usePlanStoreHydrated } from '@/hooks/usePlanStoreHydrated';
import { usePlanStore } from '@/store/usePlanStore';

export default function AuthLayout() {
  const router = useRouter();
  const { user } = useAuth();
  const plan = usePlanStore((s) => s.plan);
  const storeHydrated = usePlanStoreHydrated();

  useEffect(() => {
    if (!user || !storeHydrated) return;
    router.replace(plan ? '/(app)/(tabs)' : '/(app)/onboarding');
  }, [plan, router, storeHydrated, user]);

  if (user) {
    return <BootSpinner />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
