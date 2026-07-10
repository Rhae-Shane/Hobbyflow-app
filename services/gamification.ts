import { createLogger } from '@/lib/logger';
import { AppError, ErrorCodes, getKnownUserMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { LEADERBOARD_LIMIT, STARTING_RATING } from '@/lib/gamification/constants';
import { buildDailyTaskDraft } from '@/lib/gamification/dailyTaskFactory';
import { FALLBACK_LEAGUES, ratingFieldsFromRating } from '@/lib/gamification/leagues';
import { toDateKey } from '@/lib/gamification/streakMath';
import type {
  DailyTaskRow,
  LeaderboardEntry,
  LeagueRow,
  UserGamificationRow,
} from '@/types/gamification.types';
import type { HobbyRow } from '@/types/user.types';

const log = createLogger('gamification');

const GAMIFICATION_SELECT =
  'user_id, current_streak, longest_streak, streak_savers, activity_dates, saver_used_dates, last_activity_date, rating, peak_rating, league_id, pacts_fulfilled, created_at, updated_at';

const DAILY_TASK_SELECT =
  'id, user_id, hobby_id, task_date, task_type, title, rating_reward, status, completed_at, created_at, updated_at';

function normalizeGamification(row: UserGamificationRow): UserGamificationRow {
  return {
    ...row,
    activity_dates: row.activity_dates ?? [],
    saver_used_dates: row.saver_used_dates ?? [],
    rating: row.rating ?? STARTING_RATING,
    peak_rating: row.peak_rating ?? STARTING_RATING,
    league_id: row.league_id ?? 'wood',
    pacts_fulfilled: row.pacts_fulfilled ?? 0,
  };
}

export async function fetchLeagues(): Promise<LeagueRow[]> {
  const { data, error } = await supabase
    .from('leagues')
    .select('id, name, sort_order, min_rating, max_rating, color_hex, icon_key')
    .order('sort_order', { ascending: true });

  if (error || !data?.length) {
    if (error) log.warn('Leagues fetch failed — using fallback', { error: error.message });
    return FALLBACK_LEAGUES;
  }

  return data as LeagueRow[];
}

export async function ensureUserGamification(userId: string): Promise<UserGamificationRow> {
  const existing = await fetchUserGamification(userId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('user_gamification')
    .insert({
      user_id: userId,
      rating: STARTING_RATING,
      peak_rating: STARTING_RATING,
      league_id: 'wood',
    })
    .select(GAMIFICATION_SELECT)
    .single();

  if (error || !data) {
    const again = await fetchUserGamification(userId);
    if (again) return again;
    log.error('Failed to create gamification row', { userId, error: error?.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  return normalizeGamification(data as UserGamificationRow);
}

export async function fetchUserGamification(userId: string): Promise<UserGamificationRow | null> {
  const { data, error } = await supabase
    .from('user_gamification')
    .select(GAMIFICATION_SELECT)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    log.error('Failed to fetch gamification', { userId, error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  return data ? normalizeGamification(data as UserGamificationRow) : null;
}

export async function updateUserGamification(
  userId: string,
  patch: Partial<
    Pick<
      UserGamificationRow,
      | 'current_streak'
      | 'longest_streak'
      | 'streak_savers'
      | 'activity_dates'
      | 'saver_used_dates'
      | 'last_activity_date'
      | 'rating'
      | 'peak_rating'
      | 'league_id'
      | 'pacts_fulfilled'
    >
  >,
  options?: { leagues?: LeagueRow[]; peakRating?: number },
): Promise<UserGamificationRow> {
  const leagues = options?.leagues ?? FALLBACK_LEAGUES;
  const nextPatch = { ...patch };

  if (typeof patch.rating === 'number') {
    const ratingFields = ratingFieldsFromRating(
      patch.rating,
      options?.peakRating ?? STARTING_RATING,
      leagues,
    );
    nextPatch.rating = ratingFields.rating;
    nextPatch.peak_rating = ratingFields.peak_rating;
    nextPatch.league_id = ratingFields.league_id;
  }

  const { data, error } = await supabase
    .from('user_gamification')
    .update({ ...nextPatch, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select(GAMIFICATION_SELECT)
    .single();

  if (error || !data) {
    log.error('Failed to update gamification', { userId, error: error?.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  return normalizeGamification(data as UserGamificationRow);
}

export async function fetchTodayDailyTask(
  userId: string,
  taskDate = toDateKey(),
): Promise<DailyTaskRow | null> {
  const { data, error } = await supabase
    .from('daily_tasks')
    .select(DAILY_TASK_SELECT)
    .eq('user_id', userId)
    .eq('task_date', taskDate)
    .maybeSingle();

  if (error) {
    log.error('Failed to fetch daily task', { userId, taskDate, error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  return (data as DailyTaskRow | null) ?? null;
}

export async function ensureTodayDailyTask(
  userId: string,
  hobbies: HobbyRow[],
  taskDate = toDateKey(),
): Promise<DailyTaskRow> {
  const existing = await fetchTodayDailyTask(userId, taskDate);
  if (existing) return existing;

  const draft = buildDailyTaskDraft(userId, taskDate, hobbies);
  const { data, error } = await supabase
    .from('daily_tasks')
    .insert({
      user_id: userId,
      hobby_id: draft.hobby_id,
      task_date: draft.task_date,
      task_type: draft.task_type,
      title: draft.title,
      rating_reward: draft.rating_reward,
      status: 'open',
    })
    .select(DAILY_TASK_SELECT)
    .single();

  if (error || !data) {
    const again = await fetchTodayDailyTask(userId, taskDate);
    if (again) return again;
    log.error('Failed to create daily task', { userId, error: error?.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  return data as DailyTaskRow;
}

export async function markDailyTaskCompleted(taskId: string, userId: string): Promise<DailyTaskRow> {
  const { data, error } = await supabase
    .from('daily_tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('user_id', userId)
    .eq('status', 'open')
    .select(DAILY_TASK_SELECT)
    .maybeSingle();

  if (error) {
    log.error('Failed to complete daily task', { taskId, userId, error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  if (!data) {
    const current = await fetchTodayDailyTask(userId);
    if (current) return current;
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED));
  }

  return data as DailyTaskRow;
}

export async function fetchLeaderboard(userId: string): Promise<{
  entries: LeaderboardEntry[];
  myRank: number;
}> {
  const { data, error } = await supabase
    .from('user_gamification')
    .select('user_id, rating, league_id, current_streak, longest_streak')
    .order('rating', { ascending: false })
    .order('longest_streak', { ascending: false })
    .limit(LEADERBOARD_LIMIT);

  if (error) {
    log.error('Failed to fetch leaderboard', { error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  const rows = data ?? [];
  const ids = rows.map((r) => r.user_id as string);
  const nameById = new Map<string, { displayName: string; username: string | null }>();

  if (ids.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('ranking_profiles')
      .select('user_id, display_name, username')
      .in('user_id', ids);

    if (profilesError) {
      log.warn('Leaderboard names unavailable', { error: profilesError.message });
    } else {
      for (const p of profiles ?? []) {
        nameById.set(p.user_id as string, {
          displayName: (p.display_name as string) || 'Learner',
          username: (p.username as string | null) ?? null,
        });
      }
    }
  }

  const entries: LeaderboardEntry[] = rows.map((r, index) => {
    const profile = nameById.get(r.user_id as string);
    const username = profile?.username ?? null;
    return {
      userId: r.user_id as string,
      displayName: username ? `@${username}` : (profile?.displayName ?? 'Learner'),
      username,
      rating: (r.rating as number) ?? STARTING_RATING,
      leagueId: (r.league_id as string | null) ?? null,
      currentStreak: r.current_streak as number,
      longestStreak: r.longest_streak as number,
      rank: index + 1,
      isMe: r.user_id === userId,
    };
  });

  const mine = entries.find((e) => e.isMe);
  let myRank = mine?.rank ?? 0;

  if (!mine) {
    const me = await fetchUserGamification(userId);
    if (me) {
      const { count, error: countError } = await supabase
        .from('user_gamification')
        .select('*', { count: 'exact', head: true })
        .gt('rating', me.rating);

      if (!countError) {
        myRank = (count ?? 0) + 1;
      }
    }
  }

  return { entries, myRank };
}
