import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BootSpinner } from '@/components/BootSpinner';
import { onboardingColors } from '@/constants/onboardingTokens';
import { theme } from '@/constants/theme';
import { spacing } from '@/constants/tokens';
import { useRoadmapUiStore } from '@/store/useRoadmapUiStore';

/**
 * Deep-link / legacy stack entry → Explore Module tab (keeps floating tab bar).
 */
export default function RoadmapDetailRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const setSelectedRoadmapId = useRoadmapUiStore((s) => s.setSelectedRoadmapId);

  useEffect(() => {
    if (!id) return;
    setSelectedRoadmapId(id);
    router.replace('/(app)/(tabs)/explore' as never);
  }, [id, router, setSelectedRoadmapId]);

  if (!id) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Roadmap not found.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return <BootSpinner />;
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: theme.colors.background,
    flex: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  fallbackText: {
    color: onboardingColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  backLink: {
    color: onboardingColors.primaryText,
    fontWeight: '700',
  },
});
