import { createLogger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import type { OnboardingProfile, Plan } from '@/types/plan.types';

const log = createLogger('userState');

export type UserPlanRow = {
  user_id: string;
  plan: Plan | null;
  profile: OnboardingProfile | null;
  streak_days: number;
  updated_at: string;
};

export async function fetchUserPlan(userId: string): Promise<UserPlanRow | null> {
  log.debug('Fetching user plan', { userId });

  const { data, error } = await supabase
    .from('user_plans')
    .select('user_id, plan, profile, streak_days, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    log.error('Failed to fetch user plan', { userId, error: error.message });
    throw new Error(error.message);
  }

  return data as UserPlanRow | null;
}

export async function upsertUserPlan(
  userId: string,
  payload: {
    plan: Plan | null;
    profile: OnboardingProfile | null;
    streakDays: number;
  },
): Promise<void> {
  log.debug('Upserting user plan', {
    userId,
    hasPlan: Boolean(payload.plan),
    streakDays: payload.streakDays,
  });

  const { error } = await supabase.from('user_plans').upsert({
    user_id: userId,
    plan: payload.plan,
    profile: payload.profile,
    streak_days: payload.streakDays,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    log.error('Failed to upsert user plan', { userId, error: error.message });
    throw new Error(error.message);
  }

  log.info('User plan synced to cloud', { userId });
}
