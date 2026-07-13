import { Redirect, useLocalSearchParams } from 'expo-router';

/** Legacy alias — add → Generation tab; first-time → home (roadmap creation is optional). */
export default function OnboardingRedirect() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  if (mode === 'add') {
    return <Redirect href="/(app)/(tabs)/generate" />;
  }
  return <Redirect href="/(app)/(tabs)" />;
}
