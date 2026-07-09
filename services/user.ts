import { createLogger } from '@/lib/logger';
import { AppError, ErrorCodes, getKnownUserMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

const log = createLogger('user');

/**
 * Idempotent onboarding completion (Inspo pattern).
 * Only updates when completed_onboarding_at is still null.
 */
export async function completeOnboarding(userId: string): Promise<boolean> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('users')
    .update({ completed_onboarding_at: now, updated_at: now })
    .eq('id', userId)
    .is('completed_onboarding_at', null)
    .select('id');

  if (error) {
    log.error('Failed to complete onboarding', { userId, error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  const updated = Array.isArray(data) && data.length > 0;
  log.info('Onboarding completion', { userId, updated });
  return updated;
}
