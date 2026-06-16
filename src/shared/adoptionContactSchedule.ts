import type { ReviewSubstage } from '@/shared/adoptionWorkflow';

export type ContactScheduleStatus =
  | 'pending_adopter'
  | 'accepted'
  | 'declined'
  | 'counter_proposed';

export interface AdoptionContactSchedule {
  applicationId: string;
  reviewSubstage: ReviewSubstage;
  status: ContactScheduleStatus;
  scheduledAt: string;
  proposedBy: 'volunteer' | 'adopter';
  volunteerId: string;
  volunteerName: string;
  note?: string;
  updatedAt: string;
}

const STORAGE_KEY = 'kitticare-adoption-contact-schedules';

type Listener = (schedules: AdoptionContactSchedule[]) => void;
const listeners = new Set<Listener>();

function notify(schedules: AdoptionContactSchedule[]) {
  listeners.forEach((fn) => fn(schedules));
}

function normalizeSchedule(schedule: AdoptionContactSchedule): AdoptionContactSchedule {
  return {
    ...schedule,
    reviewSubstage: schedule.reviewSubstage ?? 'contact',
  };
}

export function loadContactSchedules(): AdoptionContactSchedule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as AdoptionContactSchedule[]).map(normalizeSchedule);
  } catch {
    return [];
  }
}

function saveContactSchedules(schedules: AdoptionContactSchedule[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
  notify(schedules);
}

export function subscribeContactSchedules(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getContactSchedule(
  applicationId: string,
  reviewSubstage: ReviewSubstage = 'contact',
): AdoptionContactSchedule | null {
  return (
    loadContactSchedules().find(
      (item) => item.applicationId === applicationId && item.reviewSubstage === reviewSubstage,
    ) ?? null
  );
}

/** Whether the adopter UI should show the schedule panel for a track step. */
export function shouldShowAdopterSchedulePanel(
  applicationId: string,
  reviewSubstage: ReviewSubstage,
  isCurrentStep: boolean,
): boolean {
  const schedule = getContactSchedule(applicationId, reviewSubstage);
  if (isCurrentStep) return true;
  return schedule?.status === 'pending_adopter';
}

export function formatContactScheduleTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function proposeVolunteerContactTime(input: {
  applicationId: string;
  reviewSubstage: ReviewSubstage;
  volunteerId: string;
  volunteerName: string;
  scheduledAt: string;
  note?: string;
}): AdoptionContactSchedule {
  const schedule: AdoptionContactSchedule = {
    applicationId: input.applicationId,
    reviewSubstage: input.reviewSubstage,
    status: 'pending_adopter',
    scheduledAt: input.scheduledAt,
    proposedBy: 'volunteer',
    volunteerId: input.volunteerId,
    volunteerName: input.volunteerName,
    note: input.note?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  };

  const others = loadContactSchedules().filter(
    (item) =>
      !(
        item.applicationId === input.applicationId &&
        item.reviewSubstage === input.reviewSubstage
      ),
  );
  saveContactSchedules([schedule, ...others]);
  return schedule;
}

export function acceptContactByAdopter(
  applicationId: string,
  reviewSubstage: ReviewSubstage = 'contact',
): AdoptionContactSchedule | null {
  const existing = getContactSchedule(applicationId, reviewSubstage);
  if (!existing || existing.status !== 'pending_adopter') return null;

  const updated: AdoptionContactSchedule = {
    ...existing,
    status: 'accepted',
    updatedAt: new Date().toISOString(),
  };
  const next = loadContactSchedules().map((item) =>
    item.applicationId === applicationId && item.reviewSubstage === reviewSubstage ? updated : item,
  );
  saveContactSchedules(next);
  return updated;
}

export function declineContactByAdopter(
  applicationId: string,
  reviewSubstage: ReviewSubstage = 'contact',
): AdoptionContactSchedule | null {
  const existing = getContactSchedule(applicationId, reviewSubstage);
  if (!existing || existing.status !== 'pending_adopter') return null;

  const updated: AdoptionContactSchedule = {
    ...existing,
    status: 'declined',
    updatedAt: new Date().toISOString(),
  };
  const next = loadContactSchedules().map((item) =>
    item.applicationId === applicationId && item.reviewSubstage === reviewSubstage ? updated : item,
  );
  saveContactSchedules(next);
  return updated;
}

export function counterProposeByAdopter(input: {
  applicationId: string;
  reviewSubstage?: ReviewSubstage;
  scheduledAt: string;
}): AdoptionContactSchedule | null {
  const reviewSubstage = input.reviewSubstage ?? 'contact';
  const existing = getContactSchedule(input.applicationId, reviewSubstage);
  if (!existing || existing.status !== 'pending_adopter') return null;

  const updated: AdoptionContactSchedule = {
    ...existing,
    status: 'counter_proposed',
    scheduledAt: input.scheduledAt,
    proposedBy: 'adopter',
    updatedAt: new Date().toISOString(),
  };
  const next = loadContactSchedules().map((item) =>
    item.applicationId === input.applicationId && item.reviewSubstage === reviewSubstage
      ? updated
      : item,
  );
  saveContactSchedules(next);
  return updated;
}

export function acceptCounterByVolunteer(
  applicationId: string,
  reviewSubstage: ReviewSubstage = 'contact',
): AdoptionContactSchedule | null {
  const existing = getContactSchedule(applicationId, reviewSubstage);
  if (!existing || existing.status !== 'counter_proposed') return null;

  const updated: AdoptionContactSchedule = {
    ...existing,
    status: 'accepted',
    proposedBy: 'adopter',
    updatedAt: new Date().toISOString(),
  };
  const next = loadContactSchedules().map((item) =>
    item.applicationId === applicationId && item.reviewSubstage === reviewSubstage ? updated : item,
  );
  saveContactSchedules(next);
  return updated;
}

export function removeContactSchedulesForApplication(applicationId: string) {
  const next = loadContactSchedules().filter((item) => item.applicationId !== applicationId);
  saveContactSchedules(next);
}
