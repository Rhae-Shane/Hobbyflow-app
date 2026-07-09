import { createLogger } from '@/lib/logger';
import { AppError, ErrorCodes, getKnownUserMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import type { HobbyRow } from '@/types/user.types';
import type { Plan } from '@/types/plan.types';

const log = createLogger('hobbies');

export async function fetchUserHobbies(userId: string): Promise<HobbyRow[]> {
  const { data, error } = await supabase
    .from('hobbies')
    .select('id, user_id, name, level, goal, is_active, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    log.error('Failed to fetch hobbies', { userId, error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  return (data ?? []) as HobbyRow[];
}

export async function fetchActiveHobby(userId: string): Promise<HobbyRow | null> {
  const { data, error } = await supabase
    .from('hobbies')
    .select('id, user_id, name, level, goal, is_active, created_at, updated_at')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    log.error('Failed to fetch active hobby', { userId, error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  if (data) {
    return data as HobbyRow;
  }

  const hobbies = await fetchUserHobbies(userId);
  return hobbies[0] ?? null;
}

export async function upsertHobbyForPlan(
  userId: string,
  input: Pick<Plan, 'hobby' | 'level' | 'goal'>,
): Promise<HobbyRow> {
  const name = input.hobby.trim();
  if (!name) {
    throw new AppError(ErrorCodes.SYNC_FAILED, 'Hobby name is required to sync plan.');
  }

  log.debug('Upserting hobby', { userId, name });

  const { data: hobby, error: hobbyError } = await supabase
    .from('hobbies')
    .upsert(
      {
        user_id: userId,
        name,
        level: input.level,
        goal: input.goal,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,name' },
    )
    .select('id, user_id, name, level, goal, is_active, created_at, updated_at')
    .single();

  if (hobbyError || !hobby) {
    log.error('Failed to upsert hobby', { userId, name, error: hobbyError?.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: hobbyError,
    });
  }

  const { error: deactivateError } = await supabase
    .from('hobbies')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .neq('id', hobby.id);

  if (deactivateError) {
    log.error('Failed to deactivate other hobbies', { userId, error: deactivateError.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: deactivateError,
    });
  }

  log.info('Hobby synced', { userId, hobbyId: hobby.id, name });
  return hobby as HobbyRow;
}

export async function setActiveHobby(userId: string, hobbyId: string): Promise<HobbyRow> {
  log.debug('Setting active hobby', { userId, hobbyId });

  const { error: deactivateError } = await supabase
    .from('hobbies')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .neq('id', hobbyId);

  if (deactivateError) {
    log.error('Failed to deactivate hobbies', { userId, error: deactivateError.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: deactivateError,
    });
  }

  const { data: hobby, error } = await supabase
    .from('hobbies')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', hobbyId)
    .eq('user_id', userId)
    .select('id, user_id, name, level, goal, is_active, created_at, updated_at')
    .single();

  if (error || !hobby) {
    log.error('Failed to set active hobby', { userId, hobbyId, error: error?.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  log.info('Active hobby updated', { userId, hobbyId });
  return hobby as HobbyRow;
}
