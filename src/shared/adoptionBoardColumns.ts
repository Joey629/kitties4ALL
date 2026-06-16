import type { AdoptionStage } from '@/admin/types';

const STORAGE_KEY = 'kitticare-adoption-board-columns';

export type AdoptionBoardColumnPrefs = Record<AdoptionStage, { visible: boolean }>;

const STAGES: AdoptionStage[] = ['new', 'reviewing', 'approved', 'rejected'];

const DEFAULT_PREFS: AdoptionBoardColumnPrefs = {
  new: { visible: true },
  reviewing: { visible: true },
  approved: { visible: true },
  rejected: { visible: true },
};

export function loadAdoptionBoardColumnPrefs(): AdoptionBoardColumnPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<Record<AdoptionStage, { visible?: boolean }>>;
    return STAGES.reduce((acc, stage) => {
      acc[stage] = { visible: parsed[stage]?.visible ?? DEFAULT_PREFS[stage].visible };
      return acc;
    }, {} as AdoptionBoardColumnPrefs);
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveAdoptionBoardColumnPrefs(prefs: AdoptionBoardColumnPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function setColumnVisible(
  prefs: AdoptionBoardColumnPrefs,
  stage: AdoptionStage,
  visible: boolean,
): AdoptionBoardColumnPrefs {
  const visibleCount = STAGES.filter((key) =>
    key === stage ? visible : prefs[key].visible,
  ).length;
  if (visibleCount === 0) return prefs;
  return { ...prefs, [stage]: { visible } };
}

export function resetAdoptionBoardColumnPrefs(): AdoptionBoardColumnPrefs {
  saveAdoptionBoardColumnPrefs(DEFAULT_PREFS);
  return DEFAULT_PREFS;
}
