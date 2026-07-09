import { createLogger } from '@/lib/logger';
import { AppError, ErrorCodes, getKnownUserMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { fetchActiveHobby, upsertHobbyForPlan } from '@/services/hobbies';
import type { OnboardingProfile, Plan } from '@/types/plan.types';

const log = createLogger('userState');

export type UserPlanRow = {
  hobby_id: string;
  plan: Plan | null;
  profile: OnboardingProfile | null;
  streak_days: number;
  updated_at: string;
};

export async function fetchUserPlanByHobbyId(hobbyId: string): Promise<UserPlanRow | null> {
  const { data, error } = await supabase
    .from('user_plans')
    .select('hobby_id, plan, profile, streak_days, updated_at')
    .eq('hobby_id', hobbyId)
    .maybeSingle();

  if (error) {
    log.error('Failed to fetch plan for hobby', { hobbyId, error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  return data as UserPlanRow | null;
}

export async function fetchUserPlan(userId: string): Promise<UserPlanRow | null> {
  log.debug('Fetching user plan', { userId });

  const hobby = await fetchActiveHobby(userId);
  if (!hobby) {
    return null;
  }

  return fetchUserPlanByHobbyId(hobby.id);
}

export async function upsertUserPlan(
  userId: string,
  payload: {
    plan: Plan | null;
    profile: OnboardingProfile | null;
    streakDays: number;
  },
): Promise<{ hobbyId: string }> {
  log.debug('Upserting user plan', {
    userId,
    hasPlan: Boolean(payload.plan),
    streakDays: payload.streakDays,
  });

  const hobbyInput = payload.plan ?? payload.profile;
  if (!hobbyInput?.hobby) {
    throw new AppError(ErrorCodes.SYNC_FAILED, 'Hobby is required to sync plan.');
  }

  const hobby = await upsertHobbyForPlan(userId, {
    hobby: hobbyInput.hobby,
    level: hobbyInput.level,
    goal: hobbyInput.goal,
  });

  const { error } = await supabase.from('user_plans').upsert({
    hobby_id: hobby.id,
    plan: payload.plan,
    profile: payload.profile,
    streak_days: payload.streakDays,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    log.error('Failed to upsert user plan', { userId, hobbyId: hobby.id, error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  log.info('User plan synced to cloud', { userId, hobbyId: hobby.id });
  return { hobbyId: hobby.id };
}
