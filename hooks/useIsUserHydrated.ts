import { useUserStore } from '@/store/useUserStore';

/** True once the cloud user row (incl. completed_onboarding_at) has been fetched or failed. */
export function useIsUserHydrated(): boolean {
  return useUserStore((s) => s.hydrationStatus === 'done');
}
