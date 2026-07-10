import dayjs from 'dayjs';
import { STARTING_RATING } from '@/lib/gamification/constants';

export function toDateKey(date: Date | string = new Date()): string {
  return dayjs(date).format('YYYY-MM-DD');
}

/** Consecutive days ending today or yesterday (same rules as plan-store streak). */
export function computeStreakFromDates(activityDates: string[]): number {
  if (activityDates.length === 0) return 0;

  const unique = [...new Set(activityDates)].sort((a, b) => b.localeCompare(a));
  const today = toDateKey();
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

  if (unique[0] !== today && unique[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const diffDays = dayjs(unique[i - 1]).diff(dayjs(unique[i]), 'day');
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Calendar days strictly between lastActivity and yesterday (inclusive of gap days).
 * Used for miss / saver resolution.
 */
export function missedDatesSince(lastActivityDate: string | null, today = toDateKey()): string[] {
  if (!lastActivityDate) return [];

  const last = dayjs(lastActivityDate);
  const end = dayjs(today).subtract(1, 'day');
  if (!last.isValid() || end.diff(last, 'day') < 1) return [];

  const missed: string[] = [];
  let cursor = last.add(1, 'day');
  while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
    missed.push(cursor.format('YYYY-MM-DD'));
    cursor = cursor.add(1, 'day');
  }
  return missed;
}

export type MissResolution = {
  activityDates: string[];
  saverUsedDates: string[];
  streakSavers: number;
  currentStreak: number;
  longestStreak: number;
  rating: number;
  ratingDeducted: number;
  saversUsed: number;
};

/**
 * Apply streak savers for missed days; if savers run out, reset streak and deduct rating.
 * Saver-protected days are recorded in saverUsedDates (not activityDates).
 */
export function resolveMissedDays(input: {
  activityDates: string[];
  saverUsedDates: string[];
  streakSavers: number;
  longestStreak: number;
  rating: number;
  lastActivityDate: string | null;
  missPenalty: number;
  today?: string;
}): MissResolution {
  const today = input.today ?? toDateKey();
  const missed = missedDatesSince(input.lastActivityDate, today);

  let streakSavers = input.streakSavers;
  let rating = input.rating;
  let ratingDeducted = 0;
  let saversUsed = 0;
  const saverUsedDates = [...input.saverUsedDates];
  const activityDates = [...input.activityDates];
  let broke = false;

  for (const day of missed) {
    if (saverUsedDates.includes(day) || activityDates.includes(day)) continue;

    if (streakSavers > 0) {
      streakSavers -= 1;
      saversUsed += 1;
      saverUsedDates.push(day);
    } else {
      broke = true;
      ratingDeducted += input.missPenalty;
      rating = Math.max(STARTING_RATING, rating - input.missPenalty);
      break;
    }
  }

  if (broke) {
    const currentStreak = computeStreakFromDates(activityDates);
    const forcedZero =
      !activityDates.includes(today) &&
      !activityDates.includes(dayjs(today).subtract(1, 'day').format('YYYY-MM-DD'));
    return {
      activityDates,
      saverUsedDates,
      streakSavers,
      currentStreak: forcedZero ? 0 : currentStreak,
      longestStreak: input.longestStreak,
      rating,
      ratingDeducted,
      saversUsed,
    };
  }

  const currentStreak = computeStreakFromDates(activityDates);
  const preserved =
    currentStreak > 0
      ? currentStreak + saversUsed
      : saversUsed > 0
        ? saversUsed
        : 0;

  return {
    activityDates,
    saverUsedDates,
    streakSavers,
    currentStreak: preserved,
    longestStreak: Math.max(input.longestStreak, preserved),
    rating,
    ratingDeducted,
    saversUsed,
  };
}

export function withActivityDay(
  activityDates: string[],
  day = toDateKey(),
): { activityDates: string[]; currentStreak: number } {
  const next = activityDates.includes(day) ? activityDates : [...activityDates, day];
  return { activityDates: next, currentStreak: computeStreakFromDates(next) };
}
