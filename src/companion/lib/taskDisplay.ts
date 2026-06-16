import type { CareTask } from '../types';

export function isAdoptionReviewTask(task: CareTask) {
  return (
    (task.type === 'checkup' && Boolean(task.applicationId)) ||
    task.title.startsWith('Adoption review')
  );
}

export function isAdoptionPickupTask(task: CareTask) {
  return task.type === 'pickup' && Boolean(task.applicationId) && task.title.startsWith('Adoption pickup');
}

export function isAdoptionTask(task: CareTask) {
  return isAdoptionReviewTask(task) || isAdoptionPickupTask(task);
}

export function isSupplyDeliveryTask(task: CareTask) {
  return task.type === 'supply' && Boolean(task.supplyRequest);
}

export function isFosterCheckInTask(task: CareTask) {
  return task.title === 'Foster weekly check-in';
}

export function isRegisteredPickupTask(task: CareTask) {
  return task.type === 'pickup' && Boolean(task.catId) && !isAdoptionPickupTask(task);
}

export function getTaskHeadline(task: CareTask) {
  if (isSupplyDeliveryTask(task)) {
    return `Deliver supplies — ${task.catName}`;
  }
  if (isAdoptionReviewTask(task)) {
    return `Adoption review for ${task.catName}`;
  }
  if (isAdoptionTask(task)) {
    return task.title;
  }
  return task.catName;
}

export function getTaskSubline(task: CareTask) {
  if (isSupplyDeliveryTask(task)) {
    const count = task.supplyRequest?.items.length ?? 0;
    return `${count} item${count === 1 ? '' : 's'} · ${task.supplyRequest?.requestedByName ?? 'Foster home'}`;
  }
  if (isAdoptionReviewTask(task)) {
    const applicant = task.adoptionApplicant?.name ?? 'Applicant';
    const substage = task.adoptionApplicant?.reviewSubstage;
    return substage ? `${substage} · ${applicant}` : applicant;
  }
  if (isAdoptionPickupTask(task)) {
    return `Pickup · ${task.catName}`;
  }
  if (isRegisteredPickupTask(task)) {
    return task.location ? `Registered · ${task.location}` : 'Registered';
  }
  return task.title;
}

export function getTaskDetailTitle(task: CareTask) {
  if (isAdoptionReviewTask(task)) {
    return `Adoption review for ${task.catName}`;
  }
  if (isAdoptionTask(task)) {
    return task.title;
  }
  if (isRegisteredPickupTask(task)) {
    return task.catName;
  }
  return task.catName;
}

export function getTaskDetailSubtitle(task: CareTask) {
  if (isAdoptionReviewTask(task)) {
    return task.adoptionApplicant?.name ?? 'Applicant';
  }
  if (isAdoptionPickupTask(task)) {
    return 'Approved adoption';
  }
  if (isRegisteredPickupTask(task)) {
    return task.location ? `Pickup registered · ${task.location}` : 'Pickup registered';
  }
  return task.title;
}
