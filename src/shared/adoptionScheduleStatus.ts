import type { AdoptionContactSchedule } from '@/shared/adoptionContactSchedule';
import { formatContactScheduleTime } from '@/shared/adoptionContactSchedule';

export function getContactScheduleStatusLabel(schedule: AdoptionContactSchedule | null): string {
  if (!schedule) {
    return 'No time proposed yet';
  }

  const time = formatContactScheduleTime(schedule.scheduledAt);

  switch (schedule.status) {
    case 'pending_adopter':
      return `Proposed ${time} — waiting for applicant`;
    case 'accepted':
      return `Confirmed for ${time}`;
    case 'declined':
      return `Applicant declined ${time}`;
    case 'counter_proposed':
      return `Applicant proposed ${time} — volunteer to confirm`;
    default:
      return time;
  }
}

export function getContactScheduleStatusTone(
  schedule: AdoptionContactSchedule | null,
): 'neutral' | 'waiting' | 'success' | 'warning' {
  if (!schedule) return 'neutral';
  if (schedule.status === 'accepted') return 'success';
  if (schedule.status === 'declined') return 'warning';
  return 'waiting';
}
