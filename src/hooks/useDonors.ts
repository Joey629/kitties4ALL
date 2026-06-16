import { useCallback, useEffect, useState } from 'react';
import type { Donor } from '@/admin/types';
import { loadDonors, subscribeDonors } from '@/shared/donors';

export function useDonors() {
  const [donors, setDonors] = useState<Donor[]>(() => loadDonors());

  useEffect(() => {
    const unsubscribe = subscribeDonors(setDonors);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'kitticare-donors') {
        setDonors(loadDonors());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const refresh = useCallback(() => setDonors(loadDonors()), []);

  return { donors, refresh };
}
