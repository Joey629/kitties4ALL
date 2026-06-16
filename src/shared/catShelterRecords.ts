import { adminCats } from '@/admin/data/mock';
import type { ActivityType, HealthStatus, TimelineEvent } from '@/admin/types';

export interface CatShelterProfile {
  intakeDate: string;
  location: string;
  health: HealthStatus;
  adoptionStatus: string;
  timeline: TimelineEvent[];
}

const HEALTH_LABELS: Record<HealthStatus, string> = {
  healthy: 'Healthy',
  pending_exam: 'Pending exam',
  medical: 'Under medical care',
  monitoring: 'Being monitored',
};

const EVENT_LABELS: Record<ActivityType, string> = {
  intake: 'Intake',
  medical: 'Medical',
  foster: 'Foster',
  adoption: 'Adoption',
  donation: 'Donation',
  care: 'Daily care',
  note: 'Note',
};

const EVENT_DOT: Record<ActivityType, string> = {
  intake: 'bg-sky',
  medical: 'bg-coral',
  foster: 'bg-lavender',
  adoption: 'bg-soft-orange',
  donation: 'bg-warm-brown',
  care: 'bg-sage-dark',
  note: 'bg-warm-brown/50',
};

export function getCatShelterProfile(catId: string): CatShelterProfile | null {
  const record = adminCats.find((cat) => cat.id === catId);
  if (!record) return null;
  return {
    intakeDate: record.intakeDate,
    location: record.location,
    health: record.health,
    adoptionStatus: record.adoptionStatus,
    timeline: [...record.timeline].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    ),
  };
}

export function formatHealthStatus(health: HealthStatus) {
  return HEALTH_LABELS[health];
}

export function formatEventType(type: ActivityType) {
  return EVENT_LABELS[type];
}

export function eventDotClass(type: ActivityType) {
  return EVENT_DOT[type];
}

export function daysInShelter(intakeDate: string) {
  const diff = Math.floor((Date.now() - new Date(intakeDate).getTime()) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return '1 day';
  return `${diff} days`;
}
