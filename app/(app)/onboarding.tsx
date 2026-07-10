import { Redirect, useLocalSearchParams } from 'expo-router';

export default function OnboardingRedirect() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const href = mode === 'add' ? '/(app)/roadmap-creation?mode=add' : '/(app)/roadmap-creation';
  return <Redirect href={href} />;
}
