import { getCatImageUrl } from '@/shared/catImages';
import type { CareTask, CompanionCat } from '../types';

export const PICKUP_PHOTO_COUNT = 3;

export function isPickupTask(task: CareTask) {
  return task.type === 'pickup';
}

export function getPickupReferencePhoto(task: CareTask, cat: CompanionCat | null) {
  if (task.referencePhotoUrl) return task.referencePhotoUrl;
  if (!cat) return null;

  const rosterImage = getCatImageUrl(cat.id);
  if (rosterImage) return rosterImage;

  if (
    cat.photo.startsWith('blob:') ||
    cat.photo.startsWith('data:') ||
    cat.photo.startsWith('http') ||
    cat.photo.startsWith('/')
  ) {
    return cat.photo;
  }

  return null;
}

export function hasRequiredPickupPhotos(task: CareTask) {
  return (task.submissionPhotos?.length ?? 0) >= PICKUP_PHOTO_COUNT;
}
