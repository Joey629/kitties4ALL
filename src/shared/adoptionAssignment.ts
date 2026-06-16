import { caregivers } from '@/admin/data/mock';
import type { AdoptionApplication, CaregiverRole } from '@/admin/types';
import type { WorkRole } from '@/companion/types';
import { formatApplicationRef } from '@/shared/adoptionReference';
import {
  advanceApplicationWorkflow,
  assignInterviewer,
  loadAdoptionApplications,
  moveApplicationStage,
  rejectAdoptionApplication,
  unassignInterviewer,
} from '@/shared/adoptionApplications';
import { getReviewSubstageLabel, normalizeReviewSubstage } from '@/shared/adoptionWorkflow';
import {
  adoptionPickupTaskId,
  isAdoptionPickupTeamTask,
  isAdoptionReviewTeamTask,
  loadTeamTasks,
  removePendingAdoptionPickupTasksForApplication,
  removePendingAdoptionReviewTasksForApplication,
  saveTeamTasks,
  upsertAdoptionPickupTask,
  upsertAdoptionReviewTask,
} from '@/shared/teamTasks';

function workRoleForCaregiver(role: CaregiverRole): WorkRole {
  return role === 'foster_parent' ? 'foster_parent' : 'volunteer';
}

function getCaregiverRole(caregiverId: string): CaregiverRole {
  return caregivers.find((caregiver) => caregiver.id === caregiverId)?.role ?? 'volunteer';
}

export function syncAdoptionReviewTaskForApplication(app: AdoptionApplication) {
  if (!app.interviewerId || app.stage !== 'reviewing') {
    removePendingAdoptionReviewTasksForApplication(app.id);
    return null;
  }

  const reviewSubstage = getReviewSubstageLabel(normalizeReviewSubstage(app));

  return upsertAdoptionReviewTask({
    applicationId: app.id,
    catId: app.catId,
    catName: app.catName,
    applicantName: app.applicantName,
    applicantEmail: app.email,
    applicantPhone: app.phone,
    visitAvailability: app.visitAvailability,
    catExperience: app.catExperience,
    housingType: app.housingType,
    assigneeId: app.interviewerId,
    workRole: workRoleForCaregiver(getCaregiverRole(app.interviewerId)),
    reviewSubstage,
    notes: `Adoption ${formatApplicationRef(app.id)}`,
  });
}

export function syncAdoptionTasksForApplication(app: AdoptionApplication) {
  if (app.stage === 'new' || !app.interviewerId) {
    removePendingAdoptionReviewTasksForApplication(app.id);
    removePendingAdoptionPickupTasksForApplication(app.id);
    return null;
  }

  if (app.stage === 'rejected') {
    removePendingAdoptionReviewTasksForApplication(app.id);
    removePendingAdoptionPickupTasksForApplication(app.id);
    return null;
  }

  if (app.stage === 'approved') {
    removePendingAdoptionReviewTasksForApplication(app.id);
    if (!app.interviewerId) {
      removePendingAdoptionPickupTasksForApplication(app.id);
      return null;
    }
    return upsertAdoptionPickupTask({
      applicationId: app.id,
      catId: app.catId,
      catName: app.catName,
      applicantName: app.applicantName,
      applicantEmail: app.email,
      applicantPhone: app.phone,
      assigneeId: app.interviewerId,
      workRole: workRoleForCaregiver(getCaregiverRole(app.interviewerId)),
      dueTime: app.visitAvailability?.trim() || undefined,
    });
  }

  if (app.stage === 'reviewing') {
    removePendingAdoptionPickupTasksForApplication(app.id);
    return syncAdoptionReviewTaskForApplication(app);
  }

  return null;
}

function isPendingAdoptionPickupTask(task: ReturnType<typeof loadTeamTasks>[number]) {
  return task.status === 'pending' && isAdoptionPickupTeamTask(task);
}

function pruneAdoptionPickupTasks(
  tasks: ReturnType<typeof loadTeamTasks>,
  appById: Map<string, ReturnType<typeof loadAdoptionApplications>[number]>,
) {
  const keepIdByApp = new Map<string, string>();

  for (const task of tasks) {
    if (!isPendingAdoptionPickupTask(task) || !task.applicationId) {
      continue;
    }

    const app = appById.get(task.applicationId);
    if (!app || app.stage !== 'approved' || !app.interviewerId) {
      continue;
    }

    if (app.interviewerId !== task.assigneeId) {
      continue;
    }

    const stableId = adoptionPickupTaskId(task.applicationId);
    const currentKeepId = keepIdByApp.get(task.applicationId);
    if (task.id === stableId || !currentKeepId) {
      keepIdByApp.set(task.applicationId, task.id === stableId ? stableId : task.id);
    }
  }

  return tasks.filter((task) => {
    if (!isPendingAdoptionPickupTask(task)) {
      return true;
    }

    if (!task.applicationId) {
      return false;
    }

    const app = appById.get(task.applicationId);
    if (!app || app.stage !== 'approved' || !app.interviewerId) {
      return false;
    }

    if (app.interviewerId !== task.assigneeId) {
      return false;
    }

    return keepIdByApp.get(task.applicationId) === task.id;
  });
}

export function reconcileAllAdoptionTeamTasks() {
  const apps = loadAdoptionApplications();

  for (const app of apps) {
    syncAdoptionTasksForApplication(app);
  }

  const appById = new Map(apps.map((app) => [app.id, app]));
  const tasks = loadTeamTasks();
  const filtered = tasks.filter((task) => {
    if (task.status !== 'pending') {
      return true;
    }

    if (isAdoptionReviewTeamTask(task)) {
      if (!task.applicationId) {
        return false;
      }

      const app = appById.get(task.applicationId);
      if (!app || app.stage !== 'reviewing' || !app.interviewerId) {
        return false;
      }

      return app.interviewerId === task.assigneeId;
    }

    if (isPendingAdoptionPickupTask(task)) {
      if (!task.applicationId) {
        return false;
      }

      const app = appById.get(task.applicationId);
      if (!app || app.stage !== 'approved' || !app.interviewerId) {
        return false;
      }

      return app.interviewerId === task.assigneeId;
    }

    return true;
  });

  const next = pruneAdoptionPickupTasks(filtered, appById);

  if (JSON.stringify(next) !== JSON.stringify(tasks)) {
    saveTeamTasks(next);
  }
}

export function assignAdoptionReviewerWithTask(
  appId: string,
  caregiver: { id: string; name: string },
  options?: { moveToReviewing?: boolean },
  sourceApps?: AdoptionApplication[],
) {
  const updated = assignInterviewer(appId, caregiver, options, sourceApps);
  if (!updated) return null;

  syncAdoptionTasksForApplication(updated);

  return updated;
}

export function unassignAdoptionReviewerWithTask(appId: string) {
  const updated = unassignInterviewer(appId);
  if (!updated) return null;

  syncAdoptionTasksForApplication(updated);

  return updated;
}

export function moveAdoptionStageWithTask(
  appId: string,
  stage: AdoptionApplication['stage'],
) {
  const updated = moveApplicationStage(appId, stage);
  if (!updated) return null;

  syncAdoptionTasksForApplication(updated);

  return updated;
}

export function advanceAdoptionWorkflowWithTask(appId: string) {
  const updated = advanceApplicationWorkflow(appId);
  if (!updated) return null;

  syncAdoptionTasksForApplication(updated);

  return updated;
}

export function rejectAdoptionWithTask(appId: string, reason: string) {
  const updated = rejectAdoptionApplication(appId, reason);
  if (!updated) return null;

  syncAdoptionTasksForApplication(updated);

  return updated;
}
