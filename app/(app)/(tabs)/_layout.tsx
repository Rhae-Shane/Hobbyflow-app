import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { BootSpinner } from '@/components/BootSpinner';
import { usePlanStoreHydrated } from '@/hooks/usePlanStoreHydrated';
import { getPostAuthRoute, hasCompletedPreferences } from '@/lib/routing';
import { usePlanStore } from '@/store/usePlanStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { colors } from '@/constants/tokens';

export default function TabsLayout() {
  const router = useRouter();
  const plan = usePlanStore((s) => s.plan);
  const cloudHydrationStatus = usePlanStore((s) => s.cloudHydrationStatus);
  const preferences = usePreferencesStore((s) => s.preferences);
  const storeHydrated = usePlanStoreHydrated();

  const waitingForCloudPlan = !plan && cloudHydrationStatus === 'loading';

  useEffect(() => {
    if (!storeHydrated || waitingForCloudPlan) return;

    const route = getPostAuthRoute({
      hasPreferences: hasCompletedPreferences(preferences),
      hasPlan: Boolean(plan),
    });

    if (route !== '/(app)/(tabs)') {
      router.replace(route);
    }
  }, [plan, preferences, router, storeHydrated, waitingForCloudPlan]);

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
