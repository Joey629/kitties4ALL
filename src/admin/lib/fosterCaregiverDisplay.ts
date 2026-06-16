import { adminCats, getCatById } from '@/admin/data/mock';
import { getCaregiverById } from '@/shared/caregivers';
import {
  formatUpdateSummary,
  getCatCareUpdatesForCat,
  type CatCareUpdateRecord,
} from '@/shared/catCareUpdates';
import { getFosterApplicationForCaregiver } from '@/shared/fosterWorkflow';
import { getFosterAssignedCatIds } from '@/shared/fosterWorkflow';
import type { ActivityType, AdminCat, Caregiver } from '@/admin/types';

export type FosterLogCategory = 'medical' | 'daily' | 'adoption';

export interface FosterLogEntry {
  id: string;
  date: string;
  category: FosterLogCategory;
  title: string;
  description: string;
  photoUrl?: string | null;
}

function mapActivityType(type: ActivityType): FosterLogCategory {
  if (type === 'medical') return 'medical';
  if (type === 'adoption' || type === 'foster') return 'adoption';
  return 'daily';
}

function sortByDateDesc<T extends { date: string }>(entries: T[]) {
  return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getFosterAssignedCats(caregiverId: string): AdminCat[] {
  const caregiver = getCaregiverById(caregiverId);
  if (!caregiver) return [];

  const catIds = new Set<string>([
    ...caregiver.assignedCatIds,
    ...getFosterAssignedCatIds(caregiverId),
  ]);

  for (const cat of adminCats) {
    const activeRecord = cat.fosterHistory.find((record) => record.status === 'active');
    if (activeRecord?.fosterParent === caregiver.name) {
      catIds.add(cat.id);
    }
  }

  return [...catIds]
    .map((catId) => getCatById(catId))
    .filter((cat): cat is AdminCat => Boolean(cat));
}

export function getFosterExperienceText(caregiver: Caregiver): string {
  const application = getFosterApplicationForCaregiver(caregiver.id);
  if (application?.experience?.trim()) {
    return application.experience.trim();
  }
  if (caregiver.skills.length > 0) {
    return caregiver.skills.join(' · ');
  }
  return 'No experience notes on file yet.';
}

export function getFosterDailyUpdatesForCat(
  catId: string,
  caregiver: Caregiver,
): CatCareUpdateRecord[] {
  return getCatCareUpdatesForCat(catId).filter(
    (update) =>
      update.reporterId === caregiver.id ||
      update.reporterName.trim().toLowerCase() === caregiver.name.trim().toLowerCase(),
  );
}

export function buildFosterCatTimelineEntries(cat: AdminCat, caregiver: Caregiver): FosterLogEntry[] {
  const fosterUpdates = getFosterDailyUpdatesForCat(cat.id, caregiver);

  return sortByDateDesc([
    ...cat.timeline.map((event) => ({
      id: `tl-${event.id}`,
      date: event.date,
      category: mapActivityType(event.type),
      title: event.title,
      description: event.description,
    })),
    ...fosterUpdates.map((update) => ({
      id: update.id,
      date: update.createdAt.slice(0, 10),
      category: 'daily' as const,
      title: `Update from ${update.reporterName}`,
      description: formatUpdateSummary(update),
      photoUrl: update.photo,
    })),
  ]);
}

export function buildFosterDailyUpdateEntries(cat: AdminCat, caregiver: Caregiver): FosterLogEntry[] {
  return sortByDateDesc(
    getFosterDailyUpdatesForCat(cat.id, caregiver).map((update) => ({
      id: `daily-${update.id}`,
      date: update.createdAt.slice(0, 10),
      category: 'daily' as const,
      title: `Daily update`,
      description: formatUpdateSummary(update),
      photoUrl: update.photo,
    })),
  );
}

export function fosterCatSummary(cat: AdminCat, caregiver: Caregiver): string {
  const activeRecord = cat.fosterHistory.find((record) => record.status === 'active');
  if (activeRecord?.notes) return activeRecord.notes;
  if (cat.story) return cat.story;
  return `In foster care with ${caregiver.name}.`;
}
