import {
  computeStreakFromDates,
  missedDatesSince,
  resolveMissedDays,
  withActivityDay,
} from '@/lib/gamification/streakMath';
import { buildDailyTaskDraft } from '@/lib/gamification/dailyTaskFactory';
import { streakBonusFor } from '@/lib/gamification/constants';
import type { HobbyRow } from '@/types/user.types';

describe('streakMath', () => {
  it('computes consecutive streak ending today', () => {
    const today = '2026-07-11';
    jest.useFakeTimers().setSystemTime(new Date('2026-07-11T12:00:00Z'));
    expect(computeStreakFromDates(['2026-07-11', '2026-07-10', '2026-07-09'])).toBe(3);
    expect(computeStreakFromDates(['2026-07-09'])).toBe(0);
    expect(withActivityDay(['2026-07-10'], today).currentStreak).toBe(2);
    jest.useRealTimers();
  });

  it('lists missed dates between last activity and yesterday', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-11T12:00:00Z'));
    expect(missedDatesSince('2026-07-08')).toEqual(['2026-07-09', '2026-07-10']);
    expect(missedDatesSince('2026-07-10')).toEqual([]);
    jest.useRealTimers();
  });

  it('uses streak savers before breaking streak', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-11T12:00:00Z'));
    const result = resolveMissedDays({
      activityDates: ['2026-07-08'],
      saverUsedDates: [],
      streakSavers: 3,
      longestStreak: 5,
      rating: 720,
      lastActivityDate: '2026-07-08',
      missPenalty: 5,
    });
    expect(result.saversUsed).toBe(2);
    expect(result.streakSavers).toBe(1);
    expect(result.ratingDeducted).toBe(0);
    expect(result.currentStreak).toBeGreaterThan(0);
    jest.useRealTimers();
  });

  it('deducts rating when savers are exhausted', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-11T12:00:00Z'));
    const result = resolveMissedDays({
      activityDates: ['2026-07-07'],
      saverUsedDates: [],
      streakSavers: 1,
      longestStreak: 4,
      rating: 720,
      lastActivityDate: '2026-07-07',
      missPenalty: 5,
    });
    expect(result.saversUsed).toBe(1);
    expect(result.ratingDeducted).toBe(5);
    expect(result.rating).toBe(715);
    expect(result.currentStreak).toBe(0);
    jest.useRealTimers();
  });
});

describe('dailyTaskFactory', () => {
  const hobbies: HobbyRow[] = [
    {
      id: 'h1',
      user_id: 'u1',
      name: 'Guitar',
      level: 'beginner',
      goal: '',
      is_active: true,
      created_at: '',
      updated_at: '',
    },
    {
      id: 'h2',
      user_id: 'u1',
      name: 'Chess',
      level: 'beginner',
      goal: '',
      is_active: false,
      created_at: '',
      updated_at: '',
    },
  ];

  it('picks a deterministic hobby task', () => {
    const a = buildDailyTaskDraft('user-1', '2026-07-11', hobbies);
    const b = buildDailyTaskDraft('user-1', '2026-07-11', hobbies);
    expect(a).toEqual(b);
    expect(a.hobby_id).toBeTruthy();
    expect(a.rating_reward).toBe(10);
    expect(a.title).toMatch(/Guitar|Chess/);
  });
});

describe('streakBonusFor', () => {
  it('caps streak bonus', () => {
    expect(streakBonusFor(0)).toBe(0);
    expect(streakBonusFor(3)).toBe(3);
    expect(streakBonusFor(20)).toBe(7);
  });
});
