import type { CareTask, TaskType, WorkRole } from '@/companion/types';
import type { AdoptionApplication } from '@/admin/types';
import { formatApplicationRef } from '@/shared/adoptionReference';
import { loadAdoptionApplications } from '@/shared/adoptionApplications';
import { getCaregiverById } from '@/shared/caregivers';
import { restockCatSupplies } from '@/shared/catSupplies';
import { logTaskCompletion } from '@/shared/taskActivity';
import { resolveIncidentReport } from '@/shared/incidentReports';

const STORAGE_KEY = 'kitticare-team-tasks';

export const UNASSIGNED_ASSIGNEE_ID = 'pending-assignment';

export type SupplyRequestSource = 'foster_resupply' | 'emergency';

export interface SupplyLineItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
}

export type TeamTask = CareTask & {
  assignedBy: 'manager';
  completedAt?: string;
};

const SEED_TASKS: TeamTask[] = [
  {
    id: 'admin-task-1',
    catId: null,
    catName: 'New rescue',
    type: 'pickup',
    title: 'Pick up cat — Oak Street',
    status: 'pending',
    dueTime: '4:30 PM today',
    instructions: 'Respond to a stray cat report. Bring carrier and gloves. Register in app after pickup.',
    notes: 'Assigned by Sarah Chen',
    assigneeId: 'cg-2',
    emoji: '🚗',
    workRole: 'volunteer',
    assignedBy: 'manager',
    location: '142 Oak Street, near the bus stop',
  },
];

type Listener = (tasks: TeamTask[]) => void;
const listeners = new Set<Listener>();

let teamTasksCache: TeamTask[] | null = null;

function persistTeamTasks(tasks: TeamTask[], options?: { notifyListeners?: boolean }) {
  teamTasksCache = tasks;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  if (options?.notifyListeners !== false) {
    notify(tasks);
  }
}

function notify(tasks: TeamTask[]) {
  listeners.forEach((fn) => fn(tasks));
}

export function loadTeamTasks(): TeamTask[] {
  if (teamTasksCache) return teamTasksCache;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      persistTeamTasks(SEED_TASKS);
      return SEED_TASKS;
    }
    const parsed = JSON.parse(raw) as TeamTask[];
    const apps = loadAdoptionApplications();
    const normalized = validateAdoptionTasksAgainstApplications(
      sanitizeTeamTasksStructure(parsed),
      apps,
    );
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      persistTeamTasks(normalized, { notifyListeners: false });
      return normalized;
    }
    teamTasksCache = normalized;
    return normalized;
  } catch {
    teamTasksCache = SEED_TASKS;
    return SEED_TASKS;
  }
}

function sanitizeTeamTasksStructure(tasks: TeamTask[]): TeamTask[] {
  const pickupByApp = new Map<string, TeamTask>();
  const reviewByApp = new Map<string, TeamTask>();
  const rest: TeamTask[] = [];

  for (const task of tasks) {
    if (task.status !== 'pending') {
      rest.push(task);
      continue;
    }

    if (isAdoptionPickupTeamTask(task)) {
      if (!task.applicationId) {
        continue;
      }
      const stableId = adoptionPickupTaskId(task.applicationId);
      const existing = pickupByApp.get(task.applicationId);
      const normalized = { ...task, id: stableId };
      if (!existing || task.id === stableId) {
        pickupByApp.set(task.applicationId, normalized);
      }
      continue;
    }

    if (isAdoptionReviewTeamTask(task) && task.applicationId) {
      const stableId = adoptionReviewTaskId(task.applicationId);
      const existing = reviewByApp.get(task.applicationId);
      const normalized = { ...task, id: stableId };
      if (!existing || task.id === stableId) {
        reviewByApp.set(task.applicationId, normalized);
      }
      continue;
    }

    rest.push(task);
  }

  return [...pickupByApp.values(), ...reviewByApp.values(), ...rest];
}

function validateAdoptionTasksAgainstApplications(
  tasks: TeamTask[],
  apps: AdoptionApplication[],
): TeamTask[] {
  const appById = new Map(apps.map((app) => [app.id, app]));

  return tasks.filter((task) => {
    if (task.status !== 'pending') {
      return true;
    }

    if (isAdoptionPickupTeamTask(task)) {
      if (!task.applicationId) {
        return false;
      }

      const app = appById.get(task.applicationId);
      return (
        !!app &&
        app.stage === 'approved' &&
        !!app.interviewerId &&
        app.interviewerId === task.assigneeId &&
        app.catId === task.catId
      );
    }

    if (isAdoptionReviewTeamTask(task)) {
      if (!task.applicationId) {
        return false;
      }

      const app = appById.get(task.applicationId);
      return (
        !!app &&
        app.stage === 'reviewing' &&
        !!app.interviewerId &&
        app.interviewerId === task.assigneeId
      );
    }

    return true;
  });
}

export function purgeInvalidAdoptionTeamTasks(apps = loadAdoptionApplications()): TeamTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return SEED_TASKS;
    }

    const parsed = JSON.parse(raw) as TeamTask[];
    const normalized = validateAdoptionTasksAgainstApplications(
      sanitizeTeamTasksStructure(parsed),
      apps,
    );

    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      saveTeamTasks(normalized);
    }

    return normalized;
  } catch {
    return SEED_TASKS;
  }
}

export function saveTeamTasks(tasks: TeamTask[]) {
  persistTeamTasks(tasks);
}

export function subscribeTeamTasks(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function addPickupTask(input: {
  location: string;
  catName?: string;
  instructions?: string;
  assigneeId?: string;
}) {
  const task: TeamTask = {
    id: `admin-task-${Date.now()}`,
    catId: null,
    catName: input.catName?.trim() || 'New rescue',
    type: 'pickup',
    title: `Pick up cat — ${input.location}`,
    status: 'pending',
    dueTime: 'Today',
    instructions: input.instructions?.trim() || 'Retrieve the cat and complete field intake in Paw Companion.',
    notes: 'Assigned by Sarah Chen',
    assigneeId: input.assigneeId ?? 'cg-2',
    emoji: '🚗',
    workRole: 'volunteer',
    assignedBy: 'manager',
    location: input.location,
  };
  saveTeamTasks([...loadTeamTasks(), task]);
  return task;
}

const TASK_EMOJI: Record<TaskType, string> = {
  pickup: '🚗',
  medication: '💊',
  feeding: '🍽️',
  behavior: '🐾',
  socialization: '🤝',
  cleaning: '🧹',
  checkup: '🩺',
  supply: '📦',
};

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  pickup: 'Pickup',
  medication: 'Medication',
  feeding: 'Feeding',
  behavior: 'Behavior check',
  socialization: 'Socialization',
  cleaning: 'Cleaning',
  checkup: 'Check-up',
  supply: 'Supply delivery',
};

export function addManualCareTask(input: {
  assigneeId: string;
  type: TaskType;
  title?: string;
  catId?: string | null;
  catName?: string;
  dueTime?: string;
  instructions?: string;
}) {
  const caregiver = getCaregiverById(input.assigneeId);
  const workRole: WorkRole = caregiver?.role === 'foster_parent' ? 'foster_parent' : 'volunteer';
  const catName = input.catName?.trim() || 'General';
  const task: TeamTask = {
    id: `admin-task-${Date.now()}`,
    catId: input.catId ?? null,
    catName,
    type: input.type,
    title:
      input.title?.trim() ||
      (input.catName
        ? `${TASK_TYPE_LABELS[input.type]} — ${input.catName}`
        : TASK_TYPE_LABELS[input.type]),
    status: 'pending',
    dueTime: input.dueTime?.trim() || 'Today',
    instructions:
      input.instructions?.trim() ||
      'Complete in Paw Companion and mark done when finished.',
    notes: 'Assigned by shelter manager',
    assigneeId: input.assigneeId,
    emoji: TASK_EMOJI[input.type],
    workRole,
    assignedBy: 'manager',
  };
  saveTeamTasks([task, ...loadTeamTasks()]);
  return task;
}

export function isAdoptionReviewTeamTask(task: TeamTask) {
  return (
    (task.type === 'checkup' && Boolean(task.applicationId)) ||
    task.title.startsWith('Adoption review')
  );
}

export function isAdoptionPickupTeamTask(task: TeamTask) {
  return task.type === 'pickup' && task.title.startsWith('Adoption pickup');
}

export function isSupplyRequestTeamTask(task: TeamTask) {
  return task.type === 'supply' && Boolean(task.supplyRequest);
}

export function isIncidentResponseTeamTask(task: TeamTask) {
  return Boolean(task.incidentReportId) && task.title.startsWith('Emergency follow-up');
}

export function isUnassignedSupplyRequest(task: TeamTask) {
  return isSupplyRequestTeamTask(task) && task.assigneeId === UNASSIGNED_ASSIGNEE_ID;
}

export function getPendingSupplyRequestsByCaregiver(tasks: TeamTask[] = loadTeamTasks()) {
  const map = new Map<string, TeamTask[]>();
  for (const task of tasks) {
    if (task.status !== 'pending' || !isSupplyRequestTeamTask(task)) continue;
    const caregiverId = task.supplyRequest?.requestedById;
    if (!caregiverId) continue;
    const list = map.get(caregiverId) ?? [];
    list.push(task);
    map.set(caregiverId, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => b.id.localeCompare(a.id));
  }
  return map;
}

export function countPendingFosterSupplyRequests(tasks: TeamTask[] = loadTeamTasks()) {
  return [...getPendingSupplyRequestsByCaregiver(tasks).values()].reduce(
    (total, list) => total + list.length,
    0,
  );
}

export function addSupplyRequestTask(input: {
  catId: string;
  catName: string;
  requestedById: string;
  requestedByName: string;
  source: SupplyRequestSource;
  items: SupplyLineItem[];
  notes?: string;
}) {
  const itemSummary = input.items.map((item) => `${item.name} × ${item.quantity}`).join(', ');
  const task: TeamTask = {
    id: `admin-task-supply-${Date.now()}`,
    catId: input.catId,
    catName: input.catName,
    type: 'supply',
    title: `Supply request — ${input.catName}`,
    status: 'pending',
    dueTime: 'Today',
    instructions: itemSummary,
    notes:
      input.source === 'emergency'
        ? `Emergency supply request from ${input.requestedByName}`
        : `Foster resupply from ${input.requestedByName}`,
    assigneeId: UNASSIGNED_ASSIGNEE_ID,
    emoji: '📦',
    workRole: 'volunteer',
    assignedBy: 'manager',
    supplyRequest: {
      items: input.items,
      requestedById: input.requestedById,
      requestedByName: input.requestedByName,
      source: input.source,
      notes: input.notes,
    },
  };
  saveTeamTasks([task, ...loadTeamTasks()]);
  return task;
}

export function addIncidentResponseTask(input: {
  incidentReportId: string;
  catId: string;
  catName: string;
  reporterName: string;
  summary: string;
}) {
  const task: TeamTask = {
    id: `admin-task-incident-${input.incidentReportId}`,
    catId: input.catId,
    catName: input.catName,
    type: 'checkup',
    title: `Emergency follow-up — ${input.catName}`,
    status: 'pending',
    dueTime: 'Today',
    instructions:
      input.summary.trim() ||
      'Review the emergency report, contact the reporter, and coordinate next steps.',
    notes: `Reported by ${input.reporterName}`,
    assigneeId: UNASSIGNED_ASSIGNEE_ID,
    emoji: '🚨',
    workRole: 'volunteer',
    assignedBy: 'manager',
    incidentReportId: input.incidentReportId,
  };
  saveTeamTasks([task, ...loadTeamTasks()]);
  return task;
}

export function assignSupplyRequestTask(taskId: string, assigneeId: string) {
  const tasks = loadTeamTasks();
  const existing = tasks.find((task) => task.id === taskId);
  if (!existing || !isSupplyRequestTeamTask(existing)) return null;

  const caregiver = getCaregiverById(assigneeId);
  const workRole: WorkRole = caregiver?.role === 'foster_parent' ? 'foster_parent' : 'volunteer';
  const next = tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          assigneeId,
          workRole,
          dueTime: 'Today',
          instructions:
            task.instructions ||
            task.supplyRequest?.items.map((item) => `${item.name} × ${item.quantity}`).join(', ') ||
            'Deliver supplies to foster home.',
        }
      : task,
  );
  saveTeamTasks(next);
  return next.find((task) => task.id === taskId) ?? null;
}

export function adoptionReviewTaskId(applicationId: string) {
  return `admin-task-review-${applicationId}`;
}

export function adoptionPickupTaskId(applicationId: string) {
  return `admin-task-pickup-${applicationId}`;
}

function isPendingAdoptionPickupForApplication(task: TeamTask, applicationId: string) {
  return (
    task.status === 'pending' &&
    task.applicationId === applicationId &&
    isAdoptionPickupTeamTask(task)
  );
}

function buildAdoptionReviewTask(input: {
  applicationId: string;
  catId: string;
  catName: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  visitAvailability?: string;
  catExperience?: string;
  housingType?: 'own' | 'rent';
  assigneeId: string;
  workRole: WorkRole;
  reviewSubstage?: string;
  notes?: string;
  instructions?: string;
}): Omit<TeamTask, 'id'> {
  const substageLabel = input.reviewSubstage ? ` · ${input.reviewSubstage}` : '';
  return {
    catId: input.catId,
    catName: input.catName,
    type: 'checkup',
    title: `Adoption review for ${input.catName}${substageLabel}`,
    status: 'pending',
    dueTime: 'Today',
    instructions: input.instructions?.trim() || '',
    notes: input.notes?.trim() || `Adoption ${formatApplicationRef(input.applicationId)}`,
    assigneeId: input.assigneeId,
    emoji: '🏠',
    workRole: input.workRole,
    assignedBy: 'manager',
    applicationId: input.applicationId,
    adoptionApplicant: {
      name: input.applicantName,
      email: input.applicantEmail,
      phone: input.applicantPhone,
      visitAvailability: input.visitAvailability,
      catExperience: input.catExperience,
      housingType: input.housingType,
      reviewSubstage: input.reviewSubstage,
    },
  };
}

export function upsertAdoptionReviewTask(input: {
  applicationId: string;
  catId: string;
  catName: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  visitAvailability?: string;
  catExperience?: string;
  housingType?: 'own' | 'rent';
  assigneeId: string;
  workRole: WorkRole;
  reviewSubstage?: string;
  notes?: string;
  instructions?: string;
}) {
  const tasks = loadTeamTasks();
  const taskId = adoptionReviewTaskId(input.applicationId);
  const withoutPendingReview = tasks.filter(
    (task) =>
      !(
        task.status === 'pending' &&
        task.applicationId === input.applicationId &&
        (isAdoptionReviewTeamTask(task) || task.id === taskId)
      ),
  );
  const payload = buildAdoptionReviewTask(input);
  const task: TeamTask = {
    id: taskId,
    ...payload,
  };
  saveTeamTasks([task, ...withoutPendingReview]);
  return task;
}

/** @deprecated Use upsertAdoptionReviewTask */
export function addAdoptionReviewTask(input: {
  applicationId: string;
  catId: string;
  catName: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  visitAvailability?: string;
  catExperience?: string;
  housingType?: 'own' | 'rent';
  assigneeId: string;
  workRole: WorkRole;
  reviewSubstage?: string;
  notes?: string;
}) {
  return upsertAdoptionReviewTask(input);
}

export function removePendingAdoptionReviewTasksForApplication(applicationId: string) {
  const next = loadTeamTasks().filter(
    (task) =>
      !(
        task.applicationId === applicationId &&
        isAdoptionReviewTeamTask(task) &&
        task.status === 'pending'
      ),
  );
  saveTeamTasks(next);
}

export function removePendingAdoptionPickupTasksForApplication(applicationId: string) {
  const next = loadTeamTasks().filter(
    (task) => !isPendingAdoptionPickupForApplication(task, applicationId),
  );
  saveTeamTasks(next);
}

export function completeAdoptionReviewTasksForApplication(applicationId: string) {
  const next = loadTeamTasks().map((task) =>
    task.applicationId === applicationId && isAdoptionReviewTeamTask(task) && task.status === 'pending'
      ? { ...task, status: 'completed' as const }
      : task,
  );
  saveTeamTasks(next);
}

export function completeAdoptionPickupTasksForApplication(applicationId: string) {
  const next = loadTeamTasks().map((task) =>
    task.applicationId === applicationId && isAdoptionPickupTeamTask(task) && task.status === 'pending'
      ? { ...task, status: 'completed' as const }
      : task,
  );
  saveTeamTasks(next);
}

export function completeAdoptionTasksForApplication(applicationId: string) {
  completeAdoptionReviewTasksForApplication(applicationId);
  completeAdoptionPickupTasksForApplication(applicationId);
}

export function upsertAdoptionPickupTask(input: {
  applicationId: string;
  catId: string;
  catName: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  assigneeId: string;
  workRole: WorkRole;
  dueTime?: string;
}) {
  const tasks = loadTeamTasks();
  const taskId = adoptionPickupTaskId(input.applicationId);
  const withoutPendingPickup = tasks.filter(
    (task) =>
      !(
        task.status === 'pending' &&
        task.applicationId === input.applicationId &&
        (isAdoptionPickupTeamTask(task) || task.id === taskId)
      ),
  );

  const payload: Omit<TeamTask, 'id'> = {
    catId: input.catId,
    catName: input.catName,
    type: 'pickup',
    title: `Adoption pickup — ${input.applicantName}`,
    status: 'pending',
    dueTime: input.dueTime?.trim() || 'Coordinate pickup time with adopter',
    instructions: '',
    notes: `Adoption ${formatApplicationRef(input.applicationId)}`,
    assigneeId: input.assigneeId,
    emoji: '📋',
    workRole: input.workRole,
    assignedBy: 'manager',
    applicationId: input.applicationId,
    adoptionApplicant: {
      name: input.applicantName,
      email: input.applicantEmail,
      phone: input.applicantPhone,
    },
  };

  const task: TeamTask = { id: taskId, ...payload };
  saveTeamTasks([task, ...withoutPendingPickup]);
  return task;
}

export function linkIntakeToTeamTask(
  taskId: string,
  cat: { id: string; name: string; notes?: string; referencePhotoUrl?: string },
) {
  const next = loadTeamTasks().map((t) =>
    t.id === taskId
      ? {
          ...t,
          catId: cat.id,
          catName: cat.name,
          referencePhotoUrl: cat.referencePhotoUrl ?? t.referencePhotoUrl,
          title:
            t.title.startsWith('Pick up cat') && !/registered/i.test(t.title)
              ? `${t.title} — registered`
              : t.title,
          instructions: `Cat registered as ${cat.name}. Transfer to shelter and confirm intake details.${cat.notes ? ` ${cat.notes}` : ''}`,
        }
      : t,
  );
  saveTeamTasks(next);
}

export function savePickupSubmissionPhotos(taskId: string, photos: string[]) {
  const next = loadTeamTasks().map((t) =>
    t.id === taskId ? { ...t, submissionPhotos: photos } : t,
  );
  saveTeamTasks(next);
}

export function completeTeamTask(
  taskId: string,
  completedBy?: { id: string; name: string },
) {
  const tasks = loadTeamTasks();
  const task = tasks.find((item) => item.id === taskId);
  if (!task || task.status === 'completed') return;

  const next = tasks.map((t) =>
    t.id === taskId
      ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() }
      : t,
  );
  saveTeamTasks(next);

  if (isSupplyRequestTeamTask(task) && task.catId) {
    restockCatSupplies(task.catId);
  }

  if (isIncidentResponseTeamTask(task) && task.incidentReportId) {
    resolveIncidentReport(task.incidentReportId);
  }

  if (completedBy) {
    const assigneeName = getCaregiverById(task.assigneeId)?.name ?? 'Caregiver';
    logTaskCompletion(task, completedBy, assigneeName);
  }
}

export function updateTeamTaskDueTime(taskId: string, dueTime: string) {
  const next = loadTeamTasks().map((task) =>
    task.id === taskId ? { ...task, dueTime } : task,
  );
  saveTeamTasks(next);
}

export function removeAllAdoptionTeamTasksForApplication(applicationId: string) {
  const next = loadTeamTasks().filter(
    (task) =>
      task.applicationId !== applicationId ||
      (!isAdoptionReviewTeamTask(task) && !isAdoptionPickupTeamTask(task)),
  );
  saveTeamTasks(next);
}
