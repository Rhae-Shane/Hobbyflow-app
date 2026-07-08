import { Redirect } from 'expo-router';
import { useAuth } from '../src/shared/hooks/useAuth';
import { usePlanStore } from '../src/shared/store/usePlanStore';

export default function Index() {
  const { user } = useAuth();
  const plan = usePlanStore((s) => s.plan);

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  if (!plan) {
    return <Redirect href="/(app)/onboarding" />;
  }

  return <Redirect href="/(app)/(tabs)" />;
}
