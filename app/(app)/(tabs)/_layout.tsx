import { Redirect, Tabs } from 'expo-router';
import { usePlanStore } from '@/store/usePlanStore';
import { colors } from '@/constants/tokens';

export default function TabsLayout() {
  const plan = usePlanStore((s) => s.plan);

  if (!plan) {
    return <Redirect href="/(app)/onboarding" />;
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
