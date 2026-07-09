import { useEffect, useState } from 'react';
import { usePlanStore } from '@/store/usePlanStore';

export function usePlanStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => usePlanStore.persist.hasHydrated());

  useEffect(() => {
    if (usePlanStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }

    return usePlanStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
  }, []);

  return hydrated;
}
