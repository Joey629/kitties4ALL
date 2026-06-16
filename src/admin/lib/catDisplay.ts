import type { AdminCat, AdoptionPipelineStatus, CatPlacement, CatSex, HealthStatus } from '@/admin/types';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'secondary';

export const ADOPTION_PIPELINE_OPTIONS: { value: AdoptionPipelineStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'pending', label: 'In progress' },
  { value: 'unavailable', label: 'Unavailable' },
  { value: 'adopted', label: 'Adopted' },
];

export const HEALTH_OPTIONS: { value: HealthStatus; label: string }[] = [
  { value: 'healthy', label: 'Healthy' },
  { value: 'pending_exam', label: 'Pending exam' },
  { value: 'medical', label: 'Medical' },
  { value: 'monitoring', label: 'Monitoring' },
];

/** @deprecated Use ADOPTION_PIPELINE_OPTIONS with multi-select filters */
export const ADOPTION_PIPELINE_FILTERS: { value: AdoptionPipelineStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  ...ADOPTION_PIPELINE_OPTIONS,
];

/** @deprecated Use HEALTH_OPTIONS with multi-select filters */
export const HEALTH_FILTERS: { value: HealthStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  ...HEALTH_OPTIONS,
];

export const adoptionPipelineConfig: Record<
  AdoptionPipelineStatus,
  { label: string; variant: BadgeVariant }
> = {
  available: { label: 'Available', variant: 'success' },
  pending: { label: 'In progress', variant: 'default' },
  adopted: { label: 'Adopted', variant: 'secondary' },
  unavailable: { label: 'Unavailable', variant: 'warning' },
};

export const healthConfig: Record<HealthStatus, { label: string; variant: BadgeVariant }> = {
  healthy: { label: 'Healthy', variant: 'success' },
  pending_exam: { label: 'Pending exam', variant: 'warning' },
  medical: { label: 'Medical', variant: 'danger' },
  monitoring: { label: 'Monitoring', variant: 'warning' },
};

/** Only healthy cats can be listed as available for adoption. */
export function isHealthyForAdoption(health: HealthStatus): boolean {
  return health === 'healthy';
}

/** Adoption pipeline with health gate — non-healthy cats are never shown as available. */
export function getEffectiveAdoptionPipeline(cat: AdminCat): AdoptionPipelineStatus {
  if (cat.adoptionPipeline === 'available' && !isHealthyForAdoption(cat.health)) {
    return 'unavailable';
  }
  return cat.adoptionPipeline;
}

export function isCatAvailableForAdoption(cat: AdminCat): boolean {
  return getEffectiveAdoptionPipeline(cat) === 'available';
}

export function getAdoptionPipelineDisplay(cat: AdminCat) {
  return adoptionPipelineConfig[getEffectiveAdoptionPipeline(cat)];
}

export const placementConfig: Record<CatPlacement, { label: string }> = {
  shelter: { label: 'Shelter' },
  foster: { label: 'Foster' },
};

const sexLabels: Record<CatSex, string> = {
  male: 'Male',
  female: 'Female',
  unknown: 'Unknown',
};

export function getSexLabel(sex: CatSex): string {
  return sexLabels[sex];
}

export function getActiveFosterParent(cat: AdminCat): string | undefined {
  if (cat.placement !== 'foster') return undefined;
  return cat.fosterHistory.find((record) => record.status === 'active')?.fosterParent;
}

export function getPlacementLabel(cat: AdminCat): string {
  if (cat.placement === 'foster') {
    const fosterParent = getActiveFosterParent(cat);
    return fosterParent ? `${placementConfig.foster.label} · ${fosterParent}` : placementConfig.foster.label;
  }
  return placementConfig.shelter.label;
}
