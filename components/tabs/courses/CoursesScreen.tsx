import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BootSpinner } from '@/components/BootSpinner';
import {
  AddHobbyGhostBlock,
  HobbyRoadmapBlock,
  type HobbyBlockProgress,
} from '@/components/home/HobbyRoadmapBlock';
import { PlantDoodle } from '@/components/home/HobbyBlockIllustration';
import { dashboardColors, dashboardRadii } from '@/constants/dashboardTokens';
import { spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { useFloatingTabBarOccupiedHeight } from '@/hooks/useFloatingTabBarInset';
import { fetchRoadmapDetail, fetchUserRoadmaps } from '@/services/roadmaps';
import { useRoadmapUiStore } from '@/store/useRoadmapUiStore';
import type { RoadmapRow } from '@/types/roadmap.types';

const GAP = 12;

type GridItem =
  | { kind: 'roadmap'; row: RoadmapRow; index: number }
  | { kind: 'add' };

function chunkPairs<T>(items: T[]): T[][] {
  const pairs: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    pairs.push(items.slice(i, i + 2));
  }
  return pairs;
}

export function CoursesScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const { user } = useAuth();
  const setSelectedRoadmapId = useRoadmapUiStore((s) => s.setSelectedRoadmapId);
  const bottomInset = useFloatingTabBarOccupiedHeight() + 24;

  const cardWidth = Math.floor((windowWidth - spacing.md * 2 - GAP) / 2);

  const openRoadmap = (rowId: string) => {
    setSelectedRoadmapId(rowId);
    router.push('/(app)/(tabs)/explore' as never);
  };

  const goGenerate = () => router.push('/(app)/(tabs)/generate' as never);

  const query = useQuery({
    queryKey: ['user-roadmaps', user?.id],
    queryFn: () => fetchUserRoadmaps(user!.id),
    enabled: Boolean(user?.id),
  });

  const rows = query.data ?? [];
  const progressIds = useMemo(() => rows.map((r) => r.id), [rows]);

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

  const gridItems = useMemo<GridItem[]>(() => {
    const items: GridItem[] = rows.map((row, index) => ({
      kind: 'roadmap',
      row,
      index,
    }));
    items.push({ kind: 'add' });
    return items;
  }, [rows]);

  const pairs = useMemo(() => chunkPairs(gridItems), [gridItems]);

  if (query.isLoading) {
    return <BootSpinner />;
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomInset },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Hobby roadmaps</Text>
            <Text style={styles.subtitle}>All your learning paths</Text>
          </View>
        </View>

        {rows.length === 0 ? (
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
          <View style={styles.grid}>
            {pairs.map((pair, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.row}>
                {pair.map((item) =>
                  item.kind === 'add' ? (
                    <AddHobbyGhostBlock
                      key="add"
                      onPress={goGenerate}
                      width={cardWidth}
                    />
                  ) : (
                    <HobbyRoadmapBlock
                      key={item.row.id}
                      title={item.row.title}
                      index={item.index}
                      progress={progressById[item.row.id]}
                      ctaLabel={item.row.status === 'preview' ? 'START' : 'OPEN'}
                      onPress={() => openRoadmap(item.row.id)}
                      width={cardWidth}
                    />
                  ),
                )}
                {pair.length === 1 ? <View style={{ width: cardWidth }} /> : null}
              </View>
            ))}
          </View>
        )}
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
  header: {
    marginBottom: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: dashboardColors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: dashboardColors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  grid: {
    gap: GAP,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
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
    fontSize: 20,
    fontWeight: '800',
  },
  emptyBody: {
    color: dashboardColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyCta: {
    backgroundColor: dashboardColors.cta,
    borderRadius: dashboardRadii.pill,
    marginTop: spacing.sm,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyCtaText: {
    color: dashboardColors.ctaText,
    fontSize: 14,
    fontWeight: '800',
  },
});
