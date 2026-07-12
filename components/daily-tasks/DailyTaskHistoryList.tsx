import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import dayjs from 'dayjs';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import { toDateKey } from '@/lib/gamification/streakMath';
import type { DailyTaskHistoryItem, DailyTaskRow } from '@/types/gamification.types';

type Props = {
  items: DailyTaskHistoryItem[];
  memberSince?: string | null;
};

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type DayStatus = 'completed' | 'missed' | 'neutral' | 'outside';

export function DailyTaskHistoryList({ items, memberSince }: Props) {
  const today = toDateKey();
  const [cursor, setCursor] = useState(() => dayjs().startOf('month'));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const completedByDate = useMemo(() => {
    const map = new Map<string, DailyTaskRow[]>();
    for (const item of items) {
      if (item.kind === 'completed') {
        map.set(item.task_date, item.tasks);
      }
    }
    return map;
  }, [items]);

  const missedSet = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.kind === 'missed_day') set.add(item.task_date);
    }
    return set;
  }, [items]);

  const joinDate = memberSince ?? today;
  const minMonth = dayjs(joinDate).startOf('month');
  const maxMonth = dayjs(today).startOf('month');

  const cells = useMemo(() => {
    const start = cursor.startOf('month');
    const daysInMonth = start.daysInMonth();
    const offset = start.day();
    const list: Array<{ key: string; label: string; dateKey: string | null }> = [];

    for (let i = 0; i < offset; i++) {
      list.push({ key: `pad-${i}`, label: '', dateKey: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = start.date(d).format('YYYY-MM-DD');
      list.push({ key: dateKey, label: String(d), dateKey });
    }
    return list;
  }, [cursor]);

  const statusFor = (dateKey: string): DayStatus => {
    if (dateKey < joinDate || dateKey > today) return 'outside';
    if (completedByDate.has(dateKey)) return 'completed';
    if (missedSet.has(dateKey) || dateKey < today) return 'missed';
    return 'neutral';
  };

  const selectedTasks = selectedDate ? completedByDate.get(selectedDate) ?? [] : [];
  const selectedStatus = selectedDate ? statusFor(selectedDate) : null;

  const canGoPrev = cursor.isAfter(minMonth, 'month');
  const canGoNext = cursor.isBefore(maxMonth, 'month');

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Pressable
          onPress={() => canGoPrev && setCursor((c) => c.subtract(1, 'month'))}
          accessibilityLabel="Previous month"
          hitSlop={8}
          disabled={!canGoPrev}
        >
          <Text style={[styles.nav, !canGoPrev && styles.navDisabled]}>‹</Text>
        </Pressable>
        <Text style={styles.month}>{cursor.format('MMMM YYYY')}</Text>
        <Pressable
          onPress={() => canGoNext && setCursor((c) => c.add(1, 'month'))}
          accessibilityLabel="Next month"
          hitSlop={8}
          disabled={!canGoNext}
        >
          <Text style={[styles.nav, !canGoNext && styles.navDisabled]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((d, i) => (
          <Text key={`${d}-${i}`} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell) => {
          if (!cell.dateKey) {
            return <View key={cell.key} style={styles.cell} />;
          }

          const status = statusFor(cell.dateKey);
          const isToday = cell.dateKey === today;
          const isSelected = cell.dateKey === selectedDate;
          const tappable = status === 'completed' || status === 'missed' || status === 'neutral';
          const taskCount = completedByDate.get(cell.dateKey)?.length ?? 0;

          return (
            <View key={cell.key} style={styles.cell}>
              <Pressable
                disabled={!tappable}
                onPress={() => setSelectedDate(cell.dateKey)}
                accessibilityLabel={`${cell.dateKey} ${status}${taskCount > 1 ? `, ${taskCount} tasks` : ''}`}
                hitSlop={4}
              >
                <View
                  style={[
                    styles.dayBubble,
                    status === 'completed' && styles.dayCompleted,
                    status === 'missed' && styles.dayMissed,
                    status === 'neutral' && styles.dayNeutral,
                    status === 'outside' && styles.dayOutside,
                    isToday && styles.dayTodayRing,
                    isSelected && styles.daySelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      status === 'completed' && styles.dayCompletedText,
                      status === 'missed' && styles.dayMissedText,
                      status === 'outside' && styles.dayOutsideText,
                      isToday && status !== 'completed' && styles.dayTodayText,
                    ]}
                  >
                    {cell.label}
                  </Text>
                </View>
              </Pressable>
              {taskCount > 1 ? (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{taskCount}</Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.dayCompleted]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.dayMissed]} />
          <Text style={styles.legendText}>Missed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.countBadgeLegend}>
            <Text style={styles.countBadgeText}>2+</Text>
          </View>
          <Text style={styles.legendText}>Multiple tasks</Text>
        </View>
      </View>

      {selectedDate ? (
        <View style={styles.detail}>
          <Text style={styles.detailDate}>{dayjs(selectedDate).format('ddd, MMM D')}</Text>
          {selectedStatus === 'completed' && selectedTasks.length > 0 ? (
            <View style={styles.taskList}>
              {selectedTasks.map((task, index) => (
                <View
                  key={task.id}
                  style={[styles.taskCard, index > 0 && styles.taskCardBorder]}
                >
                  <View style={styles.taskTop}>
                    <Text style={styles.taskKind}>
                      {task.counts_for_rating === false ? 'Bonus' : 'Rated'}
                    </Text>
                    <Text style={styles.detailReward}>
                      {task.counts_for_rating === false
                        ? 'no rating'
                        : `+${task.rating_awarded ?? task.rating_reward}`}
                    </Text>
                  </View>
                  <Text style={styles.detailTitle}>{task.title}</Text>
                  {task.hobby_name ? (
                    <Text style={styles.detailMeta}>{task.hobby_name}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : selectedStatus === 'missed' ? (
            <Text style={styles.detailMissed}>No task completed this day</Text>
          ) : selectedStatus === 'neutral' ? (
            <Text style={styles.detailMeta}>Finish today’s task to mark this day complete</Text>
          ) : (
            <Text style={styles.detailMeta}>Outside your HobbyFlow history</Text>
          )}
        </View>
      ) : (
        <Text style={styles.hint}>Tap a day for details</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  month: {
    color: onboardingColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  nav: {
    color: onboardingColors.text,
    fontSize: 28,
    fontWeight: '300',
    paddingHorizontal: 8,
  },
  navDisabled: {
    opacity: 0.25,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekday: {
    color: onboardingColors.textMuted,
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: '14.28%',
  },
  dayBubble: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  dayCompleted: {
    backgroundColor: '#059669',
  },
  dayMissed: {
    backgroundColor: '#F3EDE4',
  },
  dayNeutral: {
    backgroundColor: '#E8F6FE',
  },
  dayOutside: {
    backgroundColor: 'transparent',
  },
  dayTodayRing: {
    borderColor: '#E11D48',
    borderWidth: 2,
  },
  daySelected: {
    borderColor: onboardingColors.text,
    borderWidth: 2,
  },
  dayText: {
    color: onboardingColors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  dayCompletedText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayMissedText: {
    color: '#8B7355',
  },
  dayOutsideText: {
    color: '#D0C9BF',
  },
  dayTodayText: {
    color: '#E11D48',
    fontWeight: '800',
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: onboardingColors.text,
    borderRadius: 8,
    height: 14,
    justifyContent: 'center',
    marginTop: -6,
    minWidth: 14,
    paddingHorizontal: 3,
  },
  countBadgeLegend: {
    alignItems: 'center',
    backgroundColor: onboardingColors.text,
    borderRadius: 4,
    height: 14,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 3,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: 2,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  legendSwatch: {
    borderRadius: 4,
    height: 12,
    width: 12,
  },
  legendText: {
    color: onboardingColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  detail: {
    backgroundColor: '#F9F7F2',
    borderRadius: radii.card,
    gap: 8,
    marginTop: spacing.xs,
    padding: spacing.md,
  },
  detailDate: {
    color: onboardingColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  taskList: {
    gap: spacing.sm,
  },
  taskCard: {
    gap: 2,
  },
  taskCardBorder: {
    borderTopColor: onboardingColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
  },
  taskTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskKind: {
    color: onboardingColors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  detailTitle: {
    color: onboardingColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  detailMeta: {
    color: onboardingColors.textMuted,
    fontSize: 13,
  },
  detailReward: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '800',
  },
  detailMissed: {
    color: '#B45309',
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    color: onboardingColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
