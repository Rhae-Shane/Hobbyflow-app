import { useQuery } from '@tanstack/react-query';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BootSpinner } from '@/components/BootSpinner';
import { FLOATING_TAB_BAR_HEIGHT } from '@/components/navigation/FloatingTabBar';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserRoadmaps } from '@/services/roadmaps';
import type { RoadmapRow } from '@/types/roadmap.types';
import { useRoadmapUiStore } from '@/store/useRoadmapUiStore';

function statusLabel(status: RoadmapRow['status']): string {
  if (status === 'active') return 'In progress';
  if (status === 'preview') return 'Preview';
  return 'Archived';
}

export function CoursesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const setSelectedRoadmapId = useRoadmapUiStore((s) => s.setSelectedRoadmapId);

  const openRoadmap = (rowId: string) => {
    setSelectedRoadmapId(rowId);
    router.push('/(app)/(tabs)' as never);
  };

  const query = useQuery({
    queryKey: ['user-roadmaps', user?.id],
    queryFn: () => fetchUserRoadmaps(user!.id),
    enabled: Boolean(user?.id),
  });

  if (query.isLoading) {
    return <BootSpinner />;
  }

  const rows = query.data ?? [];

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.md },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Roadmaps</Text>
        <View style={styles.stats}>
          <View style={styles.statPill}>
            <Text style={styles.statText}>🔥 0</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statText}>★ 0</Text>
          </View>
        </View>
      </View>
      <Text style={styles.subtitle}>View and manage your learning roadmaps</Text>

      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: FLOATING_TAB_BAR_HEIGHT + insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((row) => (
          <View key={row.id} style={styles.card} testID={`course-card-${row.id}`}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>{row.title}</Text>
              <Text style={styles.menu}>⋮</Text>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{statusLabel(row.status)}</Text>
              </View>
              <Text style={styles.metaText}>Open to continue</Text>
            </View>
            <View style={styles.actions}>
              <Pressable style={styles.secondaryBtn} onPress={() => openRoadmap(row.id)}>
                <Text style={styles.secondaryBtnText}>VIEW PATH</Text>
              </Pressable>
              <Pressable style={styles.primaryBtn} onPress={() => openRoadmap(row.id)}>
                <Text style={styles.primaryBtnText}>OPEN</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {rows.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No roadmaps yet</Text>
            <Text style={styles.emptyBody}>Create one from the Generation tab.</Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => router.push('/(app)/(tabs)/generate' as never)}
            >
              <Text style={styles.primaryBtnText}>GENERATE</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: onboardingColors.background,
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: onboardingColors.text,
    fontSize: 32,
    fontWeight: '800',
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statPill: {
    backgroundColor: '#EFEAE0',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statText: {
    color: onboardingColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    color: onboardingColors.textMuted,
    fontSize: 14,
    marginBottom: spacing.md,
    marginTop: 4,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  cardTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cardTitle: {
    color: onboardingColors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  menu: {
    color: onboardingColors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: '#EFEAE0',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: onboardingColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  metaText: {
    color: onboardingColors.textMuted,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  secondaryBtn: {
    alignItems: 'center',
    borderColor: onboardingColors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: onboardingColors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: onboardingColors.primary,
    borderBottomColor: onboardingColors.primaryBorder,
    borderBottomWidth: 3,
    borderRadius: 14,
    flex: 1,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: onboardingColors.primaryText,
    fontSize: 13,
    fontWeight: '800',
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    color: onboardingColors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyBody: {
    color: onboardingColors.textMuted,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
});
