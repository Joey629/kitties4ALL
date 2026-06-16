import { cats } from '@/data/cats';
import type { Cat } from '@/types/cat';
import type { AdoptionStatus } from '@/types/cat';
import { loadAdoptionApplications } from '@/shared/adoptionApplications';
import { CAT_ADOPTION_IN_PROGRESS_STAGES } from '@/shared/adoptionStatus';

const STORAGE_KEY = 'kitticare-cat-adoption-overrides';

type Overrides = Record<string, AdoptionStatus>;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

function loadOverrides(): Overrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Overrides;
  } catch {
    return {};
  }
}

function saveOverrides(overrides: Overrides) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  notify();
}

export function subscribeCatAdoptionStatus(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCatAdoptionStatusOverride(catId: string): AdoptionStatus | undefined {
  return loadOverrides()[catId];
}

export function applyCatAdoptionOverride(cat: Cat): Cat {
  const override = getCatAdoptionStatusOverride(cat.id);

  if (override === 'adopted') {
    return { ...cat, adoptionStatus: 'adopted' };
  }

  if (hasCatAdoptionInProgress(cat.id)) {
    return { ...cat, adoptionStatus: 'pending' };
  }

  if (cat.adoptionStatus === 'adopted') {
    return cat;
  }

  if (override === 'pending' || cat.adoptionStatus === 'pending') {
    return { ...cat, adoptionStatus: 'available' };
  }

  return cat;
}

function hasCatAdoptionInProgress(catId: string): boolean {
  return loadAdoptionApplications().some(
    (app) => app.catId === catId && CAT_ADOPTION_IN_PROGRESS_STAGES.includes(app.stage),
  );
}

export function syncCatAdoptionStatusForCat(catId: string) {
  const apps = loadAdoptionApplications().filter((app) => app.catId === catId);
  const inProgress = apps.some((app) => CAT_ADOPTION_IN_PROGRESS_STAGES.includes(app.stage));
  const base = cats.find((item) => item.id === catId)?.adoptionStatus ?? 'available';
  const overrides = loadOverrides();

  if (!inProgress) {
    if (overrides[catId]) {
      delete overrides[catId];
      saveOverrides(overrides);
    }
    return;
  }

  const next: AdoptionStatus = base === 'adopted' ? 'adopted' : 'pending';
  if (overrides[catId] === next) return;
  saveOverrides({ ...overrides, [catId]: next });
}

export function markCatAdopted(catId: string) {
  saveOverrides({ ...loadOverrides(), [catId]: 'adopted' });
}
