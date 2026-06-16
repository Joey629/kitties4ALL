import { adminCats } from '@/admin/data/mock';
import type { AdminCat, AdoptionPipelineStatus, CatPlacement, HealthStatus } from '@/admin/types';

const STORAGE_KEY = 'kitticare-admin-cat-profiles';

type CatProfileOverride = {
  idealAdopterDescription?: string;
  health?: HealthStatus;
  placement?: CatPlacement;
  adoptionPipeline?: AdoptionPipelineStatus;
};

type CatProfileOverrides = Record<string, CatProfileOverride>;

function loadOverrides(): CatProfileOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CatProfileOverrides;
  } catch {
    return {};
  }
}

function saveOverrides(overrides: CatProfileOverrides) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

export function applyCatProfileOverrides(cat: AdminCat): AdminCat {
  const overrides = loadOverrides()[cat.id];
  if (!overrides) return cat;

  return {
    ...cat,
    ...(overrides.idealAdopterDescription !== undefined
      ? { idealAdopterDescription: overrides.idealAdopterDescription }
      : {}),
    ...(overrides.health ? { health: overrides.health } : {}),
    ...(overrides.placement ? { placement: overrides.placement } : {}),
    ...(overrides.adoptionPipeline ? { adoptionPipeline: overrides.adoptionPipeline } : {}),
  };
}

export function getIdealAdopterDescription(catId: string): string | undefined {
  const overrides = loadOverrides()[catId]?.idealAdopterDescription;
  if (overrides?.trim()) return overrides.trim();
  const cat = adminCats.find((item) => item.id === catId);
  return cat?.idealAdopterDescription?.trim() || undefined;
}

export function saveIdealAdopterDescription(catId: string, description: string) {
  const overrides = loadOverrides();
  overrides[catId] = { ...overrides[catId], idealAdopterDescription: description.trim() };
  saveOverrides(overrides);
}

export function getCatProfileFieldOverrides(catId: string): CatProfileOverride {
  return loadOverrides()[catId] ?? {};
}

export function saveCatProfileFields(
  catId: string,
  fields: Pick<CatProfileOverride, 'health' | 'placement' | 'adoptionPipeline'>,
) {
  const overrides = loadOverrides();
  overrides[catId] = { ...overrides[catId], ...fields };
  saveOverrides(overrides);
}
