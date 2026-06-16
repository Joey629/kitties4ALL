import { getCatById } from '@/admin/data/mock';
import { getFosterCaregiverIdForCat } from '@/shared/taskAdmin';
import {
  addTeamMessage,
  DEFAULT_MANAGER_CONTACT_ID,
  MANAGER_NAME,
  threadIdFor,
} from '@/shared/teamMessages';

const APPLICATIONS_KEY = 'kitticare-foster-applications';
const MATCHES_KEY = 'kitticare-foster-matches';
const ASSIGNMENTS_KEY = 'kitticare-foster-assignments';
const INTERESTS_KEY = 'kitticare-foster-adoption-interests';

export const FOSTER_WORKFLOW_STORAGE_KEYS = [
  APPLICATIONS_KEY,
  MATCHES_KEY,
  ASSIGNMENTS_KEY,
  INTERESTS_KEY,
] as const;

export function isFosterWorkflowStorageKey(key: string | null) {
  return FOSTER_WORKFLOW_STORAGE_KEYS.includes(key as (typeof FOSTER_WORKFLOW_STORAGE_KEYS)[number]);
}

export type FosterApplicationStatus = 'submitted' | 'under_review' | 'approved' | 'rejected';
export type FosterMatchStatus = 'pending' | 'accepted' | 'declined';
export type FosterAdoptionInterestStatus = 'new' | 'acknowledged';

export interface FosterApplication {
  id: string;
  caregiverId: string;
  caregiverName: string;
  status: FosterApplicationStatus;
  householdType: 'house' | 'apartment';
  hasOtherPets: boolean;
  experience: string;
  availability: string;
  notes?: string;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface FosterMatch {
  id: string;
  caregiverId: string;
  caregiverName: string;
  catId: string;
  catName: string;
  status: FosterMatchStatus;
  summary: string;
  proposedAt: string;
  respondedAt?: string;
}

export interface FosterAssignment {
  id: string;
  caregiverId: string;
  catId: string;
  catName: string;
  matchId: string;
  acceptedAt: string;
}

export interface FosterAdoptionInterest {
  id: string;
  caregiverId: string;
  catId: string;
  catName: string;
  applicantName: string;
  applicationId: string;
  submittedDate: string;
  status: FosterAdoptionInterestStatus;
  message: string;
}

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeFosterWorkflow(listener: Listener) {
  listener();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  notify();
}

export function loadFosterApplications() {
  return loadJson<FosterApplication[]>(APPLICATIONS_KEY, []);
}

export function loadFosterMatches() {
  return loadJson<FosterMatch[]>(MATCHES_KEY, []);
}

export function loadFosterAssignments() {
  return loadJson<FosterAssignment[]>(ASSIGNMENTS_KEY, []);
}

export function loadFosterAdoptionInterests() {
  return loadJson<FosterAdoptionInterest[]>(INTERESTS_KEY, []);
}

export function getFosterApplicationForCaregiver(caregiverId: string) {
  return loadFosterApplications().find((application) => application.caregiverId === caregiverId);
}

export function getPendingFosterMatches(caregiverId: string) {
  return loadFosterMatches().filter(
    (match) => match.caregiverId === caregiverId && match.status === 'pending',
  );
}

export function getFosterMatchById(matchId: string) {
  return loadFosterMatches().find((match) => match.id === matchId);
}

export function getFosterAssignedCatIds(caregiverId: string) {
  return loadFosterAssignments()
    .filter((assignment) => assignment.caregiverId === caregiverId)
    .map((assignment) => assignment.catId);
}

export function getOpenFosterAdoptionInterests(caregiverId: string) {
  return loadFosterAdoptionInterests().filter(
    (interest) => interest.caregiverId === caregiverId && interest.status === 'new',
  );
}

export function submitFosterApplication(input: {
  caregiverId: string;
  caregiverName: string;
  householdType: 'house' | 'apartment';
  hasOtherPets: boolean;
  experience: string;
  availability: string;
  notes?: string;
}) {
  const existing = getFosterApplicationForCaregiver(input.caregiverId);
  if (existing && existing.status !== 'rejected') {
    return existing;
  }

  const application: FosterApplication = {
    id: `fa-${Date.now()}`,
    caregiverId: input.caregiverId,
    caregiverName: input.caregiverName,
    status: 'submitted',
    householdType: input.householdType,
    hasOtherPets: input.hasOtherPets,
    experience: input.experience.trim(),
    availability: input.availability.trim(),
    notes: input.notes?.trim(),
    submittedAt: new Date().toISOString(),
  };

  saveJson(APPLICATIONS_KEY, [application, ...loadFosterApplications().filter((item) => item.id !== existing?.id)]);

  addTeamMessage(
    `📋 Foster application submitted by ${input.caregiverName}`,
    input.caregiverName,
    'caregiver',
    threadIdFor(DEFAULT_MANAGER_CONTACT_ID),
    input.caregiverId,
  );

  return application;
}

export function withdrawFosterApplication(caregiverId: string) {
  const applications = loadFosterApplications();
  const application = applications.find((item) => item.caregiverId === caregiverId);
  if (!application) return null;
  if (application.status !== 'submitted' && application.status !== 'under_review') {
    return null;
  }

  saveJson(
    APPLICATIONS_KEY,
    applications.filter((item) => item.id !== application.id),
  );

  addTeamMessage(
    `Foster application withdrawn — ${application.caregiverName} cancelled their pending application.`,
    application.caregiverName,
    'caregiver',
    threadIdFor(DEFAULT_MANAGER_CONTACT_ID),
    caregiverId,
  );

  return application;
}

export function reviewFosterApplication(
  applicationId: string,
  decision: 'approve' | 'reject',
  options?: { rejectionReason?: string },
) {
  const applications = loadFosterApplications();
  const application = applications.find((item) => item.id === applicationId);
  if (!application) return null;

  const updated: FosterApplication = {
    ...application,
    status: decision === 'approve' ? 'approved' : 'rejected',
    reviewedAt: new Date().toISOString(),
    rejectionReason: decision === 'reject' ? options?.rejectionReason?.trim() || 'Not approved at this time.' : undefined,
  };

  saveJson(
    APPLICATIONS_KEY,
    applications.map((item) => (item.id === applicationId ? updated : item)),
  );

  addTeamMessage(
    decision === 'approve'
      ? `✅ Foster application approved — ${application.caregiverName} is ready for cat matching.`
      : `Foster application update — ${application.caregiverName}: not approved at this time.`,
    MANAGER_NAME,
    'manager',
    threadIdFor(application.caregiverId),
    DEFAULT_MANAGER_CONTACT_ID,
  );

  return updated;
}

export function proposeFosterMatch(input: {
  caregiverId: string;
  caregiverName: string;
  catId: string;
  summary?: string;
}) {
  const cat = getCatById(input.catId);
  if (!cat) return null;

  const application = getFosterApplicationForCaregiver(input.caregiverId);
  if (!application || application.status !== 'approved') return null;

  const match: FosterMatch = {
    id: `fm-${Date.now()}`,
    caregiverId: input.caregiverId,
    caregiverName: input.caregiverName,
    catId: cat.id,
    catName: cat.name,
    status: 'pending',
    summary:
      input.summary?.trim() ||
      `${cat.name} needs a calm foster home. Review the profile and accept if your home is a good fit.`,
    proposedAt: new Date().toISOString(),
  };

  saveJson(MATCHES_KEY, [match, ...loadFosterMatches()]);

  addTeamMessage(
    `🏠 Foster match — ${cat.name} is available for your home. Review the cat profile and accept or decline in Paw Companion.`,
    MANAGER_NAME,
    'manager',
    threadIdFor(input.caregiverId),
    DEFAULT_MANAGER_CONTACT_ID,
  );

  return match;
}

export function acceptFosterMatch(matchId: string) {
  const matches = loadFosterMatches();
  const match = matches.find((item) => item.id === matchId);
  if (!match || match.status !== 'pending') return null;

  const assignment: FosterAssignment = {
    id: `fas-${Date.now()}`,
    caregiverId: match.caregiverId,
    catId: match.catId,
    catName: match.catName,
    matchId: match.id,
    acceptedAt: new Date().toISOString(),
  };

  saveJson(MATCHES_KEY, matches.map((item) =>
    item.id === matchId
      ? { ...item, status: 'accepted' as const, respondedAt: new Date().toISOString() }
      : item,
  ));
  saveJson(ASSIGNMENTS_KEY, [assignment, ...loadFosterAssignments()]);

  addTeamMessage(
    `✅ Foster assignment accepted — ${match.caregiverName} will foster ${match.catName}.`,
    match.caregiverName,
    'caregiver',
    threadIdFor(DEFAULT_MANAGER_CONTACT_ID),
    match.caregiverId,
  );

  return { match, assignment };
}

export function declineFosterMatch(matchId: string) {
  const matches = loadFosterMatches();
  const match = matches.find((item) => item.id === matchId);
  if (!match || match.status !== 'pending') return null;

  saveJson(MATCHES_KEY, matches.map((item) =>
    item.id === matchId
      ? { ...item, status: 'declined' as const, respondedAt: new Date().toISOString() }
      : item,
  ));

  addTeamMessage(
    `Foster match declined — ${match.caregiverName} passed on ${match.catName} for now.`,
    match.caregiverName,
    'caregiver',
    threadIdFor(DEFAULT_MANAGER_CONTACT_ID),
    match.caregiverId,
  );

  return match;
}

export function notifyFosterAdoptionInterest(input: {
  catId: string;
  catName: string;
  applicantName: string;
  applicationId: string;
  submittedDate: string;
}) {
  const cat = getCatById(input.catId);
  if (!cat || cat.placement !== 'foster') return null;

  const caregiverId = getFosterCaregiverIdForCat(cat);
  if (!caregiverId) return null;

  const existing = loadFosterAdoptionInterests().find(
    (interest) => interest.applicationId === input.applicationId,
  );
  if (existing) return existing;

  const interest: FosterAdoptionInterest = {
    id: `fai-${Date.now()}`,
    caregiverId,
    catId: input.catId,
    catName: input.catName,
    applicantName: input.applicantName,
    applicationId: input.applicationId,
    submittedDate: input.submittedDate,
    status: 'new',
    message: `${input.applicantName} applied to adopt ${input.catName}. The shelter team may schedule a meet-and-greet.`,
  };

  saveJson(INTERESTS_KEY, [interest, ...loadFosterAdoptionInterests()]);

  addTeamMessage(
    `💛 Adoption interest — ${input.applicantName} applied for ${input.catName}. Review in Paw Companion.`,
    MANAGER_NAME,
    'manager',
    threadIdFor(caregiverId),
    DEFAULT_MANAGER_CONTACT_ID,
  );

  return interest;
}

export function acknowledgeFosterAdoptionInterest(interestId: string) {
  const interests = loadFosterAdoptionInterests();
  const interest = interests.find((item) => item.id === interestId);
  if (!interest) return null;

  const updated = { ...interest, status: 'acknowledged' as const };
  saveJson(
    INTERESTS_KEY,
    interests.map((item) => (item.id === interestId ? updated : item)),
  );
  return updated;
}

export function getPendingFosterApplications() {
  return loadFosterApplications()
    .filter(
      (application) =>
        application.status === 'submitted' || application.status === 'under_review',
    )
    .sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
}

export function isPendingFosterApplication(application?: FosterApplication) {
  return application?.status === 'submitted' || application?.status === 'under_review';
}

export function countPendingFosterApplications() {
  return getPendingFosterApplications().length;
}

export function markFosterApplicationUnderReview(applicationId: string) {
  const applications = loadFosterApplications();
  const next = applications.map((item) =>
    item.id === applicationId && item.status === 'submitted'
      ? { ...item, status: 'under_review' as const }
      : item,
  );
  saveJson(APPLICATIONS_KEY, next);
}
