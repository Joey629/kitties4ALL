import type { AdoptionApplication, AdoptionStage } from '@/admin/types';

export type ReviewSubstage = 'contact' | 'shelter_visit';

/** @deprecated Legacy values migrated automatically */
export type LegacyReviewSubstage = 'screening' | 'meet_greet' | 'home_visit' | 'initial_contact';

export const REVIEW_SUBSTAGES: {
  key: ReviewSubstage;
  label: string;
  shortLabel: string;
}[] = [
  { key: 'contact', label: 'Contact', shortLabel: 'Contact' },
  { key: 'shelter_visit', label: 'Shelter visit', shortLabel: 'Shelter visit' },
];

export function migrateReviewSubstage(
  substage: string | undefined,
): ReviewSubstage | undefined {
  if (!substage) return undefined;
  if (substage === 'screening' || substage === 'meet_greet' || substage === 'initial_contact') {
    return 'contact';
  }
  if (substage === 'home_visit') return 'shelter_visit';
  if (substage === 'contact' || substage === 'shelter_visit') return substage;
  return 'contact';
}

export function getReviewSubstageLabel(substage: ReviewSubstage | string | undefined): string {
  const migrated = migrateReviewSubstage(substage);
  if (!migrated) return 'Contact';
  return REVIEW_SUBSTAGES.find((item) => item.key === migrated)?.label ?? 'Contact';
}

export function normalizeReviewSubstage(app: AdoptionApplication): ReviewSubstage | undefined {
  if (app.stage !== 'reviewing') return undefined;
  return migrateReviewSubstage(app.reviewSubstage) ?? 'contact';
}

export function getNextWorkflowAction(app: AdoptionApplication): {
  label: string;
  canAdvance: boolean;
} | null {
  if (app.stage === 'rejected' || app.stage === 'approved' || app.stage === 'new') return null;

  const substage = normalizeReviewSubstage(app);
  if (substage === 'contact') {
    return { label: 'Schedule shelter visit', canAdvance: true };
  }
  if (substage === 'shelter_visit') {
    return { label: 'Approve adoption', canAdvance: true };
  }

  return null;
}

export function getWorkflowPatchAfterAdvance(app: AdoptionApplication): {
  stage: AdoptionStage;
  reviewSubstage?: ReviewSubstage;
} {
  if (app.stage === 'new') {
    return { stage: 'reviewing', reviewSubstage: 'contact' };
  }

  const substage = normalizeReviewSubstage(app);
  if (substage === 'contact') {
    return { stage: 'reviewing', reviewSubstage: 'shelter_visit' };
  }

  return { stage: 'approved', reviewSubstage: undefined };
}

export function getReviewSubstageForStage(
  stage: AdoptionStage,
  current?: ReviewSubstage | string,
): ReviewSubstage | undefined {
  if (stage !== 'reviewing') return undefined;
  return migrateReviewSubstage(current) ?? 'contact';
}

/** Shared step index for adopter track, admin progress, and workflow (0–3). */
export function getAdoptionWorkflowStepIndex(app: AdoptionApplication): number {
  if (app.stage === 'rejected') return 3;
  if (app.stage === 'new') return 0;
  if (app.stage === 'approved') return 3;

  const substage = normalizeReviewSubstage(app);
  if (substage === 'shelter_visit') return 2;
  return 1;
}

/** Maps admin workflow to adopter track step index (0–3). */
export function getAdopterTrackIndex(app: AdoptionApplication): number {
  return getAdoptionWorkflowStepIndex(app);
}

export function isContactReviewSubstage(app: AdoptionApplication): boolean {
  return app.stage === 'reviewing' && normalizeReviewSubstage(app) === 'contact';
}

export function isShelterVisitReviewSubstage(app: AdoptionApplication): boolean {
  return app.stage === 'reviewing' && normalizeReviewSubstage(app) === 'shelter_visit';
}
