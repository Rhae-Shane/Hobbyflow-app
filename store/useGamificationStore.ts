import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createLogger } from '@/lib/logger';
import { MISS_PENALTY_RATING, STARTING_RATING, streakBonusFor } from '@/lib/gamification/constants';
import { FALLBACK_LEAGUES, findLeague } from '@/lib/gamification/leagues';
import { resolveMissedDays, toDateKey, withActivityDay } from '@/lib/gamification/streakMath';
import {
  ensureTodayDailyTask,
  ensureUserGamification,
  fetchLeaderboard,
  fetchLeagues,
  markDailyTaskCompleted,
  updateUserGamification,
} from '@/services/gamification';
import type { DailyTaskRow, LeaderboardEntry, LeagueRow } from '@/types/gamification.types';
import type { HobbyRow } from '@/types/user.types';

const log = createLogger('gamification-store');

type GamificationState = {
  userId: string | null;
  rating: number;
  peakRating: number;
  leagueId: string;
  pactsFulfilled: number;
  currentStreak: number;
  longestStreak: number;
  streakSavers: number;
  activityDates: string[];
  saverUsedDates: string[];
  lastActivityDate: string | null;
  todayTask: DailyTaskRow | null;
  leaderboard: LeaderboardEntry[];
  myRank: number;
  leagues: LeagueRow[];
  hydrationStatus: 'idle' | 'loading' | 'done';
  isCompletingTask: boolean;
  setUserId: (userId: string | null) => void;
  clearSession: () => void;
  hydrate: (userId: string, hobbies: HobbyRow[]) => Promise<void>;
  completeDailyTask: () => Promise<{ ratingAwarded: number } | null>;
  onLessonCompleted: (hobbyId: string | null | undefined) => Promise<void>;
  refreshLeaderboard: () => Promise<void>;
  leagueName: () => string;
};

function applyRow(
  set: (partial: Partial<GamificationState>) => void,
  row: {
    current_streak: number;
    longest_streak: number;
    streak_savers: number;
    activity_dates: string[];
    saver_used_dates: string[];
    last_activity_date: string | null;
    rating?: number;
    peak_rating?: number;
    league_id?: string | null;
    pacts_fulfilled?: number;
  },
) {
  set({
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    streakSavers: row.streak_savers,
    activityDates: row.activity_dates ?? [],
    saverUsedDates: row.saver_used_dates ?? [],
    lastActivityDate: row.last_activity_date,
    rating: row.rating ?? STARTING_RATING,
    peakRating: row.peak_rating ?? STARTING_RATING,
    leagueId: row.league_id ?? 'wood',
    pactsFulfilled: row.pacts_fulfilled ?? 0,
  });
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      userId: null,
      rating: STARTING_RATING,
      peakRating: STARTING_RATING,
      leagueId: 'wood',
      pactsFulfilled: 0,
      currentStreak: 0,
      longestStreak: 0,
      streakSavers: 3,
      activityDates: [],
      saverUsedDates: [],
      lastActivityDate: null,
      todayTask: null,
      leaderboard: [],
      myRank: 0,
      leagues: FALLBACK_LEAGUES,
      hydrationStatus: 'idle',
      isCompletingTask: false,

      setUserId: (userId) => set({ userId }),

      leagueName: () => findLeague(get().leagueId, get().leagues).name,

      clearSession: () =>
        set({
          userId: null,
          rating: STARTING_RATING,
          peakRating: STARTING_RATING,
          leagueId: 'wood',
          pactsFulfilled: 0,
          currentStreak: 0,
          longestStreak: 0,
          streakSavers: 3,
          activityDates: [],
          saverUsedDates: [],
          lastActivityDate: null,
          todayTask: null,
          leaderboard: [],
          myRank: 0,
          hydrationStatus: 'idle',
          isCompletingTask: false,
        }),

      hydrate: async (userId, hobbies) => {
        set({ userId, hydrationStatus: 'loading' });
        try {
          const leagues = await fetchLeagues();
          set({ leagues });

          let row = await ensureUserGamification(userId);

          const resolution = resolveMissedDays({
            activityDates: row.activity_dates ?? [],
            saverUsedDates: row.saver_used_dates ?? [],
            streakSavers: row.streak_savers,
            longestStreak: row.longest_streak,
            rating: row.rating ?? STARTING_RATING,
            lastActivityDate: row.last_activity_date,
            missPenalty: MISS_PENALTY_RATING,
          });

          const missChanged =
            resolution.saversUsed > 0 ||
            resolution.ratingDeducted > 0 ||
            resolution.currentStreak !== row.current_streak ||
            resolution.streakSavers !== row.streak_savers;

          if (missChanged) {
            row = await updateUserGamification(
              userId,
              {
                rating: resolution.rating,
                current_streak: resolution.currentStreak,
                longest_streak: resolution.longestStreak,
                streak_savers: resolution.streakSavers,
                activity_dates: resolution.activityDates,
                saver_used_dates: resolution.saverUsedDates,
              },
              { leagues, peakRating: row.peak_rating },
            );
            log.info('Miss / saver resolution applied', {
              userId,
              saversUsed: resolution.saversUsed,
              ratingDeducted: resolution.ratingDeducted,
              currentStreak: resolution.currentStreak,
            });
          }

          applyRow(set, row);

          const task = await ensureTodayDailyTask(userId, hobbies);
          set({ todayTask: task });

          try {
            const board = await fetchLeaderboard(userId);
            set({ leaderboard: board.entries, myRank: board.myRank });
          } catch (err) {
            log.warn('Leaderboard hydrate skipped', {
              error: err instanceof Error ? err.message : 'Unknown',
            });
          }

          set({ hydrationStatus: 'done' });
        } catch (err) {
          log.warn('Gamification hydrate failed', {
            userId,
            error: err instanceof Error ? err.message : 'Unknown',
          });
          set({ hydrationStatus: 'done' });
        }
      },

      completeDailyTask: async () => {
        const { userId, todayTask, isCompletingTask, leagues, peakRating } = get();
        if (!userId || !todayTask || todayTask.status !== 'open' || isCompletingTask) {
          return null;
        }

        set({ isCompletingTask: true });
        try {
          const completed = await markDailyTaskCompleted(todayTask.id, userId);
          const today = toDateKey();
          const { activityDates, currentStreak } = withActivityDay(get().activityDates, today);
          const longestStreak = Math.max(get().longestStreak, currentStreak);
          const bonus = streakBonusFor(currentStreak);
          const ratingAwarded = completed.rating_reward + bonus;
          const rating = get().rating + ratingAwarded;

          const row = await updateUserGamification(
            userId,
            {
              rating,
              current_streak: currentStreak,
              longest_streak: longestStreak,
              activity_dates: activityDates,
              last_activity_date: today,
            },
            { leagues, peakRating },
          );

          applyRow(set, row);
          set({ todayTask: completed });

          void get().refreshLeaderboard();
          log.info('Daily task completed', { userId, ratingAwarded, currentStreak, rating: row.rating });
          return { ratingAwarded };
        } catch (err) {
          log.error('Complete daily task failed', {
            error: err instanceof Error ? err.message : 'Unknown',
          });
          return null;
        } finally {
          set({ isCompletingTask: false });
        }
      },

      onLessonCompleted: async (hobbyId) => {
        const { userId, todayTask, leagues, peakRating } = get();
        if (!userId) return;

        const today = toDateKey();
        if (!get().activityDates.includes(today)) {
          const { activityDates, currentStreak } = withActivityDay(get().activityDates, today);
          const longestStreak = Math.max(get().longestStreak, currentStreak);
          try {
            const row = await updateUserGamification(
              userId,
              {
                activity_dates: activityDates,
                current_streak: currentStreak,
                longest_streak: longestStreak,
                last_activity_date: today,
              },
              { leagues, peakRating },
            );
            applyRow(set, row);
          } catch (err) {
            log.warn('Activity day sync failed', {
              error: err instanceof Error ? err.message : 'Unknown',
            });
          }
        }

        if (
          todayTask?.status === 'open' &&
          todayTask.task_type === 'complete_lesson' &&
          (!todayTask.hobby_id || !hobbyId || todayTask.hobby_id === hobbyId)
        ) {
          await get().completeDailyTask();
        }
      },

      refreshLeaderboard: async () => {
        const { userId } = get();
        if (!userId) return;
        try {
          const board = await fetchLeaderboard(userId);
          set({ leaderboard: board.entries, myRank: board.myRank });
        } catch (err) {
          log.warn('Leaderboard refresh failed', {
            error: err instanceof Error ? err.message : 'Unknown',
          });
        }
      },
    }),
    {
      name: 'hobbyflow-gamification',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userId: state.userId,
        rating: state.rating,
        peakRating: state.peakRating,
        leagueId: state.leagueId,
        pactsFulfilled: state.pactsFulfilled,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        streakSavers: state.streakSavers,
        activityDates: state.activityDates,
        saverUsedDates: state.saverUsedDates,
        lastActivityDate: state.lastActivityDate,
      }),
    },
  ),
);
