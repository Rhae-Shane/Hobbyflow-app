import { createLogger } from '@/lib/logger';
import { AppError, ErrorCodes, getKnownUserMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import type { UserPactRow } from '@/types/pact.types';

const log = createLogger('pact');

const PACT_SELECT =
  'id, user_id, hobby_id, promise_text, start_date, end_date, status, fulfilled_at, broken_at, created_at, updated_at';

async function attachHobbyNames(rows: UserPactRow[]): Promise<UserPactRow[]> {
  const hobbyIds = [...new Set(rows.map((r) => r.hobby_id).filter(Boolean))];
  if (hobbyIds.length === 0) return rows;

  const { data, error } = await supabase.from('hobbies').select('id, name').in('id', hobbyIds);
  if (error) {
    log.warn('Hobby names for pacts unavailable', { error: error.message });
    return rows;
  }

  const nameById = new Map((data ?? []).map((h) => [h.id as string, h.name as string]));
  return rows.map((r) => ({ ...r, hobby_name: nameById.get(r.hobby_id) ?? null }));
}

export async function fetchActivePact(userId: string): Promise<UserPactRow | null> {
  const { data, error } = await supabase
    .from('user_pacts')
    .select(PACT_SELECT)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    log.error('Failed to fetch active pact', { userId, error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  if (!data) return null;
  const [withName] = await attachHobbyNames([data as UserPactRow]);
  return withName;
}

export async function fetchPactHistory(userId: string, limit = 20): Promise<UserPactRow[]> {
  const { data, error } = await supabase
    .from('user_pacts')
    .select(PACT_SELECT)
    .eq('user_id', userId)
    .in('status', ['fulfilled', 'broken'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    log.error('Failed to fetch pact history', { userId, error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  return attachHobbyNames((data ?? []) as UserPactRow[]);
}

export async function createPact(input: {
  userId: string;
  hobbyId: string;
  promiseText: string;
  startDate: string;
  endDate: string;
}): Promise<UserPactRow> {
  const { data, error } = await supabase
    .from('user_pacts')
    .insert({
      user_id: input.userId,
      hobby_id: input.hobbyId,
      promise_text: input.promiseText.trim(),
      start_date: input.startDate,
      end_date: input.endDate,
      status: 'active',
    })
    .select(PACT_SELECT)
    .single();

  if (error || !data) {
    log.error('Failed to create pact', { userId: input.userId, error: error?.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  const [withName] = await attachHobbyNames([data as UserPactRow]);
  return withName;
}

export async function markPactFulfilled(pactId: string, userId: string): Promise<UserPactRow> {
  const { data, error } = await supabase
    .from('user_pacts')
    .update({
      status: 'fulfilled',
      fulfilled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', pactId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .select(PACT_SELECT)
    .maybeSingle();

  if (error) {
    log.error('Failed to fulfill pact', { pactId, userId, error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  if (!data) {
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED));
  }

  const [withName] = await attachHobbyNames([data as UserPactRow]);
  return withName;
}

export async function markPactBroken(pactId: string, userId: string): Promise<UserPactRow> {
  const { data, error } = await supabase
    .from('user_pacts')
    .update({
      status: 'broken',
      broken_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', pactId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .select(PACT_SELECT)
    .maybeSingle();

  if (error) {
    log.error('Failed to break pact', { pactId, userId, error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  if (!data) {
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED));
  }

  const [withName] = await attachHobbyNames([data as UserPactRow]);
  return withName;
}
