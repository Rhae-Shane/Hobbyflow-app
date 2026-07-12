import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import dayjs from 'dayjs';
import Svg, { Path } from 'react-native-svg';
import {
  dashboardColors,
  dashboardRadii,
} from '@/constants/dashboardTokens';
import { toDateKey } from '@/lib/gamification/streakMath';
import { spacing } from '@/constants/tokens';

type Props = {
  activityDates: string[];
  onPress?: () => void;
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function CapIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10L12 5L21 10L12 15L3 10Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M7 12V16C7 16 9.5 19 12 19C14.5 19 17 16 17 16V12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function WeekActivityStrip({ activityDates, onPress }: Props) {
  const todayKey = toDateKey();
  const activeSet = useMemo(() => new Set(activityDates), [activityDates]);

  const days = useMemo(() => {
    // Always Sun–Sat for the strip, independent of locale.
    const today = dayjs();
    const start = today.subtract(today.day(), 'day').startOf('day');
    return DAY_LABELS.map((label, i) => {
      const d = start.add(i, 'day');
      const key = d.format('YYYY-MM-DD');
      return {
        label,
        key,
        isToday: key === todayKey,
        hasActivity: activeSet.has(key),
      };
    });
  }, [activeSet, todayKey]);

  return (
    <Pressable
      style={styles.strip}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel="Open daily tasks"
      testID="week-activity-strip"
    >
      {days.map((day) => {
        const filled = day.hasActivity || day.isToday;
        const bg = day.isToday
          ? dashboardColors.weekToday
          : day.hasActivity
            ? dashboardColors.weekFill
            : 'transparent';
        const borderStyle = filled
          ? undefined
          : {
              borderColor: dashboardColors.weekEmpty,
              borderStyle: 'dashed' as const,
              borderWidth: 1.5,
            };

        return (
          <View key={day.key} style={styles.dayCol}>
            <Text style={[styles.label, day.isToday && styles.labelToday]}>{day.label}</Text>
            <View style={[styles.circle, { backgroundColor: bg }, borderStyle]}>
              {filled ? <CapIcon color="#FFFFFF" /> : null}
            </View>
          </View>
        );
      })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: {
    backgroundColor: dashboardColors.surface,
    borderRadius: dashboardRadii.strip,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.md,
  },
  dayCol: {
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: dashboardColors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  labelToday: {
    color: dashboardColors.text,
    fontWeight: '800',
  },
  circle: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
});
