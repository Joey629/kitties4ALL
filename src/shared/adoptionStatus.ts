import { cats } from '@/data/cats';
import type { AdoptionApplication, AdoptionStage } from '@/admin/types';
import type { Cat } from '@/types/cat';
import { findApplicationIdByRef } from '@/shared/adoptionReference';
import { loadAdoptionApplications } from '@/shared/adoptionApplications';
import { applyCatAdoptionOverride } from '@/shared/catAdoptionStatus';
import { isAdoptionPickupTeamTask, loadTeamTasks } from '@/shared/teamTasks';
import {
  getAdopterTrackIndex,
  getReviewSubstageLabel,
  normalizeReviewSubstage,
} from '@/shared/adoptionWorkflow';

export const ACTIVE_ADOPTION_STAGES: AdoptionStage[] = ['new', 'reviewing', 'approved'];

/** Cat is unavailable to other adopters only once review has started. */
export const CAT_ADOPTION_IN_PROGRESS_STAGES: AdoptionStage[] = ['reviewing', 'approved'];

/** Same applicant cannot submit another request while their application is open. */
export const APPLICANT_ACTIVE_STAGES: AdoptionStage[] = ['new', 'reviewing', 'approved'];

/** @deprecated Use APPLICANT_ACTIVE_STAGES */
export const DUPLICATE_BLOCKING_STAGES: AdoptionStage[] = APPLICANT_ACTIVE_STAGES;

export const ADOPTER_STAGE_INFO: Record<
  AdoptionStage,
  { label: string; message: string; nextStep: string }
> = {
  new: {
    label: 'Adoption received',
    message: 'Your adoption request is in our queue.',
    nextStep: 'We will email you within 48 hours to confirm receipt and outline next steps.',
  },
  reviewing: {
    label: 'Under review',
    message: 'Our adoption team is reviewing your request.',
    nextStep: 'We may reach out to schedule a short phone call and a shelter visit.',
  },
  approved: {
    label: 'Approved',
    message: 'Congratulations — your adoption has been approved.',
    nextStep: 'We will contact you soon to arrange pickup and any final paperwork.',
  },
  rejected: {
    label: 'Closed',
    message: 'This adoption is no longer active.',
    nextStep: 'You are welcome to apply for another cat or contact us with any questions.',
  },
};

export { formatApplicationRef } from '@/shared/adoptionReference';

export function parseApplicationRef(ref: string): string | null {
  return findApplicationIdByRef(ref);
}

export function getActiveApplicationForCat(catId: string): AdoptionApplication | null {
  return (
    loadAdoptionApplications().find(
      (app) => app.catId === catId && ACTIVE_ADOPTION_STAGES.includes(app.stage),
    ) ?? null
  );
}

export function normalizeApplicantField(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}

export function applicantsMatch(
  storedName: string,
  storedEmail: string,
  inputName: string,
  inputEmail: string,
): boolean {
  return (
    normalizeApplicantField(storedEmail) === normalizeApplicantField(inputEmail) &&
    normalizeApplicantField(storedName) === normalizeApplicantField(inputName)
  );
}

export function isApplicationBlockingReapply(app: AdoptionApplication): boolean {
  if (app.stage === 'rejected' || app.withdrawnByApplicant) return false;
  return APPLICANT_ACTIVE_STAGES.includes(app.stage);
}

export function hasCatAdoptionInProgress(catId: string): boolean {
  return loadAdoptionApplications().some(
    (app) => app.catId === catId && CAT_ADOPTION_IN_PROGRESS_STAGES.includes(app.stage),
  );
}

export function hasBlockingApplicationForApplicant(
  applicantName: string,
  email: string,
  catId: string,
): boolean {
  return loadAdoptionApplications().some(
    (app) =>
      applicantsMatch(app.applicantName, app.email, applicantName, email) &&
      app.catId === catId &&
      isApplicationBlockingReapply(app),
  );
}

/** @deprecated Use hasBlockingApplicationForApplicant */
export function hasActiveApplicationForApplicant(email: string, catId: string): boolean {
  const normalized = normalizeApplicantField(email);
  return loadAdoptionApplications().some(
    (app) =>
      app.catId === catId &&
      normalizeApplicantField(app.email) === normalized &&
      isApplicationBlockingReapply(app),
  );
}

export function hasBlockingActiveApplicationForCat(catId: string): boolean {
  return hasCatAdoptionInProgress(catId);
}

export function getCatAdoptionUnavailableMessage(catId: string): string {
  if (hasCatAdoptionInProgress(catId)) {
    return "This cat already has an adoption in progress. Please choose another cat or check back later.";
  }
  return 'This cat is not currently accepting new adoptions. Please choose another cat.';
}

export function mergeCatAdoptionStatus(cat: Cat): Cat {
  return applyCatAdoptionOverride(cat);
}

export function getLiveCats(): Cat[] {
  return cats.map(mergeCatAdoptionStatus);
}

export function getLiveCatById(catId: string): Cat | undefined {
  return getLiveCats().find((cat) => cat.id === catId);
}

export function isCatOpenForAdoption(cat: Cat): boolean {
  const live = mergeCatAdoptionStatus(cat);
  return (
    live.fosterStatus === 'in_shelter' &&
    live.adoptionStatus === 'available' &&
    live.healthStatus === 'healthy'
  );
}

export function lookupApplication(ref: string, email: string): AdoptionApplication | null {
  const id = parseApplicationRef(ref);
  if (!id) return null;
  const normalizedEmail = normalizeApplicantField(email);
  return (
    loadAdoptionApplications().find(
      (app) => app.id === id && normalizeApplicantField(app.email) === normalizedEmail,
    ) ?? null
  );
}

export function lookupApplicationsByEmail(email: string): AdoptionApplication[] {
  const normalizedEmail = normalizeApplicantField(email);
  return loadAdoptionApplications().filter(
    (app) => !app.dismissedByApplicant && normalizeApplicantField(app.email) === normalizedEmail,
  );
}

export function lookupApplicationsByNameAndEmail(name: string, email: string): AdoptionApplication[] {
  return loadAdoptionApplications().filter(
    (app) =>
      !app.dismissedByApplicant && applicantsMatch(app.applicantName, app.email, name, email),
  );
}

export const ADOPTER_TRACK_STEPS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'contact', label: 'Contact' },
  { key: 'shelter_visit', label: 'Shelter visit' },
  { key: 'approved', label: 'Approved' },
] as const;

export function getAdopterTrackProgress(stage: AdoptionApplication['stage'], app?: AdoptionApplication) {
  if (stage === 'rejected') {
    return { activeIndex: 3, rejected: true as const };
  }
  if (app) {
    return { activeIndex: getAdopterTrackIndex(app), rejected: false as const };
  }
  if (stage === 'new') return { activeIndex: 0, rejected: false as const };
  if (stage === 'reviewing') return { activeIndex: 1, rejected: false as const };
  return { activeIndex: 3, rejected: false as const };
}

export function getApplicationOutcomeMessage(app: AdoptionApplication): string | null {
  if (app.stage !== 'rejected') return null;
  if (app.withdrawnByApplicant) return 'You withdrew this adoption.';
  return app.rejectionReason ?? 'This adoption was not approved.';
}

export function canApplicantWithdrawApplication(app: AdoptionApplication): boolean {
  return app.stage === 'new' || app.stage === 'reviewing' || app.stage === 'approved';
}

export function getApplicantWithdrawConfirmMessage(app: AdoptionApplication): string {
  if (app.stage === 'approved') {
    return `Your adoption for ${app.catName} was approved. Withdrawing will cancel the adoption — only continue if your plans have changed.`;
  }
  return `Withdraw your adoption request for ${app.catName}?`;
}

export function getApplicantWithdrawTooltip(app: AdoptionApplication): string {
  if (app.stage === 'approved') {
    return 'You can withdraw after approval; the shelter team will be notified.';
  }
  return 'Cancel this adoption';
}

export interface AdoptionApprovedWelcomeContent {
  headline: string;
  approvalMessage: string;
  pickupTime: string;
  precautions: string;
  agreementNote: string;
}

function getPickupTimeLabel(applicationId: string): string | null {
  const task = loadTeamTasks().find(
    (item) =>
      item.applicationId === applicationId &&
      isAdoptionPickupTeamTask(item) &&
      item.status === 'pending',
  );
  return task?.dueTime?.trim() || null;
}

export function getAdoptionApprovedWelcomeContent(
  app: AdoptionApplication,
): AdoptionApprovedWelcomeContent {
  const pickupTime =
    getPickupTimeLabel(app.id) ??
    app.visitAvailability?.trim() ??
    'Your adoption coordinator will confirm pickup time with you.';

  return {
    headline: `${app.catName} is yours`,
    approvalMessage: `Congratulations — your adoption application for ${app.catName} has been approved.`,
    pickupTime: `Pickup: ${pickupTime}`,
    precautions:
      'Before pickup, bring a secure carrier and photo ID. Cat-proof your home and plan a quiet first day so your new cat can settle in.',
    agreementNote:
      'At pickup, sign the adoption agreement, review care records, and complete any remaining adoption fee.',
  };
}

export function getApplicationProgressLabel(app: AdoptionApplication): string {
  const progress = getAdopterTrackProgress(app.stage, app);
  if (progress.rejected) return 'Not approved';
  if (app.stage === 'reviewing') {
    return getReviewSubstageLabel(normalizeReviewSubstage(app));
  }
  return ADOPTER_TRACK_STEPS[progress.activeIndex].label;
}
