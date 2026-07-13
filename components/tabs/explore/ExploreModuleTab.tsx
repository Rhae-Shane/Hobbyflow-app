import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { BootSpinner } from '@/components/BootSpinner';
import { FLOATING_TAB_BAR_HEIGHT } from '@/components/navigation/tabBarLayout';
import { RoadmapHomeScreen } from '@/components/roadmap/RoadmapHomeScreen';
import { dashboardColors, dashboardRadii } from '@/constants/dashboardTokens';
import { spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserRoadmaps } from '@/services/roadmaps';
import { useRoadmapUiStore } from '@/store/useRoadmapUiStore';

const BOTTOM_INSET = FLOATING_TAB_BAR_HEIGHT + 24;

/**
 * Explore Module tab — active roadmap learning path with floating tab bar.
 */
export function ExploreModuleTab() {
  const router = useRouter();
  const { user } = useAuth();
  const selectedRoadmapId = useRoadmapUiStore((s) => s.selectedRoadmapId);
  const setSelectedRoadmapId = useRoadmapUiStore((s) => s.setSelectedRoadmapId);

  const roadmapsQuery = useQuery({
    queryKey: ['user-roadmaps', user?.id],
    queryFn: () => fetchUserRoadmaps(user!.id),
    enabled: Boolean(user?.id),
  });

  const rows = roadmapsQuery.data ?? [];

  const activeId = useMemo(() => {
    if (selectedRoadmapId && rows.some((r) => r.id === selectedRoadmapId)) {
      return selectedRoadmapId;
    }
    return rows[0]?.id ?? null;
  }, [rows, selectedRoadmapId]);

  useEffect(() => {
    if (activeId && activeId !== selectedRoadmapId) {
      setSelectedRoadmapId(activeId);
    }
  }, [activeId, selectedRoadmapId, setSelectedRoadmapId]);

  if (roadmapsQuery.isLoading) {
    return <BootSpinner />;
  }

  if (!activeId) {
    return (
      <View style={styles.empty} testID="explore-module-empty">
        <Text style={styles.emptyTitle}>No module yet</Text>
        <Text style={styles.emptyBody}>
          Generate a roadmap to explore sessions and lessons here.
        </Text>
        <Pressable
          style={styles.cta}
          onPress={() => router.push('/(app)/(tabs)/generate' as never)}
          accessibilityRole="button"
          accessibilityLabel="Generate a roadmap"
        >
          <Text style={styles.ctaText}>Generate</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <RoadmapHomeScreen
      roadmapId={activeId}
      onRoadmapChange={setSelectedRoadmapId}
      contentBottomInset={BOTTOM_INSET}
      showBrandBar={false}
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: dashboardColors.background,
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    color: dashboardColors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  emptyBody: {
    color: dashboardColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: dashboardColors.cta,
    borderRadius: dashboardRadii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  ctaText: {
    color: dashboardColors.ctaText,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
