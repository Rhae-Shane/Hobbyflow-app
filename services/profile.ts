import { createLogger } from '@/lib/logger';
import { mapAuthUser } from '@/lib/mapAuthUser';
import { AppError, ErrorCodes, getKnownUserMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import type { AppUser, ProfileRow } from '@/types/user.types';
import type { User } from '@supabase/supabase-js';

const log = createLogger('profile');

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, email, full_name, avatar_url, provider, email_verified, created_at, updated_at',
    )
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    log.error('Failed to fetch profile', { userId, error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  return data as ProfileRow | null;
}

export async function syncProfileFromAuth(user: User): Promise<AppUser> {
  const appUser = mapAuthUser(user);

  log.debug('Syncing profile from auth', { userId: appUser.id, provider: appUser.provider });

  const { error } = await supabase.from('profiles').upsert({
    id: appUser.id,
    email: appUser.email,
    full_name: appUser.fullName,
    avatar_url: appUser.avatarUrl,
    provider: appUser.provider,
    email_verified: appUser.emailVerified,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    log.error('Failed to sync profile', { userId: appUser.id, error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  log.info('Profile synced from auth', { userId: appUser.id });
  return appUser;
}

export function profileRowToAppUser(row: ProfileRow): AppUser {
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
