import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BootSpinner } from '@/components/BootSpinner';
import { useRoadmapUiStore } from '@/store/useRoadmapUiStore';

/**
 * Deep link / legacy route: hand off to the Roadmap tab so the floating
 * tab bar stays visible (Spec 16).
 */
export default function RoadmapHomeRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      useRoadmapUiStore.getState().setSelectedRoadmapId(id);
    }
    router.replace('/(app)/(tabs)' as never);
  }, [id, router]);

  return <BootSpinner />;
}
