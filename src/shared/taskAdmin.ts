import type { AdminCat, AdoptionApplication } from '@/admin/types';
import type { TaskType } from '@/companion/types';
import { adminCats } from '@/admin/data/mock';
import { formatQueueAge } from '@/admin/lib/dashboardData';
import { getActiveFosterParent } from '@/admin/lib/catDisplay';
import { getCaregiverById } from '@/shared/caregivers';
import { getContactSchedule } from '@/shared/adoptionContactSchedule';
import { getContactScheduleStatusLabel } from '@/shared/adoptionScheduleStatus';
import {
  getAdvanceBlockReason,
  getVolunteerAwaitingSummary,
} from '@/shared/adoptionReviewActivities';
import {
  isAdoptionPickupTeamTask,
  isAdoptionReviewTeamTask,
  isIncidentResponseTeamTask,
  isSupplyRequestTeamTask,
  isUnassignedSupplyRequest,
  loadTeamTasks,
  UNASSIGNED_ASSIGNEE_ID,
  type TeamTask,
} from '@/shared/teamTasks';
import { loadIncidentReports } from '@/shared/incidentReports';
import { getPendingFosterApplications } from '@/shared/fosterWorkflow';
import { normalizeReviewSubstage, getReviewSubstageLabel } from '@/shared/adoptionWorkflow';

export function getTaskSourceLabel(task: TeamTask): string {
  if (isSupplyRequestTeamTask(task) || isIncidentResponseTeamTask(task)) {
    return 'Auto';
  }
  if (
    task.applicationId &&
    (isAdoptionReviewTeamTask(task) || isAdoptionPickupTeamTask(task))
  ) {
    return 'Auto';
  }
  return 'Manual';
}

export function getTaskAssigneeName(task: TeamTask): string {
  if (task.assigneeId === UNASSIGNED_ASSIGNEE_ID) {
    return 'Needs assignment';
  }
  return getCaregiverById(task.assigneeId)?.name ?? 'Unassigned';
}

export function getTaskStatusLabel(task: TeamTask): string {
  return task.status === 'completed' ? 'Completed' : 'Pending';
}

export function getPendingTasksForAssignee(assigneeId: string): TeamTask[] {
  return loadTeamTasks().filter(
    (task) => task.assigneeId === assigneeId && task.status === 'pending',
  );
}

export function getPendingTasksForCat(catId: string): TeamTask[] {
  return loadTeamTasks().filter(
    (task) => task.catId === catId && task.status === 'pending',
  );
}

export function getLinkedTaskForApplication(applicationId: string): TeamTask | undefined {
  return loadTeamTasks().find(
    (task) => task.applicationId === applicationId && task.status === 'pending',
  );
}

export function getFosterCaregiverIdForCat(cat: AdminCat): string | null {
  if (cat.placement !== 'foster') return null;
  if (cat.caregiverId) return cat.caregiverId;
  const active = cat.fosterHistory?.find((record) => record.status === 'active');
  if (!active?.fosterParent) return null;
  const match = loadTeamTasks()
    .map((task) => getCaregiverById(task.assigneeId))
    .find((caregiver) => caregiver?.name === active.fosterParent);
  return match?.id ?? cat.caregiverId ?? null;
}

export interface VolunteerFieldWorkSummary {
  assigneeName: string;
  taskTitle: string | null;
  taskStatus: 'pending' | 'completed' | 'none';
  scheduleLabel: string | null;
  waitingSummary: string | null;
  blockReason: string | null;
}

export function getVolunteerFieldWorkSummary(
  app: AdoptionApplication,
): VolunteerFieldWorkSummary | null {
  if (!app.interviewerId) return null;

  const task = loadTeamTasks().find((item) => item.applicationId === app.id);
  const substage = normalizeReviewSubstage(app) ?? 'contact';
  const scheduleType =
    app.stage === 'approved' ? null : substage === 'contact' ? 'contact' : 'shelter_visit';
  const schedule = scheduleType ? getContactSchedule(app.id, scheduleType) : null;

  return {
    assigneeName: app.interviewer ?? getTaskAssigneeName({ assigneeId: app.interviewerId } as TeamTask),
    taskTitle: task?.title ?? null,
    taskStatus: task?.status ?? 'none',
    scheduleLabel: schedule ? getContactScheduleStatusLabel(schedule) : null,
    waitingSummary: getVolunteerAwaitingSummary(app),
    blockReason: getAdvanceBlockReason(app),
  };
}

export interface TaskFeedAction {
  label: string;
  href: string;
}

export type TodayTaskCategory = 'emergency' | 'health' | 'supply' | 'approval';

const CATEGORY_LABELS: Record<TodayTaskCategory, string> = {
  emergency: 'Emergency Report',
  health: 'Health Alert',
  supply: 'Supply Request',
  approval: 'Pending Approval',
};

export type TasksAndAlertsRow = {
  id: string;
  category: TodayTaskCategory;
  categoryLabel: string;
  title: string;
  objectDetail: string;
  reporterDetail: string;
  timeDetail: string;
  description?: string;
  status: string;
  actions: TaskFeedAction[];
  rank: number;
  sortTime: number;
};

export const TODAY_TASK_CATEGORY_ORDER: TodayTaskCategory[] = [
  'emergency',
  'health',
  'supply',
  'approval',
];

const MEDICAL_HEALTH: AdminCat['health'][] = ['medical', 'monitoring', 'pending_exam'];

function timestampFromId(id: string) {
  const match = id.match(/(\d{13})/);
  return match ? Number(match[1]) : 0;
}

function parseDateMs(value: string) {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatTaskTime(value: string | number) {
  if (typeof value === 'number') {
    return value > 0 ? formatQueueAge(new Date(value).toISOString().slice(0, 10)) : 'Recently';
  }
  return formatQueueAge(value);
}

function healthRank(cat: AdminCat) {
  if (cat.health === 'medical') return 10;
  if (cat.health === 'pending_exam') return 11;
  return 12;
}

function healthStatusLabel(cat: AdminCat) {
  if (cat.health === 'medical') return 'Urgent';
  if (cat.health === 'pending_exam') return 'Attention';
  return 'Pending';
}

function healthTitle(cat: AdminCat) {
  if (cat.health === 'medical') return `${cat.name} needs medical care`;
  if (cat.health === 'pending_exam') return `${cat.name} awaiting veterinary exam`;
  return `${cat.name} under health monitoring`;
}

function healthReporter(cat: AdminCat) {
  const fosterParent = getActiveFosterParent(cat);
  if (fosterParent) return `Foster home · ${fosterParent}`;
  return 'Shelter care team';
}

function healthObjectDetail(cat: AdminCat) {
  const ongoing = cat.healthRecords.find((record) => record.status === 'ongoing');
  if (ongoing) return `Cat: ${cat.name} · ${ongoing.type}`;
  return `Cat: ${cat.name}`;
}

function healthTimeSource(cat: AdminCat) {
  const ongoing = cat.healthRecords.find((record) => record.status === 'ongoing');
  return ongoing?.date ?? cat.intakeDate;
}

function taskHref(task: TeamTask): string {
  if (task.applicationId) return `/admin/adoption/${task.applicationId}`;
  if (task.catId) return `/admin/cats/${task.catId}`;
  return `/admin/caregivers/${task.assigneeId}`;
}

function buildPendingTaskActions(task: TeamTask): TaskFeedAction[] {
  const actions: TaskFeedAction[] = [];

  if (isAdoptionReviewTeamTask(task) && task.applicationId) {
    actions.push({ label: 'View adoption', href: `/admin/adoption/${task.applicationId}` });
    actions.push({
      label: 'Message volunteer',
      href: `/admin/caregivers?message=${task.assigneeId}`,
    });
    if (task.catId) {
      actions.push({ label: 'View cat', href: `/admin/cats/${task.catId}` });
    }
    return actions;
  }

  if (isAdoptionPickupTeamTask(task) && task.applicationId) {
    actions.push({ label: 'View adoption', href: `/admin/adoption/${task.applicationId}` });
    actions.push({
      label: 'Message volunteer',
      href: `/admin/caregivers?message=${task.assigneeId}`,
    });
    if (task.catId) {
      actions.push({ label: 'View cat', href: `/admin/cats/${task.catId}` });
    }
    return actions;
  }

  if (isIncidentResponseTeamTask(task)) {
    if (task.catId) {
      actions.push({ label: 'View cat', href: `/admin/cats/${task.catId}` });
    }
    if (task.incidentReportId && task.catId) {
      actions.push({
        label: 'Review incident',
        href: `/admin/cats/${task.catId}?incident=${task.incidentReportId}`,
      });
    }
    return actions;
  }

  if (isSupplyRequestTeamTask(task)) {
    if (task.catId) {
      actions.push({
        label: isUnassignedSupplyRequest(task) ? 'Assign delivery' : 'View cat',
        href: isUnassignedSupplyRequest(task)
          ? `/admin/cats/${task.catId}?supplyTask=${task.id}`
          : `/admin/cats/${task.catId}`,
      });
    }
    if (!isUnassignedSupplyRequest(task)) {
      actions.push({
        label: 'Message volunteer',
        href: `/admin/caregivers?message=${task.assigneeId}`,
      });
    }
    if (task.supplyRequest?.requestedById) {
      actions.push({
        label: 'Message foster',
        href: `/admin/caregivers?message=${task.supplyRequest.requestedById}`,
      });
    }
    return actions;
  }

  if (task.type === 'pickup') {
    actions.push({
      label: 'Message volunteer',
      href: `/admin/caregivers?message=${task.assigneeId}`,
    });
    if (task.catId) {
      actions.push({ label: 'View cat', href: `/admin/cats/${task.catId}` });
    } else if (task.location) {
      actions.push({ label: 'View details', href: taskHref(task) });
    }
    actions.push({
      label: 'View caregiver',
      href: `/admin/caregivers/${task.assigneeId}`,
    });
    return actions;
  }

  if (task.catId) {
    actions.push({ label: 'View cat', href: `/admin/cats/${task.catId}` });
  }
  actions.push({
    label: task.workRole === 'foster_parent' ? 'Message foster' : 'Message caregiver',
    href: `/admin/caregivers?message=${task.assigneeId}`,
  });
  actions.push({
    label: 'View caregiver',
    href: `/admin/caregivers/${task.assigneeId}`,
  });
  return actions;
}

export function buildTodayTasksFeed(input: {
  applications: AdoptionApplication[];
  teamTasks: TeamTask[];
  cats?: AdminCat[];
}): TasksAndAlertsRow[] {
  const cats = input.cats ?? adminCats;
  const rows: TasksAndAlertsRow[] = [];

  for (const report of loadIncidentReports().filter((item) => item.status !== 'resolved')) {
    const sortTime = parseDateMs(report.createdAt);
    rows.push({
      id: `emergency-${report.id}`,
      category: 'emergency',
      categoryLabel: CATEGORY_LABELS.emergency,
      title: `Emergency — ${report.catName}`,
      objectDetail: `Cat: ${report.catName}`,
      reporterDetail: `Reported by ${report.reporterName}`,
      timeDetail: formatTaskTime(report.createdAt),
      description: report.description.trim() || 'Emergency reported from Paw Companion.',
      status: report.status === 'new' ? 'Urgent' : 'Attention',
      actions: [
        {
          label: 'Review incident',
          href: `/admin/cats/${report.catId}?incident=${report.id}`,
        },
        {
          label: 'View cat',
          href: `/admin/cats/${report.catId}`,
        },
      ],
      rank: report.status === 'new' ? 0 : 1,
      sortTime,
    });
  }

  for (const cat of cats.filter(
    (item) => item.adoptionPipeline !== 'adopted' && MEDICAL_HEALTH.includes(item.health),
  )) {
    const timeSource = healthTimeSource(cat);
    const ongoing = cat.healthRecords.find((record) => record.status === 'ongoing');
    rows.push({
      id: `health-${cat.id}`,
      category: 'health',
      categoryLabel: CATEGORY_LABELS.health,
      title: healthTitle(cat),
      objectDetail: healthObjectDetail(cat),
      reporterDetail: healthReporter(cat),
      timeDetail: formatTaskTime(timeSource),
      description:
        ongoing?.notes ||
        (cat.health === 'pending_exam'
          ? `Intake ${formatTaskTime(cat.intakeDate)} · ${cat.location}`
          : cat.adoptionStatus || cat.tagline),
      status: healthStatusLabel(cat),
      actions: [
        { label: 'View cat', href: `/admin/cats/${cat.id}` },
        { label: 'Assign care task', href: `/admin/cats/${cat.id}?careTask=1` },
      ],
      rank: healthRank(cat),
      sortTime: parseDateMs(timeSource),
    });
  }

  for (const task of input.teamTasks.filter(
    (item) => item.status === 'pending' && isSupplyRequestTeamTask(item),
  )) {
    const requestedBy = task.supplyRequest?.requestedByName ?? 'Foster caregiver';
    const items =
      task.supplyRequest?.items.map((item) => `${item.name} × ${item.quantity}`).join(', ') ??
      task.instructions;
    const sortTime = timestampFromId(task.id) || Date.now();
    const unassigned = isUnassignedSupplyRequest(task);

    rows.push({
      id: `supply-${task.id}`,
      category: 'supply',
      categoryLabel: CATEGORY_LABELS.supply,
      title: task.title,
      objectDetail: `Cat: ${task.catName}`,
      reporterDetail: `Requested by ${requestedBy}`,
      timeDetail: formatTaskTime(sortTime),
      description: [items, task.supplyRequest?.notes, task.notes].filter(Boolean).join(' · '),
      status: unassigned ? 'Urgent' : 'Pending',
      actions: buildPendingTaskActions(task),
      rank: unassigned ? 20 : 21,
      sortTime,
    });
  }

  for (const app of input.applications.filter((item) => item.stage === 'new' || item.stage === 'reviewing')) {
    const sortTime = parseDateMs(app.submittedDate);
    rows.push({
      id: `approval-adoption-${app.id}`,
      category: 'approval',
      categoryLabel: CATEGORY_LABELS.approval,
      title: `Adoption approval — ${app.applicantName}`,
      objectDetail: `Applicant: ${app.applicantName} · Cat: ${app.catName}`,
      reporterDetail: 'Submitted by applicant',
      timeDetail: formatTaskTime(app.submittedDate),
      description: [app.notes, app.catExperience, app.visitAvailability]
        .filter(Boolean)
        .join(' · '),
      status: app.stage === 'new' ? 'Urgent' : 'Pending',
      actions: [
        { label: 'Review application', href: `/admin/adoption/${app.id}` },
        { label: 'View cat', href: `/admin/cats/${app.catId}` },
      ],
      rank: app.stage === 'new' ? 30 : 32,
      sortTime,
    });
  }

  for (const application of getPendingFosterApplications()) {
    const sortTime = parseDateMs(application.submittedAt);
    rows.push({
      id: `approval-foster-${application.id}`,
      category: 'approval',
      categoryLabel: CATEGORY_LABELS.approval,
      title: `Foster application — ${application.caregiverName}`,
      objectDetail: `Caregiver: ${application.caregiverName} · ${application.householdType} home`,
      reporterDetail: 'Submitted by caregiver',
      timeDetail: formatTaskTime(application.submittedAt),
      description: [
        application.experience,
        application.availability,
        application.hasOtherPets ? 'Has other pets' : 'No other pets',
        application.notes,
      ]
        .filter(Boolean)
        .join(' · '),
      status: application.status === 'submitted' ? 'Urgent' : 'Pending',
      actions: [
        {
          label: 'Review application',
          href: `/admin/caregivers/${application.caregiverId}`,
        },
      ],
      rank: application.status === 'submitted' ? 31 : 33,
      sortTime,
    });
  }

  return rows.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.sortTime - b.sortTime;
  });
}

/** @deprecated Use buildTodayTasksFeed for Overview Today's tasks */
export function buildTasksAndAlertsFeed(
  tasks: TeamTask[],
  _alerts: unknown[],
  _recentActivity: unknown[],
): TasksAndAlertsRow[] {
  return buildTodayTasksFeed({
    applications: [],
    teamTasks: tasks,
  });
}

export const CARE_TASK_TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: 'feeding', label: 'Feeding' },
  { value: 'medication', label: 'Medication' },
  { value: 'behavior', label: 'Behavior check' },
  { value: 'socialization', label: 'Socialization' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'checkup', label: 'Check-up' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'supply', label: 'Supply delivery' },
];

export function defaultCareTaskTitle(type: TaskType, catName?: string): string {
  const label = CARE_TASK_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? 'Task';
  return catName ? `${label} — ${catName}` : label;
}

export function volunteerFieldWorkHeadline(app: AdoptionApplication): string {
  const summary = getVolunteerFieldWorkSummary(app);
  if (!summary) return 'No volunteer assigned yet.';

  if (app.stage === 'approved') {
    return summary.taskTitle
      ? `${summary.assigneeName} is coordinating pickup handoff.`
      : `${summary.assigneeName} will handle approved adoption pickup.`;
  }

  const step = getReviewSubstageLabel(normalizeReviewSubstage(app) ?? 'contact');
  if (summary.waitingSummary) return summary.waitingSummary;
  if (summary.scheduleLabel) {
    return `${summary.assigneeName} · ${step}: ${summary.scheduleLabel}`;
  }
  if (summary.taskTitle) {
    return `${summary.assigneeName} is working on ${summary.taskTitle.toLowerCase()}.`;
  }
  return `${summary.assigneeName} is handling the ${step.toLowerCase()} step.`;
}
