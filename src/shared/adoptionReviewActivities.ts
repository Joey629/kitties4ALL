import type { AdoptionApplication, ReviewActivityAssessment, ReviewSubstage } from '@/admin/types';
import {
  getReviewSubstageLabel,
  migrateReviewSubstage,
  normalizeReviewSubstage,
} from '@/shared/adoptionWorkflow';
import { getContactSchedule } from '@/shared/adoptionContactSchedule';

export type VolunteerRecommendation = 'proceed' | 'concerns' | 'not_recommended';

export const RECOMMENDATION_LABELS: Record<VolunteerRecommendation, string> = {
  proceed: 'Recommend proceeding',
  concerns: 'Proceed with concerns',
  not_recommended: 'Not recommended',
};

export const RECOMMENDATION_STYLES: Record<
  VolunteerRecommendation,
  { badge: string; dot: string }
> = {
  proceed: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  concerns: { badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  not_recommended: { badge: 'bg-coral/10 text-coral border-coral/20', dot: 'bg-coral' },
};

function migrateAssessmentType(type: string): ReviewSubstage {
  return migrateReviewSubstage(type) ?? 'contact';
}

export function migrateReviewAssessments(
  assessments: ReviewActivityAssessment[] | undefined,
): ReviewActivityAssessment[] | undefined {
  if (!assessments?.length) return assessments;

  const byType = new Map<ReviewSubstage, ReviewActivityAssessment>();
  for (const assessment of assessments) {
    const type = migrateAssessmentType(assessment.type);
    const existing = byType.get(type);
    const migrated = { ...assessment, type };
    if (!existing || migrated.completedAt > existing.completedAt) {
      byType.set(type, migrated);
    }
  }
  return Array.from(byType.values());
}

export function getAssessmentForSubstage(
  app: AdoptionApplication,
  substage: ReviewSubstage,
): ReviewActivityAssessment | undefined {
  return app.reviewAssessments?.find((item) => migrateAssessmentType(item.type) === substage);
}

export function getCurrentReviewSubstage(app: AdoptionApplication): ReviewSubstage | undefined {
  if (app.stage !== 'reviewing') return undefined;
  return normalizeReviewSubstage(app);
}

export function hasAssessmentForCurrentStep(app: AdoptionApplication): boolean {
  if (app.stage === 'new' || app.stage === 'approved' || app.stage === 'rejected') {
    return true;
  }
  const substage = getCurrentReviewSubstage(app);
  if (!substage) return true;
  return Boolean(getAssessmentForSubstage(app, substage));
}

export function getScheduleBlockReason(app: AdoptionApplication): string | null {
  if (app.stage !== 'reviewing') return null;

  const substage = getCurrentReviewSubstage(app);
  if (!substage) return null;

  const schedule = getContactSchedule(app.id, substage);
  const stepLabel = getReviewSubstageLabel(substage).toLowerCase();

  if (!schedule) {
    return `${app.interviewer ?? 'The assigned volunteer'} still needs to propose a ${stepLabel} time with the applicant.`;
  }

  if (schedule.status === 'pending_adopter') {
    return `Waiting for the applicant to confirm the proposed ${stepLabel} time.`;
  }

  if (schedule.status === 'declined') {
    return `The applicant declined the ${stepLabel} time — volunteer needs to propose a new time.`;
  }

  if (schedule.status === 'counter_proposed') {
    return `The applicant proposed a new ${stepLabel} time — volunteer needs to confirm it in Paw Companion.`;
  }

  return null;
}

export function getAdvanceBlockReason(app: AdoptionApplication): string | null {
  if (app.stage === 'rejected' || app.stage === 'approved') return null;
  if (!app.interviewerId) {
    return 'Assign a volunteer before you can advance this adoption.';
  }

  const scheduleBlock = getScheduleBlockReason(app);
  if (scheduleBlock) return scheduleBlock;

  if (hasAssessmentForCurrentStep(app)) return null;
  const substage = getCurrentReviewSubstage(app) ?? 'contact';
  const assignee = app.interviewer ?? 'Assigned volunteer';
  return `${assignee} still needs to complete the ${getReviewSubstageLabel(substage).toLowerCase()} review in Paw Companion and submit a recommendation.`;
}

export function getVolunteerAwaitingSummary(app: AdoptionApplication): string | null {
  if (!hasAssessmentForCurrentStep(app) && app.stage === 'reviewing') {
    const substage = getCurrentReviewSubstage(app) ?? 'contact';
    const guide = getAdoptionReviewStepGuide(substage);
    return guide.adminWaitingSummary;
  }
  return null;
}

export interface AdoptionReviewStepGuide {
  title: string;
  summary: string;
  checklist: string[];
  notesPlaceholder: string;
  adminWaitingSummary: string;
}

const ADOPTION_REVIEW_STEP_GUIDES: Record<ReviewSubstage, AdoptionReviewStepGuide> = {
  contact: {
    title: 'Contact',
    summary: 'Schedule a call with the applicant. Complete your assessment after they confirm the time.',
    checklist: [
      'Propose a date and time for the call',
      'Have the conversation at the agreed time',
      'Submit your recommendation afterward',
    ],
    notesPlaceholder: 'e.g. Good fit for a shelter visit.',
    adminWaitingSummary:
      'The volunteer is scheduling and completing the contact call, then will recommend whether to schedule a shelter visit.',
  },
  shelter_visit: {
    title: 'Shelter visit',
    summary:
      'Welcome the applicant to the shelter so they can see the cat in person and start building a bond.',
    checklist: [
      'Meet the applicant at the shelter at the scheduled time',
      'Introduce them to the cat in a calm, supervised space',
      'Watch how the cat responds and how the applicant handles the interaction',
      'Submit your recommendation after the visit',
    ],
    notesPlaceholder: 'e.g. Cat warmed up during the visit.',
    adminWaitingSummary:
      'The volunteer is hosting the shelter visit and will confirm whether the in-person match looks right for approval.',
  },
};

export function getAdoptionReviewStepGuide(
  substage: ReviewSubstage | string | undefined,
): AdoptionReviewStepGuide {
  const migrated = migrateReviewSubstage(substage);
  return ADOPTION_REVIEW_STEP_GUIDES[migrated ?? 'contact'];
}

export function getAdoptionPickupGuide() {
  return {
    title: 'Pickup & paperwork',
    summary:
      'Contact the approved adopter to finalize adoption paperwork and hand off the cat at the shelter.',
    checklist: [
      'Call or message the adopter to confirm pickup time',
      'Prepare adoption agreement and any required records',
      'Verify ID and walk through care instructions at handoff',
      'Mark complete once the cat has gone home with the adopter',
    ],
  };
}

export function resolveAdoptionReviewSubstage(
  application: AdoptionApplication | undefined,
): ReviewSubstage {
  if (!application) return 'contact';
  if (application.stage === 'reviewing') {
    return normalizeReviewSubstage(application) ?? 'contact';
  }
  return 'contact';
}

export function getOrderedAssessments(app: AdoptionApplication): ReviewActivityAssessment[] {
  const order: ReviewSubstage[] = ['contact', 'shelter_visit'];
  const assessments = migrateReviewAssessments(app.reviewAssessments) ?? [];
  return order
    .map((type) => assessments.find((item) => item.type === type))
    .filter((item): item is ReviewActivityAssessment => Boolean(item));
}

const APPROVED_ASSESSMENT_STAGES: ReviewSubstage[] = ['contact', 'shelter_visit'];

export function mergeReviewAssessmentsByType(
  stored: ReviewActivityAssessment[] | undefined,
  seed: ReviewActivityAssessment[] | undefined,
): ReviewActivityAssessment[] | undefined {
  const byType = new Map<ReviewSubstage, ReviewActivityAssessment>();
  for (const assessment of migrateReviewAssessments(seed) ?? []) {
    byType.set(assessment.type, assessment);
  }
  for (const assessment of migrateReviewAssessments(stored) ?? []) {
    byType.set(assessment.type, assessment);
  }
  return byType.size ? Array.from(byType.values()) : undefined;
}

function buildApprovedAssessmentPlaceholder(
  app: AdoptionApplication,
  type: ReviewSubstage,
): ReviewActivityAssessment {
  const assigneeId = app.interviewerId ?? 'cg-1';
  const assigneeName = app.interviewer ?? 'Sarah Chen';
  const submittedMs = new Date(app.submittedDate).getTime();
  const dayOffset = type === 'contact' ? 3 : 10;
  const completedAt = new Date(submittedMs + dayOffset * 86400000).toISOString();

  const notes =
    type === 'contact'
      ? `Phone screen with ${app.applicantName} went well. They understand ${app.catName}'s needs and are ready for a shelter visit.`
      : `${app.applicantName} met ${app.catName} at the shelter. Interaction looked positive — recommend moving forward with approval.`;

  return {
    type,
    assigneeId,
    assigneeName,
    notes,
    recommendation: 'proceed',
    completedAt,
  };
}

/** Approved adoptions must show contact + shelter visit volunteer reviews. */
export function ensureApprovedReviewAssessments(app: AdoptionApplication): AdoptionApplication {
  if (app.stage !== 'approved') return app;

  const existing = migrateReviewAssessments(app.reviewAssessments) ?? [];
  const byType = new Map(existing.map((assessment) => [assessment.type, assessment]));
  let changed = false;

  for (const type of APPROVED_ASSESSMENT_STAGES) {
    if (byType.has(type)) continue;
    byType.set(type, buildApprovedAssessmentPlaceholder(app, type));
    changed = true;
  }

  if (!changed) return app;
  return { ...app, reviewAssessments: APPROVED_ASSESSMENT_STAGES.map((type) => byType.get(type)!) };
}
