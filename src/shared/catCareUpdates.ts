import type { CatUpdate, Mood, Eating, Behavior } from '@/companion/types';

const STORAGE_KEY = 'kitticare-cat-care-updates';

export interface CatCareUpdateRecord extends CatUpdate {
  catName: string;
  reporterId: string;
  reporterName: string;
  shareWithPublic: boolean;
}

type Listener = (updates: CatCareUpdateRecord[]) => void;
const listeners = new Set<Listener>();

function notify(updates: CatCareUpdateRecord[]) {
  listeners.forEach((listener) => listener(updates));
}

export function loadCatCareUpdates(): CatCareUpdateRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CatCareUpdateRecord[];
  } catch {
    return [];
  }
}

function persist(updates: CatCareUpdateRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updates));
  notify(updates);
}

export function subscribeCatCareUpdates(listener: Listener) {
  listener(loadCatCareUpdates());
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCatCareUpdatesForCat(catId: string) {
  return loadCatCareUpdates()
    .filter((update) => update.catId === catId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getRecentUpdateSummaries(catId: string, limit = 3) {
  return getCatCareUpdatesForCat(catId).slice(0, limit).map(formatUpdateSummary);
}

const MOOD_LABEL: Record<Mood, string> = {
  happy: 'Happy',
  normal: 'Normal',
  concerned: 'Concerned',
};

const EATING_LABEL: Record<Eating, string> = {
  good: 'Eating well',
  low: 'Low appetite',
};

const BEHAVIOR_LABEL: Record<Behavior, string> = {
  friendly: 'Friendly',
  shy: 'Shy',
  active: 'Active',
};

export function formatUpdateSummary(update: CatCareUpdateRecord) {
  const parts = [MOOD_LABEL[update.mood], EATING_LABEL[update.eating], BEHAVIOR_LABEL[update.behavior]];
  if (update.note.trim()) {
    return `${parts.join(' · ')} — ${update.note.trim()}`;
  }
  return parts.join(' · ');
}

export function submitCatCareUpdate(input: {
  catId: string;
  catName: string;
  mood: Mood;
  eating: Eating;
  behavior: Behavior;
  note: string;
  photo?: string;
  reporterId: string;
  reporterName: string;
  shareWithPublic?: boolean;
}) {
  const record: CatCareUpdateRecord = {
    id: `upd-${Date.now()}`,
    catId: input.catId,
    catName: input.catName,
    mood: input.mood,
    eating: input.eating,
    behavior: input.behavior,
    note: input.note,
    photo: input.photo,
    createdAt: new Date().toISOString(),
    reporterId: input.reporterId,
    reporterName: input.reporterName,
    shareWithPublic: input.shareWithPublic ?? true,
  };
  persist([record, ...loadCatCareUpdates()]);
  return record;
}
