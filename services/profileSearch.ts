import { createLogger } from '@/lib/logger';
import { AppError, ErrorCodes, getKnownUserMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import {
  normalizeUsername,
  validateUsernameFormat,
} from '@/lib/gamification/constants';
import type { ProfileSearchHit, PublicProfile } from '@/types/gamification.types';

const log = createLogger('profile-search');

export async function checkUsernameAvailable(raw: string): Promise<{
  available: boolean;
  error: string | null;
  username: string;
}> {
  const username = normalizeUsername(raw);
  const formatError = validateUsernameFormat(username);
  if (formatError) {
    return { available: false, error: formatError, username };
  }

  const { data, error } = await supabase.rpc('is_username_available', {
    p_username: username,
  });

  if (error) {
    log.warn('Username availability check failed', { error: error.message });
    // Fallback direct query (own RLS may hide others — prefer RPC)
    const { data: row } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    return { available: !row, error: null, username };
  }

  return { available: Boolean(data), error: null, username };
}

export async function claimUsername(userId: string, raw: string): Promise<string> {
  const { available, error, username } = await checkUsernameAvailable(raw);
  if (error) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, error);
  }
  if (!available) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'That username is taken.');
  }

  const { data: existing, error: fetchError } = await supabase
    .from('users')
    .select('username')
    .eq('id', userId)
    .maybeSingle();

  if (fetchError) {
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: fetchError,
    });
  }

  if (existing?.username) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Username already claimed.');
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({
      username,
      username_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .is('username', null);

  if (updateError) {
    if (updateError.code === '23505') {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'That username is taken.');
    }
    log.error('Failed to claim username', { userId, error: updateError.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: updateError,
    });
  }

  log.info('Username claimed', { userId, username });
  return username;
}

export async function setProfilePublic(userId: string, isPublic: boolean): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_profile_public: isPublic, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }
}

export async function searchProfiles(query: string): Promise<ProfileSearchHit[]> {
  const q = normalizeUsername(query);
  if (q.length < 2) return [];

  const { data, error } = await supabase.rpc('search_profiles', { q, lim: 20 });

  if (error) {
    log.error('Profile search failed', { error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    userId: row.user_id as string,
    username: row.username as string,
    displayName: (row.display_name as string) || (row.username as string),
    rating: row.rating as number,
    leagueId: (row.league_id as string | null) ?? null,
    currentStreak: row.current_streak as number,
  }));
}

export async function fetchPublicProfile(usernameRaw: string): Promise<PublicProfile | null> {
  const username = normalizeUsername(usernameRaw);
  const { data, error } = await supabase.rpc('get_public_profile', {
    p_username: username,
  });

  if (error) {
    log.error('Public profile fetch failed', { username, error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return {
    userId: row.user_id as string,
    username: row.username as string,
    displayName: (row.display_name as string) || (row.username as string),
    bio: (row.bio as string) || '',
    rating: row.rating as number,
    peakRating: row.peak_rating as number,
    leagueId: (row.league_id as string | null) ?? null,
    currentStreak: row.current_streak as number,
    longestStreak: row.longest_streak as number,
  };
}
