import { Redirect } from 'expo-router';

/** Legacy stack route — creation lives on the Generation tab. */
export default function RoadmapCreationRoute() {
  return <Redirect href="/(app)/(tabs)/generate" />;
}
