import { createLogger } from '@/lib/logger';
import { AppError, ErrorCodes, getKnownUserMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import {
  MAX_SOCIAL_LINKS,
  SOCIAL_PLATFORMS,
  type SocialLink,
  type SocialPlatform,
} from '@/types/post.types';

const log = createLogger('social-links');

function mapRow(row: Record<string, unknown>): SocialLink {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    platform: row.platform as SocialPlatform,
    url: row.url as string,
    handle: (row.handle as string | null) ?? null,
    sortOrder: (row.sort_order as number) ?? 0,
  };
}

export function normalizeHttpsUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function platformLabel(platform: SocialPlatform): string {
  return SOCIAL_PLATFORMS.find((p) => p.id === platform)?.label ?? platform;
}

export async function fetchSocialLinks(userId: string): Promise<SocialLink[]> {
  const { data, error } = await supabase
    .from('profile_social_links')
    .select('id, user_id, platform, url, handle, sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) {
    log.error('Failed to fetch social links', { userId, error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function updateBio(userId: string, bio: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ bio: bio.trim(), updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }
}

export async function upsertSocialLink(input: {
  userId: string;
  platform: SocialPlatform;
  url: string;
  handle?: string | null;
  id?: string;
}): Promise<SocialLink> {
  const url = normalizeHttpsUrl(input.url);
  if (!url) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Enter a valid https URL.');
  }

  if (!input.id) {
    const existing = await fetchSocialLinks(input.userId);
    if (existing.length >= MAX_SOCIAL_LINKS) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, `You can add up to ${MAX_SOCIAL_LINKS} links.`);
    }
    if (input.platform !== 'other' && existing.some((l) => l.platform === input.platform)) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'That platform is already linked.');
    }
  }

  const payload = {
    user_id: input.userId,
    platform: input.platform,
    url,
    handle: input.handle?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data, error } = await supabase
      .from('profile_social_links')
      .update(payload)
      .eq('id', input.id)
      .eq('user_id', input.userId)
      .select('id, user_id, platform, url, handle, sort_order')
      .single();

    if (error) {
      throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
        cause: error,
      });
    }
    return mapRow(data as Record<string, unknown>);
  }

  const { data, error } = await supabase
    .from('profile_social_links')
    .insert({
      ...payload,
      sort_order: Date.now() % 100000,
    })
    .select('id, user_id, platform, url, handle, sort_order')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'That platform is already linked.');
    }
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  return mapRow(data as Record<string, unknown>);
}

export async function deleteSocialLink(userId: string, linkId: string): Promise<void> {
  const { error } = await supabase
    .from('profile_social_links')
    .delete()
    .eq('id', linkId)
    .eq('user_id', userId);

  if (error) {
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }
}
