import { create } from 'zustand';
import { createLogger } from '@/lib/logger';
import { STARTING_RATING } from '@/lib/gamification/constants';
import { PACT_BREAK_RATING_PENALTY } from '@/lib/pact/constants';
import {
  canFulfillPact,
  isPactExpired,
  pactValidationMessage,
  validatePactDraft,
} from '@/lib/pact/pactMath';
import { toDateKey } from '@/lib/gamification/streakMath';
import {
  createPact,
  fetchActivePact,
  fetchPactHistory,
  markPactBroken,
  markPactFulfilled,
} from '@/services/pact';
import { updateUserGamification } from '@/services/gamification';
import { useGamificationStore } from '@/store/useGamificationStore';
import type { UserPactRow } from '@/types/pact.types';

const log = createLogger('pact-store');

type PactState = {
  userId: string | null;
  activePact: UserPactRow | null;
  history: UserPactRow[];
  hydrationStatus: 'idle' | 'loading' | 'done';
  isMutating: boolean;
  lastMessage: string | null;
  setUserId: (userId: string | null) => void;
  clearSession: () => void;
  hydrate: (userId: string) => Promise<void>;
  sealPact: (input: {
    hobbyId: string;
    promiseText: string;
    endDate: string;
  }) => Promise<{ ok: true } | { ok: false; message: string }>;
  fulfillActivePact: () => Promise<{ ok: true } | { ok: false; message: string }>;
  abandonActivePact: () => Promise<{ ok: true } | { ok: false; message: string }>;
};

async function applyBreakPenalty(userId: string): Promise<void> {
  const gamification = useGamificationStore.getState();
  const nextRating = Math.max(STARTING_RATING, gamification.rating - PACT_BREAK_RATING_PENALTY);
  const row = await updateUserGamification(
    userId,
    { rating: nextRating },
    { leagues: gamification.leagues, peakRating: gamification.peakRating },
  );
  useGamificationStore.setState({
    rating: row.rating,
    peakRating: row.peak_rating,
    leagueId: row.league_id ?? 'wood',
    pactsFulfilled: row.pacts_fulfilled ?? gamification.pactsFulfilled,
  });
  log.info('Pact break penalty applied', {
    userId,
    ratingDeducted: PACT_BREAK_RATING_PENALTY,
    rating: row.rating,
  });
}

async function resolveExpiredActive(
  userId: string,
  active: UserPactRow | null,
): Promise<UserPactRow | null> {
  if (!active || active.status !== 'active') return active;
  if (!isPactExpired(active.end_date)) return active;

  const broken = await markPactBroken(active.id, userId);
  await applyBreakPenalty(userId);
  log.info('Expired pact resolved as broken', { userId, pactId: active.id });
  return broken;
}

export const usePactStore = create<PactState>((set, get) => ({
  userId: null,
  activePact: null,
  history: [],
  hydrationStatus: 'idle',
  isMutating: false,
  lastMessage: null,

  setUserId: (userId) => set({ userId }),

  clearSession: () =>
    set({
      userId: null,
      activePact: null,
      history: [],
      hydrationStatus: 'idle',
      isMutating: false,
      lastMessage: null,
    }),

  hydrate: async (userId) => {
    set({ userId, hydrationStatus: 'loading', lastMessage: null });
    try {
      let active = await fetchActivePact(userId);
      const resolved = await resolveExpiredActive(userId, active);
      if (resolved && resolved.status === 'broken') {
        active = null;
      } else {
        active = resolved;
      }

      const history = await fetchPactHistory(userId);
      set({ activePact: active, history, hydrationStatus: 'done' });
    } catch (err) {
      log.warn('Pact hydrate failed', {
        userId,
        error: err instanceof Error ? err.message : 'Unknown',
      });
      set({ hydrationStatus: 'done' });
    }
  },

  sealPact: async ({ hobbyId, promiseText, endDate }) => {
    const { userId, activePact, isMutating } = get();
    if (!userId) return { ok: false, message: 'Sign in to seal a pact.' };
    if (isMutating) return { ok: false, message: 'Please wait…' };
    if (activePact?.status === 'active') {
      return { ok: false, message: 'You already have an active pact.' };
    }

    const startDate = toDateKey();
    const validation = validatePactDraft({
      hobbyId,
      promiseText,
      startDate,
      endDate,
    });
    if (validation) {
      return { ok: false, message: pactValidationMessage(validation) };
    }

    set({ isMutating: true, lastMessage: null });
    try {
      const pact = await createPact({
        userId,
        hobbyId,
        promiseText,
        startDate,
        endDate,
      });
      set({ activePact: pact, lastMessage: null });
      log.info('Pact sealed', { userId, pactId: pact.id, endDate });
      return { ok: true };
    } catch (err) {
      log.error('Seal pact failed', { error: err instanceof Error ? err.message : 'Unknown' });
      return { ok: false, message: 'Could not seal the pact. Try again.' };
    } finally {
      set({ isMutating: false });
    }
  },

  fulfillActivePact: async () => {
    const { userId, activePact, isMutating, history } = get();
    if (!userId || !activePact || activePact.status !== 'active') {
      return { ok: false, message: 'No active pact to fulfill.' };
    }
    if (isMutating) return { ok: false, message: 'Please wait…' };
    if (!canFulfillPact(activePact.start_date, activePact.end_date)) {
      return {
        ok: false,
        message: 'Complete the pact on or before the deadline — after that it breaks.',
      };
    }

    set({ isMutating: true, lastMessage: null });
    try {
      const fulfilled = await markPactFulfilled(activePact.id, userId);
      const nextCount = useGamificationStore.getState().pactsFulfilled + 1;
      const row = await updateUserGamification(userId, { pacts_fulfilled: nextCount });
      useGamificationStore.setState({
        pactsFulfilled: row.pacts_fulfilled ?? nextCount,
        rating: row.rating,
        peakRating: row.peak_rating,
        leagueId: row.league_id ?? 'wood',
      });

      set({
        activePact: null,
        history: [fulfilled, ...history],
        lastMessage: 'Pact completed. Promise count increased.',
      });
      log.info('Pact fulfilled', { userId, pactId: fulfilled.id, pactsFulfilled: nextCount });
      return { ok: true };
    } catch (err) {
      log.error('Fulfill pact failed', { error: err instanceof Error ? err.message : 'Unknown' });
      return { ok: false, message: 'Could not complete the pact.' };
    } finally {
      set({ isMutating: false });
    }
  },

  abandonActivePact: async () => {
    const { userId, activePact, isMutating, history } = get();
    if (!userId || !activePact || activePact.status !== 'active') {
      return { ok: false, message: 'No active pact to abandon.' };
    }
    if (isMutating) return { ok: false, message: 'Please wait…' };

    set({ isMutating: true, lastMessage: null });
    try {
      const broken = await markPactBroken(activePact.id, userId);
      await applyBreakPenalty(userId);
      set({
        activePact: null,
        history: [broken, ...history],
        lastMessage: 'Pact broken — rating took a hit.',
      });
      return { ok: true };
    } catch (err) {
      log.error('Abandon pact failed', { error: err instanceof Error ? err.message : 'Unknown' });
      return { ok: false, message: 'Could not abandon the pact.' };
    } finally {
      set({ isMutating: false });
    }
  },
}));
