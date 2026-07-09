import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Link, useRouter } from 'expo-router';
import { StreakBadge } from '@/components/progress/StreakBadge';
import { HobbySwitcher } from '@/components/hobbies/HobbySwitcher';
import { TechniqueCard } from '@/components/roadmap/TechniqueCard';
import { TodaysFocusBanner } from '@/components/roadmap/TodaysFocusBanner';
import { colors, radii, spacing } from '@/constants/tokens';
import {
  getMasteredCount,
  getTodaysFocus,
  usePlanStore,
} from '@/store/usePlanStore';
import type { Technique } from '@/types/plan.types';

function TechniqueCardSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonLineWide} />
      <View style={styles.skeletonLineNarrow} />
      <View style={styles.skeletonBadge} />
    </View>
  );
}

export function RoadmapScreen() {
  const router = useRouter();
  const plan = usePlanStore((s) => s.plan);
  const hobbies = usePlanStore((s) => s.hobbies);
  const activeHobbyId = usePlanStore((s) => s.activeHobbyId);
  const streakDays = usePlanStore((s) => s.streakDays);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const techniques = useMemo(
    () => [...(plan?.techniques ?? [])].sort((a, b) => a.order - b.order),
    [plan?.techniques],
  );

  const activeCount = techniques.filter((t) => t.status !== 'skipped').length;
  const masteredCount = getMasteredCount(techniques);
  const todaysFocus = getTodaysFocus(techniques);
  const currentName = todaysFocus?.name ?? 'All done';

  useEffect(() => {
    if (!plan) {
      setShowSkeleton(false);
      return;
    }

    setShowSkeleton(true);
    const timer = setTimeout(() => setShowSkeleton(false), 400);
    return () => clearTimeout(timer);
  }, [plan?.planId]);

  if (!plan) {
    const activeHobby = hobbies.find((h) => h.id === activeHobbyId);
    return (
      <View style={styles.container}>
        <HobbySwitcher />
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>
            {activeHobby
              ? `No roadmap for ${activeHobby.name} yet — `
              : 'No roadmap yet — '}
          </Text>
          <Link href="/(app)/onboarding?mode=add">
            <Text style={styles.emptyLink}>generate one.</Text>
          </Link>
        </View>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Technique }) => (
    <TechniqueCard
      technique={item}
      onPress={() => router.push(`/(app)/technique/${item.id}`)}
    />
  );

  const listHeader = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <HobbySwitcher compact />
        <StreakBadge days={streakDays} />
      </View>
      <Text style={styles.progress}>
        {masteredCount} / {activeCount} mastered · Current: {currentName}
      </Text>
      <TodaysFocusBanner technique={todaysFocus} />
    </View>
  );

  if (showSkeleton) {
    return (
      <View style={styles.container}>
        {listHeader}
        <View style={styles.skeletonList}>
          {Array.from({ length: 4 }, (_, i) => (
            <TechniqueCardSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={techniques}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
  },
  progress: {
    color: colors.textMuted,
    fontSize: 15,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  separator: {
    height: spacing.md,
  },
  emptyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  emptyLink: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  skeletonList: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  skeletonLineWide: {
    backgroundColor: colors.border,
    borderRadius: 4,
    height: 16,
    width: '70%',
  },
  skeletonLineNarrow: {
    backgroundColor: colors.border,
    borderRadius: 4,
    height: 13,
    width: '45%',
  },
  skeletonBadge: {
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    height: 22,
    width: 72,
  },
});
