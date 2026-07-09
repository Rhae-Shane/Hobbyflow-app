import { useCallback, useState } from 'react';
import { createLogger } from '@/lib/logger';
import { fetchUserHobbies, setActiveHobby } from '@/services/hobbies';
import { fetchUserPlanByHobbyId } from '@/services/userState';
import { usePlanStore } from '@/store/usePlanStore';

const log = createLogger('switch-hobby');

export function useSwitchHobby() {
  const [isSwitching, setIsSwitching] = useState(false);
  const userId = usePlanStore((s) => s.userId);
  const hobbySnapshots = usePlanStore((s) => s.hobbySnapshots);
  const saveCurrentHobbySnapshot = usePlanStore((s) => s.saveCurrentHobbySnapshot);
  const applyHobbySnapshot = usePlanStore((s) => s.applyHobbySnapshot);
  const setHobbies = usePlanStore((s) => s.setHobbies);

  const switchHobby = useCallback(
    async (hobbyId: string) => {
      const state = usePlanStore.getState();
      if (state.activeHobbyId === hobbyId) return;
      if (!userId) return;

      setIsSwitching(true);
      try {
        saveCurrentHobbySnapshot();

        const cached = hobbySnapshots[hobbyId] ?? state.hobbySnapshots[hobbyId];
        if (cached) {
          applyHobbySnapshot(hobbyId, cached);
          await setActiveHobby(userId, hobbyId);
          const hobbies = await fetchUserHobbies(userId);
          setHobbies(hobbies);
          return;
        }

        await setActiveHobby(userId, hobbyId);
        const [hobbies, planRow] = await Promise.all([
          fetchUserHobbies(userId),
          fetchUserPlanByHobbyId(hobbyId),
        ]);

        setHobbies(hobbies);
        applyHobbySnapshot(hobbyId, {
          plan: planRow?.plan ?? null,
          profile: planRow?.profile ?? null,
          streakDays: planRow?.streak_days ?? 0,
          interactionDates: [],
        });

        log.info('Switched hobby', { hobbyId, hasPlan: Boolean(planRow?.plan) });
      } catch (err) {
        log.warn('Failed to switch hobby', {
          hobbyId,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        throw err;
      } finally {
        setIsSwitching(false);
      }
    },
    [
      applyHobbySnapshot,
      hobbySnapshots,
      saveCurrentHobbySnapshot,
      setHobbies,
      userId,
    ],
  );

  return { switchHobby, isSwitching };
}
