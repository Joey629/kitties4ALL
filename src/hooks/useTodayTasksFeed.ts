import { useEffect, useMemo, useState } from 'react';
import { useAdoptionApplications } from '@/hooks/useAdoptionApplications';
import { useTeamTasks } from '@/hooks/useTeamTasks';
import { subscribeIncidentReports } from '@/shared/incidentReports';
import {
  isFosterWorkflowStorageKey,
  subscribeFosterWorkflow,
} from '@/shared/fosterWorkflow';
import { buildTodayTasksFeed } from '@/shared/taskAdmin';

export function useTodayTasksFeed() {
  const { applications } = useAdoptionApplications();
  const teamTasks = useTeamTasks();
  const [incidentVersion, setIncidentVersion] = useState(0);
  const [fosterVersion, setFosterVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeIncidentReports(() => {
      setIncidentVersion((value) => value + 1);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeFosterWorkflow(() => {
      setFosterVersion((value) => value + 1);
    });
    const onStorage = (event: StorageEvent) => {
      if (isFosterWorkflowStorageKey(event.key)) {
        setFosterVersion((value) => value + 1);
      }
    };
    const onFocus = () => setFosterVersion((value) => value + 1);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return useMemo(
    () => buildTodayTasksFeed({ applications, teamTasks }),
    [applications, teamTasks, incidentVersion, fosterVersion],
  );
}
