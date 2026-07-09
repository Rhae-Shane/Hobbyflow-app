import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { BootSpinner } from '@/components/BootSpinner';
import { usePlanStoreHydrated } from '@/hooks/usePlanStoreHydrated';
import { usePlanStore } from '@/store/usePlanStore';
import { colors } from '@/constants/tokens';

export default function TabsLayout() {
  const router = useRouter();
  const plan = usePlanStore((s) => s.plan);
  const cloudHydrationStatus = usePlanStore((s) => s.cloudHydrationStatus);
  const storeHydrated = usePlanStoreHydrated();

  const waitingForCloudPlan = !plan && cloudHydrationStatus === 'loading';

  useEffect(() => {
    if (!storeHydrated || waitingForCloudPlan) return;
    if (!plan) {
      router.replace('/(app)/onboarding');
    }
  }, [plan, router, storeHydrated, waitingForCloudPlan]);

  if (!storeHydrated || waitingForCloudPlan || !plan) {
    return <BootSpinner />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Roadmap' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
    </Tabs>
  );
}
