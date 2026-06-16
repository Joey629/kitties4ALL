import { useEffect, useState } from 'react';
import { loadTeamTasks, subscribeTeamTasks } from '@/shared/teamTasks';

const STORAGE_KEY = 'kitticare-team-tasks';

export function useTeamTasks() {
  const [tasks, setTasks] = useState(() => loadTeamTasks());

  useEffect(() => {
    const unsubscribe = subscribeTeamTasks(setTasks);
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setTasks(loadTeamTasks());
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return tasks;
}
