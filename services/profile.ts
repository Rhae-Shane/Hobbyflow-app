import { createLogger } from '@/lib/logger';
import { mapAuthUser } from '@/lib/mapAuthUser';
import { AppError, ErrorCodes, getKnownUserMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import type { AppUser, UserRow } from '@/types/user.types';
import type { User } from '@supabase/supabase-js';

const log = createLogger('profile');

export async function fetchUser(userId: string): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from('users')
    .select(
      'id, email, full_name, avatar_url, provider, email_verified, completed_onboarding_at, created_at, updated_at',
    )
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    log.error('Failed to fetch user', { userId, error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  return data as UserRow | null;
}

/** @deprecated Use fetchUser — profiles table renamed to users */
export const fetchProfile = fetchUser;

export async function syncProfileFromAuth(user: User): Promise<AppUser> {
  const appUser = mapAuthUser(user);

  log.debug('Syncing user from auth', { userId: appUser.id, provider: appUser.provider });

  const { error } = await supabase.from('users').upsert({
    id: appUser.id,
    email: appUser.email,
    full_name: appUser.fullName,
    avatar_url: appUser.avatarUrl,
    provider: appUser.provider,
    email_verified: appUser.emailVerified,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    log.error('Failed to sync user', { userId: appUser.id, error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  log.info('User synced from auth', { userId: appUser.id });
  return appUser;
}

export function userRowToAppUser(row: UserRow): AppUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    provider: row.provider,
    emailVerified: row.email_verified,
    createdAt: row.created_at,
    lastSignInAt: null,
  };
}

/** @deprecated Use userRowToAppUser */
export const profileRowToAppUser = userRowToAppUser;
