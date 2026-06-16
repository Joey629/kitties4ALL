import type { TeamTask } from '@/shared/teamTasks';

const STORAGE_KEY = 'kitticare-task-activity';

export interface TaskActivityEvent {
  id: string;
  taskId: string;
  taskTitle: string;
  catName?: string;
  assigneeId: string;
  assigneeName: string;
  completedByName: string;
  completedAt: string;
}

type Listener = (events: TaskActivityEvent[]) => void;
const listeners = new Set<Listener>();

function notify(events: TaskActivityEvent[]) {
  listeners.forEach((listener) => listener(events));
}

export function loadTaskActivity(): TaskActivityEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TaskActivityEvent[];
  } catch {
    return [];
  }
}

function saveTaskActivity(events: TaskActivityEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, 100)));
  notify(events);
}

export function subscribeTaskActivity(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function logTaskCompletion(
  task: TeamTask,
  completedBy: { id: string; name: string },
  assigneeName: string,
) {
  const event: TaskActivityEvent = {
    id: `activity-${Date.now()}`,
    taskId: task.id,
    taskTitle: task.title,
    catName: task.catName,
    assigneeId: task.assigneeId,
    assigneeName,
    completedByName: completedBy.name,
    completedAt: new Date().toISOString(),
  };
  saveTaskActivity([event, ...loadTaskActivity()]);
}

export function getRecentTaskActivity(limit = 8): TaskActivityEvent[] {
  return loadTaskActivity().slice(0, limit);
}
