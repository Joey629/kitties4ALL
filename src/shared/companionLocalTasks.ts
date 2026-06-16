import type { CareTask } from '@/companion/types';

const STORAGE_KEY = 'kitticare-companion-local-tasks';

type Listener = (tasks: CareTask[]) => void;
const listeners = new Set<Listener>();

function notify(tasks: CareTask[]) {
  listeners.forEach((listener) => listener(tasks));
}

export function loadCompanionLocalTasks(): CareTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CareTask[];
  } catch {
    return [];
  }
}

export function saveCompanionLocalTasks(tasks: CareTask[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  notify(tasks);
}

export function subscribeCompanionLocalTasks(listener: Listener) {
  listener(loadCompanionLocalTasks());
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Merge seed tasks with persisted state (persisted wins on id match). */
export function mergeCompanionLocalTasks(seed: CareTask[]): CareTask[] {
  const stored = loadCompanionLocalTasks();
  const storedById = new Map(stored.map((task) => [task.id, task]));
  const seedIds = new Set(seed.map((task) => task.id));

  const mergedSeed = seed.map((task) => storedById.get(task.id) ?? task);
  const extra = stored.filter((task) => !seedIds.has(task.id));

  return [...mergedSeed, ...extra];
}

export function upsertCompanionLocalTask(task: CareTask) {
  const tasks = loadCompanionLocalTasks();
  const next = tasks.some((item) => item.id === task.id)
    ? tasks.map((item) => (item.id === task.id ? task : item))
    : [task, ...tasks];
  saveCompanionLocalTasks(next);
}
