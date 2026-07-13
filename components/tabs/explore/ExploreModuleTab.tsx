import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { BootSpinner } from '@/components/BootSpinner';
import { ReadingDoodle } from '@/components/home/categoryIllustrations';
import { SparkleIcon } from '@/components/icons/AppIcons';
import { RoadmapHomeScreen } from '@/components/roadmap/RoadmapHomeScreen';
import { GraphPaperGrid } from '@/components/ui/GraphPaperGrid';
import { dashboardColors, dashboardRadii } from '@/constants/dashboardTokens';
import { theme } from '@/constants/theme';
import { fonts, spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { useFloatingTabBarOccupiedHeight } from '@/hooks/useFloatingTabBarInset';
import { fetchUserRoadmaps } from '@/services/roadmaps';
import { useRoadmapUiStore } from '@/store/useRoadmapUiStore';

const PATH_PREVIEW = [
  { n: 1, title: 'First session', meta: '15m', active: true },
  { n: 2, title: 'Build the habit', meta: '20m', active: false },
  { n: 3, title: 'Practice round', meta: '10m', active: false },
  { n: 4, title: 'Level check', meta: 'Practice', active: false },
] as const;

function PathPreview() {
  return (
    <View style={styles.pathCard}>
      <View style={styles.pathHeader}>
        <View style={styles.pathIconWash}>
          <ReadingDoodle width={36} height={36} />
        </View>
        <View style={styles.pathHeaderText}>
          <Text style={styles.pathTitle}>Your learning path</Text>
          <Text style={styles.pathMeta}>Sessions · lessons · practice</Text>
        </View>
      </View>

      <View style={styles.pathList}>
        {PATH_PREVIEW.map((item, index) => (
          <View key={item.n} style={styles.pathRow}>
            <View style={styles.pathRail}>
              <View
                style={[
                  styles.pathDot,
                  item.active ? styles.pathDotActive : styles.pathDotIdle,
                ]}
              >
                <Text
                  style={[
                    styles.pathDotText,
                    item.active ? styles.pathDotTextActive : null,
                  ]}
                >
                  {item.n}
                </Text>
              </View>
              {index < PATH_PREVIEW.length - 1 ? <View style={styles.pathLine} /> : null}
            </View>
            <View style={styles.pathCopy}>
              <Text
                style={[styles.pathItemTitle, item.active && styles.pathItemTitleActive]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={styles.pathItemMeta}>{item.meta}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function ExploreEmptyState({ onGenerate }: { onGenerate: () => void }) {
  const bottomInset = useFloatingTabBarOccupiedHeight() + 24;

  return (
    <View
      style={[styles.emptyRoot, { paddingBottom: bottomInset }]}
      testID="explore-module-empty"
    >
      <GraphPaperGrid />

      <View style={styles.emptyInner}>
        <View style={styles.emptyHero}>
          <ReadingDoodle width={120} height={120} />
          <Text style={styles.emptyTitle}>No module yet</Text>
          <Text style={styles.emptyBody}>
            Generate a personalized path and explore sessions and lessons here.
          </Text>
          <Pressable
            style={styles.cta}
            onPress={onGenerate}
            accessibilityRole="button"
            accessibilityLabel="Generate a roadmap"
          >
            <SparkleIcon size={16} color={dashboardColors.ctaText} />
            <Text style={styles.ctaText}>Generate</Text>
          </Pressable>
        </View>

        <PathPreview />
      </View>
    </View>
  );
}

/**
 * Explore Module tab — active roadmap learning path with floating tab bar.
 */
export function ExploreModuleTab() {
  const router = useRouter();
  const { user } = useAuth();
  const selectedRoadmapId = useRoadmapUiStore((s) => s.selectedRoadmapId);
  const setSelectedRoadmapId = useRoadmapUiStore((s) => s.setSelectedRoadmapId);
  const bottomInset = useFloatingTabBarOccupiedHeight() + 24;

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
      <ExploreEmptyState
        onGenerate={() => router.push('/(app)/(tabs)/generate' as never)}
      />
    );
  }

  return (
    <RoadmapHomeScreen
      roadmapId={activeId}
      onRoadmapChange={setSelectedRoadmapId}
      contentBottomInset={bottomInset}
      showBrandBar={false}
    />
  );
}

const styles = StyleSheet.create({
  emptyRoot: {
    backgroundColor: dashboardColors.background,
    flex: 1,
    overflow: 'hidden',
  },
  emptyInner: {
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  emptyHero: {
    alignItems: 'center',
    backgroundColor: dashboardColors.surface,
    borderRadius: dashboardRadii.block,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    color: dashboardColors.text,
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  emptyBody: {
    color: dashboardColors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  cta: {
    alignItems: 'center',
    backgroundColor: dashboardColors.cta,
    borderRadius: dashboardRadii.pill,
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  ctaText: {
    color: dashboardColors.ctaText,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  pathCard: {
    backgroundColor: dashboardColors.surface,
    borderRadius: dashboardRadii.block,
    opacity: 0.92,
    overflow: 'hidden',
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  pathHeader: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
  },
  pathIconWash: {
    alignItems: 'center',
    backgroundColor: theme.colors.navActiveSoft,
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  pathHeaderText: {
    flex: 1,
    gap: 2,
  },
  pathTitle: {
    color: dashboardColors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },
  pathMeta: {
    color: dashboardColors.textMuted,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  pathList: {
    gap: 0,
  },
  pathRow: {
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 52,
  },
  pathRail: {
    alignItems: 'center',
    width: 28,
  },
  pathDot: {
    alignItems: 'center',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  pathDotActive: {
    backgroundColor: theme.colors.accentDeep,
  },
  pathDotIdle: {
    backgroundColor: theme.colors.weekEmpty,
  },
  pathDotText: {
    color: dashboardColors.textMuted,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  pathDotTextActive: {
    color: '#FFFFFF',
  },
  pathLine: {
    backgroundColor: theme.colors.border,
    flex: 1,
    marginVertical: 2,
    width: 2,
  },
  pathCopy: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    paddingTop: 4,
  },
  pathItemTitle: {
    color: dashboardColors.text,
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
  },
  pathItemTitleActive: {
    color: theme.colors.accentDeep,
  },
  pathItemMeta: {
    color: dashboardColors.textMuted,
    fontFamily: fonts.body,
    fontSize: 13,
  },
});
