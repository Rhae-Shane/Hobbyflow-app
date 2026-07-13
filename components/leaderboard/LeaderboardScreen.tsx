import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LeaderboardList } from '@/components/leaderboard/LeaderboardList';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { dashboardColors, dashboardRadii } from '@/constants/dashboardTokens';
import { theme } from '@/constants/theme';
import { spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { createLogger } from '@/lib/logger';
import {
  fetchLeaderboard,
  fetchLeaderboardFilterOptions,
} from '@/services/gamification';
import type {
  LeaderboardCategoryOption,
  LeaderboardEntry,
  LeaderboardFilter,
} from '@/types/gamification.types';
import type { HobbyTag } from '@/types/roadmapCreation.types';

const log = createLogger('LeaderboardScreen');

type TabKey =
  | { kind: 'all' }
  | { kind: 'category'; categoryId: number; name: string }
  | { kind: 'tag'; tag: HobbyTag };

function tabKeyId(tab: TabKey): string {
  if (tab.kind === 'all') return 'all';
  if (tab.kind === 'category') return `cat:${tab.categoryId}`;
  return `tag:${tab.tag.hobbyId ?? tab.tag.name}`;
}

function filterFromTab(tab: TabKey): LeaderboardFilter {
  if (tab.kind === 'all') return { kind: 'all' };
  if (tab.kind === 'category') return { kind: 'category', categoryId: tab.categoryId };
  return {
    kind: 'tag',
    hobbyId: tab.tag.hobbyId,
    name: tab.tag.name,
  };
}

function formatUpdatedAt(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function LeaderboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<LeaderboardCategoryOption[]>([]);
  const [tags, setTags] = useState<HobbyTag[]>([]);
  const [selected, setSelected] = useState<TabKey>({ kind: 'all' });
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const tabs = useMemo<TabKey[]>(() => {
    const next: TabKey[] = [{ kind: 'all' }];
    for (const cat of categories) {
      next.push({ kind: 'category', categoryId: cat.id, name: cat.name });
    }
    for (const tag of tags) {
      next.push({ kind: 'tag', tag });
    }
    return next;
  }, [categories, tags]);

  const loadBoard = useCallback(
    async (tab: TabKey) => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const board = await fetchLeaderboard(user.id, filterFromTab(tab));
        setEntries(board.entries);
        setMyRank(board.myRank);
        setUpdatedAt(new Date());
      } catch (err) {
        log.warn('Leaderboard fetch failed', {
          error: err instanceof Error ? err.message : String(err),
        });
        setEntries([]);
        setMyRank(0);
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      let cancelled = false;
      void (async () => {
        try {
          const opts = await fetchLeaderboardFilterOptions(user.id);
          if (cancelled) return;
          setCategories(opts.categories);
          setTags(opts.tags);
        } catch (err) {
          log.warn('Filter options failed', {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [user?.id]),
  );

  useFocusEffect(
    useCallback(() => {
      void loadBoard(selected);
    }, [loadBoard, selected]),
  );

  const selectedId = tabKeyId(selected);
  const selectedLabel =
    selected.kind === 'all'
      ? 'all hobbies'
      : selected.kind === 'category'
        ? selected.name
        : selected.tag.name;

  return (
    <ScreenShell>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {tabs.map((tab) => {
            const id = tabKeyId(tab);
            const label =
              tab.kind === 'all'
                ? 'All'
                : tab.kind === 'category'
                  ? tab.name
                  : tab.tag.name;
            const active = id === selectedId;
            return (
              <Pressable
                key={id}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => {
                  setSelected(tab);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.updatedRow}>
          <Text style={styles.updatedIcon}>↻</Text>
          <Text style={styles.updatedText}>
            Last updated
            {updatedAt ? ` at ${formatUpdatedAt(updatedAt)}` : '…'}
          </Text>
        </View>

        <Pressable
          style={styles.cta}
          onPress={() => router.push('/(app)/daily-tasks' as never)}
          accessibilityLabel="Open daily tasks"
        >
          <View style={styles.ctaBody}>
            <Text style={styles.ctaTitle}>Practice & climb</Text>
            <Text style={styles.ctaSub}>Earn your leaderboard rank</Text>
          </View>
          <View style={styles.ctaBtn}>
            <Text style={styles.ctaBtnText}>Practice</Text>
          </View>
        </Pressable>

        {loading ? (
          <ActivityIndicator color={theme.colors.navActive} style={styles.loader} />
        ) : (
          <LeaderboardList entries={entries} myRank={myRank} />
        )}

        {!loading && entries.length === 0 ? (
          <Text style={styles.filterHint}>Showing {selectedLabel}</Text>
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: 32,
  },
  tabs: {
    gap: 4,
    paddingVertical: 2,
  },
  tab: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    marginRight: 16,
    paddingBottom: 8,
    paddingHorizontal: 2,
  },
  tabActive: {
    borderBottomColor: theme.colors.navActive,
  },
  tabText: {
    color: dashboardColors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  tabTextActive: {
    color: theme.colors.navActive,
    fontWeight: '800',
  },
  updatedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: -4,
  },
  updatedIcon: {
    color: dashboardColors.textMuted,
    fontSize: 12,
  },
  updatedText: {
    color: dashboardColors.textMuted,
    fontSize: 12,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: dashboardColors.surface,
    borderColor: theme.colors.primaryBorder,
    borderRadius: dashboardRadii.block,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  ctaBody: {
    flex: 1,
    gap: 2,
  },
  ctaTitle: {
    color: dashboardColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  ctaSub: {
    color: dashboardColors.textMuted,
    fontSize: 12,
  },
  ctaBtn: {
    borderColor: theme.colors.primaryBorder,
    borderRadius: dashboardRadii.pill,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  ctaBtnText: {
    color: theme.colors.primaryText,
    fontSize: 13,
    fontWeight: '700',
  },
  loader: {
    marginTop: spacing.xl,
  },
  filterHint: {
    color: dashboardColors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
