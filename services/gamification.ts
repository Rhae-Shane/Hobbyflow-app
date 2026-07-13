import { createLogger } from '@/lib/logger';
import { AppError, ErrorCodes, getKnownUserMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { LEADERBOARD_LIMIT, STARTING_RATING } from '@/lib/gamification/constants';
import { FALLBACK_LEAGUES, ratingFieldsFromRating } from '@/lib/gamification/leagues';
import { toDateKey } from '@/lib/gamification/streakMath';
import type {
  DailyTaskRow,
  LeaderboardCategoryOption,
  LeaderboardEntry,
  LeaderboardFilter,
  LeagueRow,
  UserGamificationRow,
} from '@/types/gamification.types';
import type { HobbyTag } from '@/types/roadmapCreation.types';
import { fetchOwnHobbyTags } from '@/services/profileSearch';
import { fetchLeaderboardUserIds } from '@/services/leaderboardApi';

const log = createLogger('gamification');

const GAMIFICATION_SELECT =
  'user_id, current_streak, longest_streak, streak_savers, activity_dates, saver_used_dates, last_activity_date, rating, peak_rating, league_id, pacts_fulfilled, created_at, updated_at';

const DAILY_TASK_SELECT =
  'id, user_id, hobby_id, task_date, task_type, title, rating_reward, status, completed_at, counts_for_rating, regenerates_used, structured, rating_awarded, generated_by, created_at, updated_at';

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

/** Prefer open primary, else completed primary for the local day (no auto-create). */
export async function fetchTodayDailyTask(
  userId: string,
  taskDate = toDateKey(),
): Promise<DailyTaskRow | null> {
  const { data, error } = await supabase
    .from('daily_tasks')
    .select(DAILY_TASK_SELECT)
    .eq('user_id', userId)
    .eq('task_date', taskDate)
    .eq('counts_for_rating', true)
    .in('status', ['open', 'completed'])
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    log.error('Failed to fetch daily task', { userId, taskDate, error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  return (data?.[0] as DailyTaskRow | undefined) ?? null;
}

function parseUserHobbyTags(raw: unknown): Array<{ hobbyId: number | null; name: string }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ hobbyId: number | null; name: string }> = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    if (!name) continue;
    const hobbyId =
      typeof row.hobbyId === 'number' && Number.isInteger(row.hobbyId) ? row.hobbyId : null;
    out.push({ hobbyId, name });
  }
  return out;
}

function tagsMatchFilter(
  tags: Array<{ hobbyId: number | null; name: string }>,
  filter: LeaderboardFilter,
  allowedHobbyIds?: Set<number>,
): boolean {
  if (filter.kind === 'tag') {
    if (filter.hobbyId != null) return tags.some((t) => t.hobbyId === filter.hobbyId);
    const needle = filter.name.trim().toLowerCase();
    return tags.some((t) => t.name.trim().toLowerCase() === needle);
  }
  if (filter.kind === 'category' && allowedHobbyIds) {
    return tags.some((t) => t.hobbyId != null && allowedHobbyIds.has(t.hobbyId));
  }
  return false;
}

/** Works without new SQL — uses existing security-definer search_profiles (includes hobby_tags). */
async function resolveViaSearchProfiles(filter: LeaderboardFilter): Promise<string[]> {
  const queries: string[] = [];
  let allowedHobbyIds: Set<number> | undefined;

  if (filter.kind === 'tag') {
    const q = filter.name.trim();
    if (q.length >= 2) queries.push(q.toLowerCase());
  } else if (filter.kind === 'category') {
    const { data, error } = await supabase
      .from('all_hobbies')
      .select('id, name')
      .eq('category_id', filter.categoryId);
    if (error) {
      log.warn('Category hobbies lookup failed', { error: error.message });
      return [];
    }
    allowedHobbyIds = new Set((data ?? []).map((r) => r.id as number));
    for (const row of data ?? []) {
      const name = typeof row.name === 'string' ? row.name.trim() : '';
      if (name.length >= 2) queries.push(name.toLowerCase());
    }
  }

  // Cap parallel searches for large categories
  const uniqueQueries = [...new Set(queries)].slice(0, 20);
  if (uniqueQueries.length === 0) return [];

  const idSet = new Set<string>();
  await Promise.all(
    uniqueQueries.map(async (q) => {
      const { data, error } = await supabase.rpc('search_profiles', { q, lim: 50 });
      if (error) {
        log.warn('search_profiles fallback failed', { q, error: error.message });
        return;
      }
      for (const row of data ?? []) {
        const userId = row.user_id as string;
        const tags = parseUserHobbyTags(row.hobby_tags);
        if (tagsMatchFilter(tags, filter, allowedHobbyIds)) idSet.add(userId);
      }
    }),
  );

  return [...idSet];
}

async function resolveFilteredUserIds(filter: LeaderboardFilter): Promise<string[] | null> {
  if (filter.kind === 'all') return null;

  // Prefer dedicated RPC when migration is applied (complete coverage).
  const { data, error } = await supabase.rpc('leaderboard_user_ids', {
    p_kind: filter.kind,
    p_category_id: filter.kind === 'category' ? filter.categoryId : null,
    p_hobby_id: filter.kind === 'tag' ? filter.hobbyId : null,
    p_tag_name: filter.kind === 'tag' ? filter.name : null,
  });

  if (!error) {
    return (data ?? []).map((row: { user_id: string }) => row.user_id);
  }

  // RPC not deployed yet — try Express API (service role), then search_profiles.
  if (!/Could not find the function|schema cache/i.test(error.message)) {
    log.warn('leaderboard_user_ids RPC error', { kind: filter.kind, error: error.message });
  }

  try {
    if (filter.kind === 'category') {
      return await fetchLeaderboardUserIds({
        kind: 'category',
        categoryId: filter.categoryId,
      });
    }
    return await fetchLeaderboardUserIds({
      kind: 'tag',
      hobbyId: filter.hobbyId,
      tagName: filter.name,
    });
  } catch {
    // API may not be deployed yet
  }

  return resolveViaSearchProfiles(filter);
}

/** Categories (from catalog tags) + the user's selected hobby tags for leaderboard tabs. */
export async function fetchLeaderboardFilterOptions(userId: string): Promise<{
  categories: LeaderboardCategoryOption[];
  tags: HobbyTag[];
}> {
  const tags = await fetchOwnHobbyTags(userId);
  const catalogIds = [
    ...new Set(tags.map((t) => t.hobbyId).filter((id): id is number => id != null)),
  ];

  if (catalogIds.length === 0) {
    return { categories: [], tags };
  }

  const { data, error } = await supabase
    .from('all_hobbies')
    .select('id, category_id, hobby_category(id, name)')
    .in('id', catalogIds);

  if (error) {
    log.warn('Leaderboard category resolve failed', { error: error.message });
    return { categories: [], tags };
  }

  const byId = new Map<number, string>();
  for (const row of data ?? []) {
    const rawCat = row.hobby_category as
      | { id?: number; name?: string }
      | { id?: number; name?: string }[]
      | null;
    const cat = Array.isArray(rawCat) ? rawCat[0] : rawCat;
    const id = typeof cat?.id === 'number' ? cat.id : (row.category_id as number | undefined);
    const name = typeof cat?.name === 'string' ? cat.name : null;
    if (id != null && name) byId.set(id, name);
  }

  const categories = [...byId.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { categories, tags };
}

export async function fetchLeaderboard(
  userId: string,
  filter: LeaderboardFilter = { kind: 'all' },
): Promise<{
  entries: LeaderboardEntry[];
  myRank: number;
}> {
  const filteredIds = await resolveFilteredUserIds(filter);

  if (filteredIds && filteredIds.length === 0) {
    return { entries: [], myRank: 0 };
  }

  let query = supabase
    .from('user_gamification')
    .select('user_id, rating, league_id, current_streak, longest_streak')
    .order('rating', { ascending: false })
    .order('longest_streak', { ascending: false })
    .limit(LEADERBOARD_LIMIT);

  if (filteredIds) {
    // PostgREST .in() has practical URL limits; chunk if needed.
    const chunk = filteredIds.slice(0, 200);
    query = query.in('user_id', chunk);
  }

  const { data, error } = await query;

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
      if (filteredIds) {
        if (!filteredIds.includes(userId)) {
          myRank = 0;
        } else {
          const { count, error: countError } = await supabase
            .from('user_gamification')
            .select('*', { count: 'exact', head: true })
            .in('user_id', filteredIds.slice(0, 200))
            .gt('rating', me.rating);

          if (!countError) {
            myRank = (count ?? 0) + 1;
          }
        }
      } else {
        const { count, error: countError } = await supabase
          .from('user_gamification')
          .select('*', { count: 'exact', head: true })
          .gt('rating', me.rating);

        if (!countError) {
          myRank = (count ?? 0) + 1;
        }
      }
    }
  }

  return { entries, myRank };
}
