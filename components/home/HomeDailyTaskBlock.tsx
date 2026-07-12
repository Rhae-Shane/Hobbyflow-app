import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import dayjs from 'dayjs';
import Svg, { Circle, Path } from 'react-native-svg';
import { useFocusEffect } from 'expo-router';
import {
  dashboardColors,
  dashboardRadii,
} from '@/constants/dashboardTokens';
import { toDateKey } from '@/lib/gamification/streakMath';
import { spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { useGamificationStore } from '@/store/useGamificationStore';
import type { DailyTaskRow } from '@/types/gamification.types';
import { hapticLight, hapticSuccess } from '@/utils/haptics';

type Props = {
  onOpenDailyTasks: () => void;
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

type DayCell = {
  key: string;
  label: string;
  isToday: boolean;
  isFuture: boolean;
  completed: boolean;
};

function CheckIcon({ color = '#FFFFFF' }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 13L9.5 17.5L19 7"
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CrossIcon({ color = '#8A8F98' }: { color?: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 7L17 17M17 7L7 17"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PendingDot() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3.5} fill="#C0C0C4" />
    </Svg>
  );
}

/**
 * Daily Task card: week icons only by default.
 * Tap a day to reveal task / incomplete text; tap again or outside to close.
 */
export function HomeDailyTaskBlock({ onOpenDailyTasks }: Props) {
  const { user } = useAuth();
  const activityDates = useGamificationStore((s) => s.activityDates);
  const historyItems = useGamificationStore((s) => s.historyItems);
  const todayTask = useGamificationStore((s) => s.todayTask);
  const todayBundle = useGamificationStore((s) => s.todayBundle);
  const isCompleting = useGamificationStore((s) => s.isCompletingTask);
  const isGenerating = useGamificationStore((s) => s.isGeneratingTask);
  const completeDailyTask = useGamificationStore((s) => s.completeDailyTask);
  const refreshTodayTasks = useGamificationStore((s) => s.refreshTodayTasks);
  const refreshHistory = useGamificationStore((s) => s.refreshHistory);
  const generateTodayTask = useGamificationStore((s) => s.generateTodayTask);
  const hydrate = useGamificationStore((s) => s.hydrate);

  const todayKey = toDateKey();
  const task = todayBundle?.primary ?? todayTask;
  const todayDone = task?.status === 'completed';

  const [openDayKey, setOpenDayKey] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      void hydrate(user.id).then(() => {
        void refreshTodayTasks();
        void refreshHistory();
      });
    }, [hydrate, refreshHistory, refreshTodayTasks, user?.id]),
  );

  useEffect(() => {
    setOpenDayKey(null);
  }, [todayKey]);

  const completedSet = useMemo(() => {
    const set = new Set(activityDates);
    if (todayDone) set.add(todayKey);
    for (const item of historyItems) {
      if (item.kind === 'completed') set.add(item.task_date);
    }
    return set;
  }, [activityDates, historyItems, todayDone, todayKey]);

  const days = useMemo((): DayCell[] => {
    const today = dayjs(todayKey);
    const start = today.subtract(today.day(), 'day').startOf('day');
    return DAY_LABELS.map((label, i) => {
      const d = start.add(i, 'day');
      const key = d.format('YYYY-MM-DD');
      const isToday = key === todayKey;
      const isFuture = d.isAfter(today, 'day');
      const completed = !isFuture && completedSet.has(key);
      return { key, label, isToday, isFuture, completed };
    });
  }, [completedSet, todayKey]);

  const openDay = days.find((d) => d.key === openDayKey) ?? null;

  const historyTasksForDay = useMemo((): DailyTaskRow[] => {
    if (!openDay) return [];
    const hit = historyItems.find(
      (item) => item.kind === 'completed' && item.task_date === openDay.key,
    );
    if (hit && hit.kind === 'completed') return hit.tasks;
    if (openDay.isToday && todayDone && task) return [task];
    return [];
  }, [historyItems, openDay, task, todayDone]);

  const closeDetail = () => setOpenDayKey(null);

  const onSelectDay = (day: DayCell) => {
    if (day.isFuture) return;
    hapticLight();
    setOpenDayKey((prev) => (prev === day.key ? null : day.key));
  };

  const onMarkComplete = () => {
    if (!task || todayDone) return;
    hapticSuccess();
    void completeDailyTask(task.id);
  };

  return (
    <Pressable
      style={styles.card}
      onPress={openDayKey ? closeDetail : undefined}
      testID="home-daily-task-block"
    >
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Daily Task</Text>
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onOpenDailyTasks();
          }}
          hitSlop={8}
        >
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {days.map((day) => {
          const isOpen = day.key === openDayKey;
          return (
            <Pressable
              key={day.key}
              style={styles.dayCol}
              onPress={(e) => {
                e.stopPropagation?.();
                onSelectDay(day);
              }}
              disabled={day.isFuture}
              accessibilityRole="button"
              accessibilityLabel={`${day.label}${day.completed ? ', completed' : ', incomplete'}`}
              testID={`home-day-${day.key}`}
            >
              <Text
                style={[
                  styles.dayLabel,
                  day.isToday && styles.dayLabelToday,
                  isOpen && styles.dayLabelSelected,
                ]}
              >
                {day.label}
              </Text>
              <View
                style={[
                  styles.dayCircle,
                  day.isFuture && styles.dayCircleFuture,
                  day.completed && styles.dayCircleDone,
                  !day.isFuture && !day.completed && styles.dayCircleMissed,
                  isOpen && styles.dayCircleSelected,
                ]}
              >
                {day.isFuture ? (
                  <PendingDot />
                ) : day.completed ? (
                  <CheckIcon />
                ) : (
                  <CrossIcon />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {openDay ? (
        <Pressable onPress={(e) => e.stopPropagation?.()}>
          <View style={styles.detailPanel} testID="home-day-detail">
            <View style={styles.detailHeader}>
              <Text style={styles.detailDay}>
                {openDay.isToday ? 'Today' : openDay.label} ·{' '}
                {dayjs(openDay.key).format('MMM D')}
              </Text>
              <Pressable onPress={closeDetail} hitSlop={10} accessibilityLabel="Close">
                <CrossIcon color={dashboardColors.text} />
              </Pressable>
            </View>

            {openDay.completed ? (
              <>
                <View style={styles.statusRow}>
                  <View style={styles.statusChipDone}>
                    <CheckIcon color="#FFFFFF" />
                    <Text style={styles.statusChipDoneText}>Completed</Text>
                  </View>
                </View>
                {historyTasksForDay.length > 0 ? (
                  historyTasksForDay.map((t) => (
                    <Text key={t.id} style={styles.detailTask} numberOfLines={3}>
                      {t.title}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.detailTask}>You completed your daily task.</Text>
                )}
                <Pressable onPress={onOpenDailyTasks} hitSlop={6}>
                  <Text style={styles.link}>View all tasks</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.statusRow}>
                  <View style={styles.statusChipMissed}>
                    <CrossIcon color="#C45C1A" />
                    <Text style={styles.statusChipMissedText}>Incomplete</Text>
                  </View>
                </View>
                <Text style={styles.detailMissed}>You haven’t completed a task.</Text>
                {openDay.isToday ? (
                  <View style={styles.todayActions}>
                    {task?.status === 'open' ? (
                      <>
                        <Text style={styles.pendingTitle} numberOfLines={2}>
                          {task.title}
                        </Text>
                        <Pressable
                          style={styles.cta}
                          onPress={onMarkComplete}
                          disabled={isCompleting}
                          testID="home-complete-daily-task"
                        >
                          {isCompleting ? (
                            <ActivityIndicator color={dashboardColors.ctaText} />
                          ) : (
                            <Text style={styles.ctaText}>Mark complete</Text>
                          )}
                        </Pressable>
                      </>
                    ) : (
                      <Pressable
                        style={styles.cta}
                        onPress={() => void generateTodayTask('primary')}
                        disabled={isGenerating}
                        testID="home-generate-daily-task"
                      >
                        {isGenerating ? (
                          <ActivityIndicator color={dashboardColors.ctaText} />
                        ) : (
                          <Text style={styles.ctaText}>Get today’s task</Text>
                        )}
                      </Pressable>
                    )}
                  </View>
                ) : null}
              </>
            )}
          </View>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardColors.surface,
    borderRadius: dashboardRadii.block,
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heading: {
    color: dashboardColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  seeAll: {
    color: dashboardColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    gap: 8,
  },
  dayLabel: {
    color: dashboardColors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  dayLabelToday: {
    color: dashboardColors.text,
    fontWeight: '800',
  },
  dayLabelSelected: {
    color: dashboardColors.text,
    fontWeight: '800',
  },
  dayCircle: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  dayCircleFuture: {
    backgroundColor: '#F0F0F0',
  },
  dayCircleDone: {
    backgroundColor: '#059669',
  },
  dayCircleMissed: {
    backgroundColor: '#ECECF0',
  },
  dayCircleSelected: {
    borderColor: dashboardColors.text,
    borderWidth: 2,
  },
  detailPanel: {
    backgroundColor: '#F7F8FA',
    borderRadius: 16,
    gap: 8,
    padding: spacing.md,
  },
  detailHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailDay: {
    color: dashboardColors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
  },
  statusChipDone: {
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusChipDoneText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  statusChipMissed: {
    alignItems: 'center',
    backgroundColor: '#FFE4D1',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusChipMissedText: {
    color: '#C45C1A',
    fontSize: 12,
    fontWeight: '800',
  },
  detailTask: {
    color: dashboardColors.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  detailMissed: {
    color: dashboardColors.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  link: {
    color: dashboardColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  todayActions: {
    gap: spacing.sm,
    marginTop: 4,
  },
  pendingTitle: {
    color: dashboardColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  cta: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: dashboardColors.cta,
    borderRadius: dashboardRadii.pill,
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 120,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  ctaText: {
    color: dashboardColors.ctaText,
    fontSize: 13,
    fontWeight: '800',
  },
});
