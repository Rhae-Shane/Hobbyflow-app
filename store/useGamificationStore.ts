import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createLogger } from '@/lib/logger';
import { MISS_PENALTY_RATING, STARTING_RATING } from '@/lib/gamification/constants';
import { FALLBACK_LEAGUES, findLeague } from '@/lib/gamification/leagues';
import { resolveMissedDays, toDateKey, withActivityDay } from '@/lib/gamification/streakMath';
import {
  completeDailyTaskApi,
  fetchDailyTaskHistory,
  fetchTodayDailyTasks,
  generateDailyTask,
  type GenerateDailyTaskMode,
} from '@/services/dailyTasks';
import {
  ensureUserGamification,
  fetchLeaderboard,
  fetchLeagues,
  fetchTodayDailyTask,
  updateUserGamification,
} from '@/services/gamification';
import type {
  DailyTaskHistoryItem,
  DailyTaskRow,
  LeaderboardEntry,
  LeagueRow,
  TodayDailyTasksResponse,
} from '@/types/gamification.types';
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
  todayBundle: TodayDailyTasksResponse | null;
  historyItems: DailyTaskHistoryItem[];
  historyMemberSince: string | null;
  leaderboard: LeaderboardEntry[];
  myRank: number;
  leagues: LeagueRow[];
  hydrationStatus: 'idle' | 'loading' | 'done';
  isCompletingTask: boolean;
  isGeneratingTask: boolean;
  lastTaskError: string | null;
  setUserId: (userId: string | null) => void;
  clearSession: () => void;
  hydrate: (userId: string, hobbies?: HobbyRow[]) => Promise<void>;
  refreshTodayTasks: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  generateTodayTask: (mode: GenerateDailyTaskMode) => Promise<DailyTaskRow | null>;
  completeDailyTask: (taskId?: string) => Promise<{ ratingAwarded: number } | null>;
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

function applyTodayBundle(
  set: (partial: Partial<GamificationState>) => void,
  bundle: TodayDailyTasksResponse,
) {
  set({
    todayBundle: bundle,
    todayTask: bundle.primary,
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
      todayBundle: null,
      historyItems: [],
      historyMemberSince: null,
      leaderboard: [],
      myRank: 0,
      leagues: FALLBACK_LEAGUES,
      hydrationStatus: 'idle',
      isCompletingTask: false,
      isGeneratingTask: false,
      lastTaskError: null,

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
          todayBundle: null,
          historyItems: [],
          historyMemberSince: null,
          leaderboard: [],
          myRank: 0,
          hydrationStatus: 'idle',
          isCompletingTask: false,
          isGeneratingTask: false,
          lastTaskError: null,
        }),

      hydrate: async (userId) => {
        set({ userId, hydrationStatus: 'loading', lastTaskError: null });
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

          try {
            const bundle = await fetchTodayDailyTasks();
            applyTodayBundle(set, bundle);
          } catch (err) {
            log.warn('Today tasks hydrate via API failed — falling back to Supabase', {
              error: err instanceof Error ? err.message : 'Unknown',
            });
            const task = await fetchTodayDailyTask(userId);
            set({ todayTask: task, todayBundle: null });
          }

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

      refreshTodayTasks: async () => {
        try {
          const bundle = await fetchTodayDailyTasks();
          applyTodayBundle(set, bundle);
          set({ lastTaskError: null });
        } catch (err) {
          log.warn('refreshTodayTasks failed', {
            error: err instanceof Error ? err.message : 'Unknown',
          });
        }
      },

      refreshHistory: async () => {
        try {
          const history = await fetchDailyTaskHistory();
          set({
            historyItems: history.items,
            historyMemberSince: history.member_since ?? null,
          });
        } catch (err) {
          log.warn('refreshHistory failed', {
            error: err instanceof Error ? err.message : 'Unknown',
          });
        }
      },

      generateTodayTask: async (mode) => {
        if (get().isGeneratingTask) return null;
        set({ isGeneratingTask: true, lastTaskError: null });
        try {
          const result = await generateDailyTask(mode);
          applyTodayBundle(set, result.today);
          log.info('Daily task generated', { mode, taskId: result.task.id });
          return result.task;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Could not generate task';
          set({ lastTaskError: message });
          log.error('generateTodayTask failed', { mode, error: message });
          return null;
        } finally {
          set({ isGeneratingTask: false });
        }
      },

      completeDailyTask: async (taskId) => {
        const { todayTask, todayBundle, isCompletingTask } = get();
        const openBonus = todayBundle?.bonus.find((t) => t.status === 'open');
        const targetId = taskId ?? todayBundle?.primary?.id ?? openBonus?.id ?? todayTask?.id;

        let target: DailyTaskRow | null = null;
        if (todayBundle) {
          if (todayBundle.primary?.id === targetId) {
            target = todayBundle.primary;
          } else {
            target = todayBundle.bonus.find((t) => t.id === targetId) ?? null;
          }
        }
        if (!target && todayTask?.id === targetId) {
          target = todayTask;
        }

        if (!target || target.status !== 'open' || isCompletingTask) {
          return null;
        }

        set({ isCompletingTask: true, lastTaskError: null });
        try {
          const result = await completeDailyTaskApi(target.id);
          applyTodayBundle(set, result.today);

          if (result.gamification) {
            set({
              rating: result.gamification.rating,
              peakRating: result.gamification.peak_rating,
              leagueId: result.gamification.league_id ?? 'wood',
              currentStreak: result.gamification.current_streak,
              longestStreak: result.gamification.longest_streak,
              activityDates: result.gamification.activity_dates,
              lastActivityDate: result.gamification.last_activity_date,
            });
          }

          void get().refreshLeaderboard();
          void get().refreshHistory();
          log.info('Daily task completed', {
            taskId: target.id,
            ratingAwarded: result.ratingAwarded,
          });
          return { ratingAwarded: result.ratingAwarded };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Could not complete task';
          set({ lastTaskError: message });
          log.error('Complete daily task failed', { error: message });
          return null;
        } finally {
          set({ isCompletingTask: false });
        }
      },

      onLessonCompleted: async (hobbyId) => {
        const { userId, todayTask, todayBundle, leagues, peakRating } = get();
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

        const openCandidates = [
          todayBundle?.primary,
          ...(todayBundle?.bonus ?? []),
          todayTask,
        ].filter(Boolean) as DailyTaskRow[];

        const match = openCandidates.find(
          (t) =>
            t.status === 'open' &&
            t.task_type === 'complete_lesson' &&
            (!t.hobby_id || !hobbyId || t.hobby_id === hobbyId),
        );

        if (match) {
          await get().completeDailyTask(match.id);
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
