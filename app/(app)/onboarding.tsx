import { Redirect, useLocalSearchParams } from 'expo-router';

/** Legacy alias — first-time → stack creation; add → Generation tab. */
export default function OnboardingRedirect() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  if (mode === 'add') {
    return <Redirect href="/(app)/(tabs)/generate" />;
  }
  return <Redirect href="/(app)/roadmap-creation" />;
}
