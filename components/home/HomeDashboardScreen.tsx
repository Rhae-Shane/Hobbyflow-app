import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { BootSpinner } from '@/components/BootSpinner';
import { HomeGreetingHeader } from '@/components/home/HomeGreetingHeader';
import { HobbyRoadmapBlocks } from '@/components/home/HobbyRoadmapBlocks';
import type { HobbyBlockProgress } from '@/components/home/HobbyRoadmapBlock';
import { QuickActionGrid } from '@/components/home/QuickActionGrid';
import { HomeDailyTaskBlock } from '@/components/home/HomeDailyTaskBlock';
import { FLOATING_TAB_BAR_HEIGHT_WITH_ASK } from '@/components/navigation/tabBarLayout';
import { PlantDoodle } from '@/components/home/HobbyBlockIllustration';
import { dashboardColors, dashboardRadii } from '@/constants/dashboardTokens';
import { fonts, spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { fetchHobbyNameIllustrationMap } from '@/services/hobbyCatalog';
import { fetchRoadmapDetail, fetchUserRoadmaps } from '@/services/roadmaps';
import { useRoadmapUiStore } from '@/store/useRoadmapUiStore';
import { useUserStore } from '@/store/useUserStore';

type Props = {
  contentBottomInset?: number;
};

export function HomeDashboardScreen({
  contentBottomInset = FLOATING_TAB_BAR_HEIGHT_WITH_ASK + 24,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const username = useUserStore((s) => s.username);
  const setSelectedRoadmapId = useRoadmapUiStore((s) => s.setSelectedRoadmapId);

  const roadmapsQuery = useQuery({
    queryKey: ['user-roadmaps', user?.id],
    queryFn: () => fetchUserRoadmaps(user!.id),
    enabled: Boolean(user?.id),
  });

  const illustrationQuery = useQuery({
    queryKey: ['hobby-name-illustrations'],
    queryFn: fetchHobbyNameIllustrationMap,
    staleTime: 60 * 60_000,
  });

  const roadmaps = roadmapsQuery.data ?? [];
  const illustrationMap = illustrationQuery.data ?? {};
  const progressIds = useMemo(() => roadmaps.map((r) => r.id), [roadmaps]);

  const progressQueries = useQueries({
    queries: progressIds.map((id) => ({
      queryKey: ['roadmap-detail', id],
      queryFn: () => fetchRoadmapDetail(id),
      enabled: Boolean(id),
      staleTime: 60_000,
    })),
  });

  const progressById = useMemo(() => {
    const map: Record<string, HobbyBlockProgress> = {};
    progressQueries.forEach((q, i) => {
      const id = progressIds[i];
      if (!id || !q.data) return;
      const lessons = q.data.lessons ?? [];
      const total = lessons.length;
      const completed = lessons.filter((l) => l.status === 'completed').length;
      map[id] = { completed, total: Math.max(total, 1) };
    });
    return map;
  }, [progressQueries, progressIds]);

  const openRoadmap = (roadmapId: string) => {
    setSelectedRoadmapId(roadmapId);
    router.push('/(app)/(tabs)/explore' as never);
  };

  const goGenerate = () => router.push('/(app)/(tabs)/generate' as never);
  const goCourses = () => router.push('/(app)/(tabs)/courses' as never);

  if (roadmapsQuery.isLoading) {
    return <BootSpinner />;
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: contentBottomInset },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <HomeGreetingHeader
          username={username}
          onProfilePress={() => router.push('/(app)/(tabs)/profile' as never)}
        />

        <HomeDailyTaskBlock
          onOpenDailyTasks={() => router.push('/(app)/daily-tasks' as never)}
        />

        {roadmaps.length === 0 ? (
          <View style={styles.empty}>
            <PlantDoodle width={140} height={140} />
            <Text style={styles.emptyTitle}>No roadmap yet</Text>
            <Text style={styles.emptyBody}>
              Generate a personalized learning path and it will show up here as a hobby block.
            </Text>
            <Pressable style={styles.emptyCta} onPress={goGenerate}>
              <Text style={styles.emptyCtaText}>Start generating</Text>
            </Pressable>
          </View>
        ) : (
          <HobbyRoadmapBlocks
            roadmaps={roadmaps}
            progressById={progressById}
            onOpen={openRoadmap}
            onAddHobby={goGenerate}
            onSeeAll={goCourses}
            illustrationMap={illustrationMap}
          />
        )}

        <QuickActionGrid
          onStreak={() => router.push('/(app)/streak' as never)}
          onPact={() => router.push('/(app)/pact' as never)}
          onGenerate={goGenerate}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: dashboardColors.background,
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  empty: {
    alignItems: 'center',
    backgroundColor: dashboardColors.surface,
    borderRadius: dashboardRadii.block,
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    color: dashboardColors.text,
    fontFamily: fonts.display,
    fontSize: 20,
  },
  emptyBody: {
    color: dashboardColors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyCta: {
    backgroundColor: dashboardColors.cta,
    borderRadius: dashboardRadii.pill,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  emptyCtaText: {
    color: dashboardColors.ctaText,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
});
