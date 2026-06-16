import { getCatById } from '@/admin/data/mock';
import { getCaregiverById } from '@/shared/caregivers';
import type { Caregiver, CaregiverRole } from '@/admin/types';
import { loadTeamTasks } from '@/shared/teamTasks';

export const WEEKDAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const ROLE_LABELS: Record<CaregiverRole, string> = {
  volunteer: 'Volunteer',
  foster_parent: 'Foster parent',
  staff: 'Staff',
};

export function getCaregiverRoleLabel(role: CaregiverRole): string {
  return ROLE_LABELS[role];
}

export function getCaregiverAssignments(caregiverId: string): string[] {
  const caregiver = getCaregiverById(caregiverId);
  if (!caregiver) return [];

  const items: string[] = [];

  for (const catId of caregiver.assignedCatIds) {
    const cat = getCatById(catId);
    if (cat) {
      items.push(`Daily care for ${cat.name}`);
    }
  }

  const pendingTasks = loadTeamTasks().filter(
    (task) => task.assigneeId === caregiverId && task.status === 'pending',
  );
  for (const task of pendingTasks) {
    if (!items.includes(task.title)) {
      items.push(task.title);
    }
  }

  return items;
}

export function getCaregiverSubtitle(caregiver: Caregiver): string {
  return `${getCaregiverRoleLabel(caregiver.role)} · ${caregiver.availability}`;
}
