import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import dayjs from 'dayjs';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import { toDateKey } from '@/lib/gamification/streakMath';
import { isDateInPactRange } from '@/lib/pact/pactMath';

export type PactCalendarRange = {
  startDate: string;
  endDate: string;
};

type Props = {
  activityDates: string[];
  saverUsedDates: string[];
  /** Active pact window — days in range get a pact marker on the calendar. */
  pactRange?: PactCalendarRange | null;
  /** When set, tapping a day in [min, max] calls onSelectDate. */
  selectableMin?: string | null;
  selectableMax?: string | null;
  onSelectDate?: (dateKey: string) => void;
  selectHint?: string | null;
};

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function StreakCalendar({
  activityDates,
  saverUsedDates,
  pactRange = null,
  selectableMin = null,
  selectableMax = null,
  onSelectDate,
  selectHint = null,
}: Props) {
  const [cursor, setCursor] = useState(() => dayjs().startOf('month'));
  const today = toDateKey();
  const activitySet = useMemo(() => new Set(activityDates), [activityDates]);
  const saverSet = useMemo(() => new Set(saverUsedDates), [saverUsedDates]);
  const canSelect = Boolean(onSelectDate && selectableMin);

  const cells = useMemo(() => {
    const start = cursor.startOf('month');
    const daysInMonth = start.daysInMonth();
    const offset = start.day();
    const items: Array<{ key: string; label: string; dateKey: string | null }> = [];

    for (let i = 0; i < offset; i++) {
      items.push({ key: `pad-${i}`, label: '', dateKey: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = start.date(d).format('YYYY-MM-DD');
      items.push({ key: dateKey, label: String(d), dateKey });
    }
    return items;
  }, [cursor]);

  const todayDow = dayjs(today).day();
  const showPactLegend = Boolean(pactRange);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Pressable
          onPress={() => setCursor((c) => c.subtract(1, 'month'))}
          accessibilityLabel="Previous month"
          hitSlop={8}
        >
          <Text style={styles.nav}>‹</Text>
        </Pressable>
        <Text style={styles.month}>{cursor.format('MMMM YYYY')}</Text>
        <Pressable
          onPress={() => setCursor((c) => c.add(1, 'month'))}
          accessibilityLabel="Next month"
          hitSlop={8}
        >
          <Text style={styles.nav}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((d, i) => (
          <Text key={`${d}-${i}`} style={[styles.weekday, i === todayDow && styles.weekdayToday]}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell) => {
          if (!cell.dateKey) {
            return <View key={cell.key} style={styles.cell} />;
          }
          const isToday = cell.dateKey === today;
          const isActive = activitySet.has(cell.dateKey);
          const isSaved = saverSet.has(cell.dateKey);
          const isFuture = cell.dateKey > today;
          const isPactDay =
            pactRange != null &&
            isDateInPactRange(cell.dateKey, pactRange.startDate, pactRange.endDate);
          const isPactStart = pactRange != null && cell.dateKey === pactRange.startDate;
          const isPactEnd = pactRange != null && cell.dateKey === pactRange.endDate;
          const isSelectable =
            canSelect &&
            cell.dateKey >= selectableMin! &&
            (selectableMax == null || cell.dateKey <= selectableMax);

          const bubble = (
            <View
              style={[
                styles.dayBubble,
                isPactDay && styles.dayPact,
                isToday && styles.dayToday,
                isActive && styles.dayActive,
                isSaved && !isActive && styles.daySaved,
                isPactStart && styles.dayPactEdge,
                isPactEnd && styles.dayPactEdge,
                isSelectable && styles.daySelectable,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  (isFuture || (!isActive && !isToday && !isSaved && !isPactDay)) &&
                    styles.dayMuted,
                  isPactDay && !isActive && styles.dayPactText,
                  isToday && styles.dayTodayText,
                  isActive && styles.dayActiveText,
                  canSelect && !isSelectable && styles.dayMuted,
                ]}
              >
                {cell.label}
              </Text>
            </View>
          );

          return (
            <View key={cell.key} style={styles.cell}>
              {isSelectable ? (
                <Pressable
                  onPress={() => onSelectDate?.(cell.dateKey!)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${cell.dateKey}`}
                  hitSlop={4}
                >
                  {bubble}
                </Pressable>
              ) : (
                bubble
              )}
              {isPactDay ? <View style={styles.pactDot} /> : null}
            </View>
          );
        })}
      </View>

      {selectHint ? <Text style={styles.selectHint}>{selectHint}</Text> : null}

      {showPactLegend ? (
        <View style={styles.legend} accessibilityLabel="Pact days on calendar">
          <View style={styles.legendSwatch} />
          <Text style={styles.legendText}>
            The Pact · {pactRange!.startDate.slice(5)} → {pactRange!.endDate.slice(5)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
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
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekday: {
    color: onboardingColors.textMuted,
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  weekdayToday: {
    color: '#E11D48',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    alignItems: 'center',
    height: 44,
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
  dayToday: {
    borderColor: '#E11D48',
    borderWidth: 2,
  },
  dayActive: {
    backgroundColor: onboardingColors.primary,
  },
  daySaved: {
    backgroundColor: '#FEF3C7',
  },
  dayPact: {
    backgroundColor: onboardingColors.chipSelectedBackground,
  },
  dayPactEdge: {
    borderColor: onboardingColors.primaryBorder,
    borderWidth: 1.5,
  },
  daySelectable: {
    borderColor: onboardingColors.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dayText: {
    color: onboardingColors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  dayMuted: {
    color: '#C4BDB3',
  },
  dayTodayText: {
    color: '#E11D48',
    fontWeight: '800',
  },
  dayActiveText: {
    color: onboardingColors.primaryText,
  },
  dayPactText: {
    color: onboardingColors.primaryText,
    fontWeight: '700',
  },
  pactDot: {
    backgroundColor: onboardingColors.primaryBorder,
    borderRadius: 2,
    height: 3,
    marginTop: 2,
    width: 3,
  },
  selectHint: {
    color: onboardingColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  legend: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  legendSwatch: {
    backgroundColor: onboardingColors.chipSelectedBackground,
    borderColor: onboardingColors.primaryBorder,
    borderRadius: 4,
    borderWidth: 1,
    height: 12,
    width: 12,
  },
  legendText: {
    color: onboardingColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});
