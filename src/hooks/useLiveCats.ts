import { useEffect, useMemo, useState } from 'react';
import { getLiveCats } from '@/shared/adoptionStatus';
import { subscribeAdoptionApplications } from '@/shared/adoptionApplications';
import { subscribeCatAdoptionStatus } from '@/shared/catAdoptionStatus';

const STORAGE_KEY = 'kitticare-adoption-applications-v2';
const CAT_STATUS_KEY = 'kitticare-cat-adoption-overrides';

export function useLiveCats() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsubscribeApps = subscribeAdoptionApplications(() => {
      setVersion((current) => current + 1);
    });
    const unsubscribeCats = subscribeCatAdoptionStatus(() => {
      setVersion((current) => current + 1);
    });
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === CAT_STATUS_KEY) {
        setVersion((current) => current + 1);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsubscribeApps();
      unsubscribeCats();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return useMemo(() => getLiveCats(), [version]);
}
