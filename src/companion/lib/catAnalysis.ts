import type { AdminCat } from '@/admin/types';
import { getIdealAdopterDescription } from '@/shared/adminCatProfiles';
import { getCatTraitsForDisplay } from '@/shared/adoptionMatch';
import type { CompanionCat } from '../types';

export interface CompanionCatAnalysis {
  summary: string;
  careFocus: string[];
  adoptionFit: string;
  temperamentNote: string;
}

function traitInsights(catId: string) {
  const traits = getCatTraitsForDisplay(catId);
  if (!traits) return [];

  const notes: string[] = [];
  if (traits.confidence <= 2) notes.push('Needs a calm, patient approach — avoid sudden movements.');
  if (traits.energy >= 4) notes.push('High energy — schedule active play and enrichment daily.');
  if (traits.quietHome >= 4) notes.push('Thrives in a quiet, predictable environment.');
  if (traits.beginnerFriendly >= 4) notes.push('Forgiving temperament — suitable for newer caregivers.');
  if (traits.attentionNeed >= 4) notes.push('Benefits from regular human companionship during shifts.');
  if (traits.petFriendly <= 2) notes.push('Slow introductions required if other animals are nearby.');
  return notes;
}

export function generateCompanionCatAnalysis(
  cat: CompanionCat,
  adminCat?: AdminCat,
): CompanionCatAnalysis {
  const catId = adminCat?.id ?? cat.id;
  const idealAdopter =
    getIdealAdopterDescription(catId) ?? adminCat?.idealAdopterDescription ?? adminCat?.tagline;
  const traits = getCatTraitsForDisplay(catId);
  const careFocus = [
    ...traitInsights(catId),
    cat.medication ? `Medication: ${cat.medication}` : null,
    cat.careInstructions ? cat.careInstructions : null,
  ].filter((item): item is string => Boolean(item)).slice(0, 4);

  const personalityLabel = cat.personality.length > 0 ? cat.personality.join(', ') : 'gentle';
  const summary = traits
    ? `${cat.name} reads as ${personalityLabel.toLowerCase()} with a ${traits.confidence <= 2 ? 'cautious' : traits.energy >= 4 ? 'active' : 'steady'} daily rhythm.`
    : `${cat.name} presents as ${personalityLabel.toLowerCase()} based on recent caregiver notes.`;

  const temperamentNote =
    traits && traits.confidence <= 2
      ? 'Watch for hiding or freeze responses — reward small brave moments.'
      : traits && traits.energy >= 4
        ? 'Channel energy into play before quiet handling or transport.'
        : 'Stable mood — good candidate for routine check-ins and visitor socialization.';

  return {
    summary,
    careFocus: careFocus.length > 0 ? careFocus : ['Follow standard care routine and log any behavior changes.'],
    adoptionFit:
      idealAdopter ??
      `${cat.name} is best matched with an adopter whose home pace fits a ${personalityLabel.toLowerCase()} companion.`,
    temperamentNote,
  };
}
