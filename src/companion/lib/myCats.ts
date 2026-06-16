import { getMyCatsForRole, WORK_ENVIRONMENTS } from '../data/mock';
import type { CareTask, CompanionCat, WorkRole } from '../types';
import { getFosterAssignedCatIds } from '@/shared/fosterWorkflow';

export function resolveCompanionMyCats(input: {
  workRole: WorkRole;
  userId: string;
  cats: CompanionCat[];
  registeredCatIds: string[];
  removedCatIds: string[];
}): CompanionCat[] {
  const assignedCatIds = getFosterAssignedCatIds(input.userId);
  const baseIds = new Set([
    ...getMyCatsForRole(input.workRole).map((cat) => cat.id),
    ...input.registeredCatIds,
    ...assignedCatIds,
  ]);
  return input.cats.filter((cat) => baseIds.has(cat.id) && !input.removedCatIds.includes(cat.id));
}

export function fosterHasActiveCat(input: {
  workRole: WorkRole;
  userId: string;
  myCats: CompanionCat[];
  tasks: CareTask[];
}): boolean {
  if (input.myCats.length > 0) return true;
  if (input.workRole !== 'foster_parent') return false;

  const fosterAssigneeId = WORK_ENVIRONMENTS.foster_parent.assigneeId;
  return input.tasks.some(
    (task) =>
      Boolean(task.catId) &&
      task.status !== 'completed' &&
      (task.assigneeId === fosterAssigneeId || task.assigneeId === input.userId),
  );
}
