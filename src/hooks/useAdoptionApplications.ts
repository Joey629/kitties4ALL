import { useCallback, useEffect, useState } from 'react';
import type { AdoptionApplication } from '@/admin/types';
import {
  assignInterviewer,
  advanceApplicationWorkflow,
  moveApplicationStage,
  rejectAdoptionApplication,
  reloadAdoptionApplications,
  subscribeAdoptionApplications,
} from '@/shared/adoptionApplications';

export function useAdoptionApplications() {
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);

  useEffect(() => {
    const refresh = () => setApplications(reloadAdoptionApplications());
    refresh();

    const unsubscribe = subscribeAdoptionApplications(setApplications);
    const onFocus = () => refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      unsubscribe();
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const assign = useCallback(
    (
      appId: string,
      caregiver: { id: string; name: string },
      options?: { moveToReviewing?: boolean },
    ) => assignInterviewer(appId, caregiver, options),
    [],
  );

  const advanceWorkflow = useCallback(
    (appId: string) => advanceApplicationWorkflow(appId),
    [],
  );

  const moveStage = useCallback(
    (appId: string, stage: AdoptionApplication['stage']) =>
      moveApplicationStage(appId, stage),
    [],
  );

  const rejectApplication = useCallback(
    (appId: string, reason: string) => rejectAdoptionApplication(appId, reason),
    [],
  );

  return {
    applications,
    assignInterviewer: assign,
    advanceApplicationWorkflow: advanceWorkflow,
    moveApplicationStage: moveStage,
    rejectApplication,
  };
}
