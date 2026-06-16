import { findApplicationIdByRef } from '@/shared/adoptionReference';
import { adoptionApplications as seedApplications } from '@/admin/data/mock';
import type { AdoptionApplication, LifestyleProfile, ReviewActivityAssessment } from '@/admin/types';
import {
  applicantsMatch,
  hasBlockingApplicationForApplicant,
  hasBlockingActiveApplicationForCat,
  isCatOpenForAdoption,
} from '@/shared/adoptionStatus';
import { evaluateApplicationMatch } from '@/shared/adoptionMatch';
import {
  getReviewSubstageForStage,
  getWorkflowPatchAfterAdvance,
  migrateReviewSubstage,
  type ReviewSubstage,
} from '@/shared/adoptionWorkflow';
import { migrateReviewAssessments, mergeReviewAssessmentsByType, ensureApprovedReviewAssessments } from '@/shared/adoptionReviewActivities';
import { purgeInvalidAdoptionTeamTasks, removeAllAdoptionTeamTasksForApplication } from '@/shared/teamTasks';
import { removeContactSchedulesForApplication } from '@/shared/adoptionContactSchedule';
import { syncCatAdoptionStatusForCat } from '@/shared/catAdoptionStatus';
import { getLiveCatById } from '@/shared/adoptionStatus';
import { notifyFosterAdoptionInterest } from '@/shared/fosterWorkflow';

export const ADOPTION_APPLICATIONS_STORAGE_KEY = 'kitticare-adoption-applications-v2';

/** @deprecated Use ADOPTION_APPLICATIONS_STORAGE_KEY */
const STORAGE_KEY = ADOPTION_APPLICATIONS_STORAGE_KEY;

const SYNC_CHANNEL_NAME = 'kitticare-adoption-applications-sync';

/** @deprecated In-memory cache removed — reads always come from localStorage. */
export function invalidateAdoptionApplicationsCache() {
  // no-op kept for callers that still invoke it
}

/** Always read from localStorage — use after cross-tab writes or admin remount. */
export function reloadAdoptionApplications(): AdoptionApplication[] {
  return loadAdoptionApplications();
}

type Listener = (apps: AdoptionApplication[]) => void;
const listeners = new Set<Listener>();

function notify(apps: AdoptionApplication[]) {
  listeners.forEach((fn) => fn(apps));
}

function getSyncChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  return new BroadcastChannel(SYNC_CHANNEL_NAME);
}

function broadcastApplicationsChanged() {
  getSyncChannel()?.postMessage({ type: 'updated' });
}

function setupCrossTabSync() {
  const channel = getSyncChannel();
  channel?.addEventListener('message', () => {
    notify(reloadAdoptionApplications());
  });
  window.addEventListener('storage', (event) => {
    if (event.key === ADOPTION_APPLICATIONS_STORAGE_KEY) {
      notify(reloadAdoptionApplications());
    }
  });
}

if (typeof window !== 'undefined') {
  setupCrossTabSync();
}

function persistApplications(
  apps: AdoptionApplication[],
  options?: { notifyListeners?: boolean },
) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  broadcastApplicationsChanged();
  if (options?.notifyListeners === false) return;
  notify(apps);
  purgeInvalidAdoptionTeamTasks(apps);
  for (const catId of new Set(apps.map((app) => app.catId))) {
    syncCatAdoptionStatusForCat(catId);
  }
}

function isPermanentlyRemovedApplication(_app: AdoptionApplication): boolean {
  return false;
}

function purgeRemovedApplicationArtifacts(appIds: Iterable<string>) {
  for (const appId of appIds) {
    removeContactSchedulesForApplication(appId);
    removeAllAdoptionTeamTasksForApplication(appId);
  }
}

const seedById = new Map(seedApplications.map((app) => [app.id, app]));

function enrichApplication(app: AdoptionApplication): AdoptionApplication {
  const seed = seedById.get(app.id);
  const merged: AdoptionApplication = seed
    ? {
        ...seed,
        ...app,
        lifestyleProfile: app.lifestyleProfile ?? seed.lifestyleProfile,
        matchScore: app.matchScore ?? seed.matchScore,
        matchReasons: app.matchReasons ?? seed.matchReasons,
        phone: app.phone ?? seed.phone,
        reviewAssessments: mergeReviewAssessmentsByType(app.reviewAssessments, seed.reviewAssessments),
      }
    : app;

  if (merged.lifestyleProfile && (merged.matchScore === undefined || !merged.matchReasons?.length)) {
    const { score, reasons } = evaluateApplicationMatch(merged.catId, merged.lifestyleProfile);
    return enrichReviewSubstage({ ...merged, matchScore: score, matchReasons: reasons });
  }

  return enrichReviewSubstage(merged);
}

function enrichReviewSubstage(app: AdoptionApplication): AdoptionApplication {
  const migratedSubstage = app.reviewSubstage
    ? migrateReviewSubstage(app.reviewSubstage)
    : undefined;
  const migratedAssessments = migrateReviewAssessments(app.reviewAssessments);

  let next: AdoptionApplication = {
    ...app,
    ...(migratedSubstage !== app.reviewSubstage ? { reviewSubstage: migratedSubstage } : {}),
    ...(migratedAssessments !== app.reviewAssessments
      ? { reviewAssessments: migratedAssessments }
      : {}),
  };

  if (next.stage === 'reviewing' && !next.reviewSubstage) {
    next = { ...next, reviewSubstage: 'contact' };
  }
  if (next.stage !== 'reviewing' && next.reviewSubstage) {
    const { reviewSubstage: _removed, ...rest } = next;
    next = rest;
  }
  if (next.stage === 'new') {
    const { interviewer: _interviewer, interviewerId: _interviewerId, ...rest } = next;
    return rest;
  }
  return ensureApprovedReviewAssessments(next);
}

function migrateApplications(apps: AdoptionApplication[]): AdoptionApplication[] {
  const storedIds = new Set(apps.map((app) => app.id));
  const migrated = apps.map(enrichApplication);
  const missingSeed = seedApplications
    .filter((seed) => !storedIds.has(seed.id))
    .map(enrichApplication);
  return [...migrated, ...missingSeed];
}

function applyRemovedApplicationFilter(apps: AdoptionApplication[]): AdoptionApplication[] {
  const removed = apps.filter(isPermanentlyRemovedApplication);
  purgeRemovedApplicationArtifacts(removed.map((app) => app.id));
  return apps.filter((app) => !isPermanentlyRemovedApplication(app));
}

function readStoredApplications(): AdoptionApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AdoptionApplication[];
  } catch {
    return [];
  }
}

export function deleteAdoptionApplicationRecord(appId: string): boolean {
  const stored = readStoredApplications();
  removeContactSchedulesForApplication(appId);
  removeAllAdoptionTeamTasksForApplication(appId);

  if (!stored.some((app) => app.id === appId)) {
    return false;
  }

  const withoutRemoved = applyRemovedApplicationFilter(stored.filter((app) => app.id !== appId));
  const next = migrateApplications(withoutRemoved);
  saveAdoptionApplications(next, { replace: true });
  return true;
}

export function deleteAdoptionApplicationByRef(ref: string): boolean {
  const appId = findApplicationIdByRef(ref);
  if (!appId) return false;
  return deleteAdoptionApplicationRecord(appId);
}

export function loadAdoptionApplications(): AdoptionApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = migrateApplications(seedApplications);
      persistApplications(seeded);
      return seeded;
    }
    const stored = JSON.parse(raw) as AdoptionApplication[];
    const withoutRemoved = applyRemovedApplicationFilter(stored);
    const migrated = migrateApplications(withoutRemoved);
    const changed =
      JSON.stringify(stored) !== JSON.stringify(migrated) || withoutRemoved.length !== stored.length;
    if (changed) {
      const migratedIds = new Set(migrated.map((app) => app.id));
      let next = migrated;
      try {
        const latestRaw = localStorage.getItem(STORAGE_KEY);
        if (latestRaw) {
          const latestStored = JSON.parse(latestRaw) as AdoptionApplication[];
          const concurrent = latestStored.filter(
            (app) => app.id.startsWith('app-') && !migratedIds.has(app.id),
          );
          if (concurrent.length > 0) {
            next = migrateApplications([...migrated, ...concurrent]);
          }
        }
      } catch {
        // keep migrated snapshot
      }
      persistApplications(next, { notifyListeners: false });
      return next;
    }
    return migrated;
  } catch {
    return migrateApplications(seedApplications);
  }
}

export function saveAdoptionApplications(
  apps: AdoptionApplication[],
  options?: { replace?: boolean },
) {
  let next = apps;
  if (!options?.replace) {
    const incomingIds = new Set(apps.map((app) => app.id));
    const preserved = readStoredApplications().filter(
      (app) => app.id.startsWith('app-') && !incomingIds.has(app.id),
    );
    if (preserved.length > 0) {
      next = migrateApplications([...apps, ...preserved]);
    }
  }
  persistApplications(next);
}

export function subscribeAdoptionApplications(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function unassignInterviewer(appId: string): AdoptionApplication | null {
  let updated: AdoptionApplication | null = null;
  const next = loadAdoptionApplications().map((app) => {
    if (app.id !== appId) return app;
    updated = enrichReviewSubstage({
      ...app,
      interviewer: undefined,
      interviewerId: undefined,
    });
    return updated;
  });
  if (!updated) return null;
  saveAdoptionApplications(next);
  return updated;
}

export function assignInterviewer(
  appId: string,
  caregiver: { id: string; name: string },
  options?: { moveToReviewing?: boolean },
  sourceApps?: AdoptionApplication[],
): AdoptionApplication | null {
  const stored = loadAdoptionApplications();
  const storedIds = new Set(stored.map((app) => app.id));
  const sourceById = new Map(sourceApps?.map((app) => [app.id, app]) ?? []);
  const base = [
    ...(sourceApps?.filter((app) => !storedIds.has(app.id)) ?? []),
    ...stored.map((app) => sourceById.get(app.id) ?? app),
  ];

  let updated: AdoptionApplication | null = null;
  const next = base.map((app) => {
    if (app.id !== appId) return app;
    const shouldMoveToReviewing =
      app.stage === 'new' ? (options?.moveToReviewing ?? true) : false;
    updated = enrichReviewSubstage({
      ...app,
      interviewer: caregiver.name,
      interviewerId: caregiver.id,
      ...(shouldMoveToReviewing
        ? { stage: 'reviewing' as const, reviewSubstage: 'contact' as ReviewSubstage }
        : {}),
    });
    return updated;
  });
  if (!updated) return null;
  saveAdoptionApplications(next);
  return updated;
}

export function advanceApplicationWorkflow(appId: string): AdoptionApplication | null {
  const app = loadAdoptionApplications().find((item) => item.id === appId);
  if (!app) return null;

  const patch = getWorkflowPatchAfterAdvance(app);
  let updated: AdoptionApplication | null = null;
  const next = loadAdoptionApplications().map((item) => {
    if (item.id !== appId) return item;
    updated = enrichReviewSubstage({ ...item, ...patch });
    return updated;
  });
  if (!updated) return null;
  saveAdoptionApplications(next);
  return updated;
}

export function submitVolunteerReviewAssessment(input: {
  applicationId: string;
  assigneeId: string;
  assigneeName: string;
  type: ReviewActivityAssessment['type'];
  notes: string;
  recommendation: ReviewActivityAssessment['recommendation'];
}): AdoptionApplication | null {
  const trimmedNotes = input.notes.trim();
  if (!trimmedNotes) return null;

  let updated: AdoptionApplication | null = null;
  const assessment: ReviewActivityAssessment = {
    type: input.type,
    assigneeId: input.assigneeId,
    assigneeName: input.assigneeName,
    notes: trimmedNotes,
    recommendation: input.recommendation,
    completedAt: new Date().toISOString(),
  };

  const next = loadAdoptionApplications().map((app) => {
    if (app.id !== input.applicationId) return app;
    const existing = app.reviewAssessments ?? [];
    const withoutType = existing.filter((item) => item.type !== input.type);
    updated = enrichReviewSubstage({
      ...app,
      reviewAssessments: [...withoutType, assessment],
    });
    return updated;
  });

  if (!updated) return null;
  saveAdoptionApplications(next);
  return updated;
}

export function moveApplicationStage(
  appId: string,
  stage: AdoptionApplication['stage'],
): AdoptionApplication | null {
  if (stage === 'rejected') return null;
  let updated: AdoptionApplication | null = null;
  const next = loadAdoptionApplications().map((app) => {
    if (app.id !== appId) return app;
    if (app.stage === stage) return app;
    const patch =
      stage === 'new'
        ? (() => {
            const { interviewer: _interviewer, interviewerId: _interviewerId, ...rest } = app;
            return rest;
          })()
        : app;
    updated = enrichReviewSubstage({
      ...patch,
      stage,
      reviewSubstage: getReviewSubstageForStage(stage, app.reviewSubstage),
    });
    return updated;
  });
  if (!updated) return null;
  saveAdoptionApplications(next);
  return updated;
}

export function rejectAdoptionApplication(
  appId: string,
  reason: string,
): AdoptionApplication | null {
  const trimmedReason = reason.trim();
  if (!trimmedReason) return null;

  let updated: AdoptionApplication | null = null;
  const next = loadAdoptionApplications().map((app) => {
    if (app.id !== appId) return app;
    updated = {
      ...app,
      stage: 'rejected',
      rejectionReason: trimmedReason,
      withdrawnByApplicant: false,
    };
    return updated;
  });
  if (!updated) return null;
  saveAdoptionApplications(next);
  return updated;
}

export type WithdrawApplicationResult =
  | { ok: true; application: AdoptionApplication }
  | { ok: false; error: 'not_found' | 'already_closed' };

export function withdrawAdoptionApplication(
  appId: string,
  applicantName: string,
  email: string,
): WithdrawApplicationResult {
  const app = loadAdoptionApplications().find((item) => item.id === appId);

  if (!app || !applicantsMatch(app.applicantName, app.email, applicantName, email)) {
    return { ok: false, error: 'not_found' };
  }

  if (!['new', 'reviewing', 'approved'].includes(app.stage)) {
    return { ok: false, error: 'already_closed' };
  }

  const wasApproved = app.stage === 'approved';
  let updated: AdoptionApplication | null = null;
  const next = loadAdoptionApplications().map((item) => {
    if (item.id !== appId) return item;
    updated = {
      ...item,
      stage: 'rejected',
      withdrawnByApplicant: true,
      rejectionReason: wasApproved
        ? 'Withdrawn by applicant after approval.'
        : 'Withdrawn by applicant.',
    };
    return updated;
  });

  if (!updated) return { ok: false, error: 'not_found' };
  saveAdoptionApplications(next);
  return { ok: true, application: updated };
}

export function dismissRejectedApplicationsForApplicant(
  applicantName: string,
  email: string,
): { dismissedCount: number } {
  let dismissedCount = 0;

  const next = loadAdoptionApplications().map((app) => {
    if (
      applicantsMatch(app.applicantName, app.email, applicantName, email) &&
      app.stage === 'rejected' &&
      !app.dismissedByApplicant
    ) {
      dismissedCount += 1;
      return { ...app, dismissedByApplicant: true };
    }
    return app;
  });

  if (dismissedCount > 0) {
    saveAdoptionApplications(next);
  }

  return { dismissedCount };
}

export type SubmitApplicationInput = {
  applicantName: string;
  email: string;
  phone?: string;
  catId: string;
  catName: string;
  notes?: string;
  lifestyleProfile: LifestyleProfile;
};

export type SubmitApplicationError = 'duplicate' | 'cat_unavailable';

export type SubmitApplicationResult =
  | { ok: true; application: AdoptionApplication }
  | { ok: false; error: SubmitApplicationError };

export function submitAdoptionApplication(
  input: SubmitApplicationInput,
): SubmitApplicationResult {
  const liveCat = getLiveCatById(input.catId);
  if (!liveCat || !isCatOpenForAdoption(liveCat)) {
    return { ok: false, error: 'cat_unavailable' };
  }
  if (hasBlockingActiveApplicationForCat(input.catId)) {
    return { ok: false, error: 'cat_unavailable' };
  }
  if (hasBlockingApplicationForApplicant(input.applicantName, input.email, input.catId)) {
    return { ok: false, error: 'duplicate' };
  }

  const { score, reasons } = evaluateApplicationMatch(input.catId, input.lifestyleProfile);

  const application: AdoptionApplication = {
    id: `app-${Date.now()}`,
    applicantName: input.applicantName.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim(),
    catId: input.catId,
    catName: input.catName,
    stage: 'new',
    submittedDate: new Date().toISOString().slice(0, 10),
    notes: input.notes?.trim() || `Adoption request for ${input.catName} from shelter website.`,
    lifestyleProfile: input.lifestyleProfile,
    matchScore: score,
    matchReasons: reasons,
  };
  saveAdoptionApplications([application, ...loadAdoptionApplications()]);

  notifyFosterAdoptionInterest({
    catId: application.catId,
    catName: application.catName,
    applicantName: application.applicantName,
    applicationId: application.id,
    submittedDate: application.submittedDate,
  });

  return { ok: true, application };
}
