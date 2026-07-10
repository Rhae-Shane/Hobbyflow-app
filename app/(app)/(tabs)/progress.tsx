import { Redirect } from 'expo-router';

/** Legacy Progress tab → Profile (Spec 16). */
export default function ProgressRedirect() {
  return <Redirect href="/(app)/(tabs)/profile" />;
}
