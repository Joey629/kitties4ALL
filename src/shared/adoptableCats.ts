import { cats as baseCats } from '@/data/cats';
import type { Cat } from '@/types/cat';

import { getLiveCatById, hasBlockingActiveApplicationForCat } from '@/shared/adoptionStatus';

function isListedForAdoption(cat: Cat) {
  const live = getLiveCatById(cat.id) ?? cat;
  return (
    live.fosterStatus === 'in_shelter' &&
    live.adoptionStatus === 'available' &&
    live.healthStatus === 'healthy'
  );
}

/** Cats shown in the adoption picker — all in-shelter cats listed for adoption */
export function getAdoptionPickerCats(liveCats: Cat[]): Cat[] {
  const liveById = new Map(liveCats.map((cat) => [cat.id, cat]));

  return baseCats
    .filter((base) => base.fosterStatus === 'in_shelter' && base.adoptionStatus === 'available')
    .map((base) => liveById.get(base.id) ?? base)
    .filter(isListedForAdoption)
    .filter((cat) => !hasBlockingActiveApplicationForCat(cat.id));
}

/** Whether a new adoption request can be submitted for this cat right now */
export function canSubmitAdoptionApplication(catId: string): boolean {
  const live = getLiveCatById(catId);
  return Boolean(
    live &&
      live.fosterStatus === 'in_shelter' &&
      live.adoptionStatus === 'available' &&
      live.healthStatus === 'healthy' &&
      !hasBlockingActiveApplicationForCat(catId),
  );
}

export function getAdoptionPickerNote(cat: Cat): string | null {
  if (cat.healthStatus === 'medical_care' || cat.healthStatus === 'recovering') {
    return 'Currently under health monitoring — not available for adoption yet.';
  }
  return null;
}

/** @deprecated Use getAdoptionPickerCats for listing and canSubmitAdoptionApplication for submit */
export function getAdoptableCats(sourceCats: Cat[]): Cat[] {
  return getAdoptionPickerCats(sourceCats);
}
