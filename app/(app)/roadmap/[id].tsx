import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RoadmapHomeScreen } from '@/components/roadmap/RoadmapHomeScreen';
import { onboardingColors } from '@/constants/onboardingTokens';
import { theme } from '@/constants/theme';
import { spacing } from '@/constants/tokens';
import { useRoadmapUiStore } from '@/store/useRoadmapUiStore';

/**
 * Learning-path detail — title/back come from fixed AppChromeHeader.
 */
export default function RoadmapDetailRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const setSelectedRoadmapId = useRoadmapUiStore((s) => s.setSelectedRoadmapId);

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

  return (
    <View style={styles.root}>
      <RoadmapHomeScreen
        roadmapId={id}
        onRoadmapChange={(nextId) => {
          setSelectedRoadmapId(nextId);
          router.replace(`/(app)/roadmap/${nextId}` as never);
        }}
        contentBottomInset={spacing.lg}
        showBrandBar={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
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
