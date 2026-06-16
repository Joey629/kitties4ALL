import { useEffect, useState } from 'react';
import { loadTaskActivity, subscribeTaskActivity, type TaskActivityEvent } from '@/shared/taskActivity';

const STORAGE_KEY = 'kitticare-task-activity';

export function useTaskActivity(limit?: number): TaskActivityEvent[] {
  const [events, setEvents] = useState(() => loadTaskActivity());

  useEffect(() => {
    const unsubscribe = subscribeTaskActivity(setEvents);
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setEvents(loadTaskActivity());
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return limit ? events.slice(0, limit) : events;
}
