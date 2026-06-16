import { loadAdoptionApplications } from '@/shared/adoptionApplications';

function hashApplicationId(applicationId: string): number {
  let hash = 2166136261;
  for (let index = 0; index < applicationId.length; index += 1) {
    hash ^= applicationId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Stable 1–9999 number derived from an application id. */
export function adoptionReferenceNumber(applicationId: string): number {
  const match = applicationId.match(/^app-(\d+)$/i);
  if (match) {
    const raw = match[1];
    const num = Number.parseInt(raw, 10);
    if (raw.length <= 4 && num >= 1) return num;
    const lastFour = num % 10000;
    return lastFour === 0 ? 1 : lastFour;
  }
  return (hashApplicationId(applicationId.toLowerCase()) % 9999) + 1;
}

/** Human-readable adoption reference shown in admin UI (e.g. `AD-0001`). */
export function formatApplicationRef(applicationId: string): string {
  return `AD-${String(adoptionReferenceNumber(applicationId)).padStart(4, '0')}`;
}

/** @deprecated Use formatApplicationRef */
export function adoptionReferenceCode(applicationId: string): string {
  return formatApplicationRef(applicationId);
}

export function normalizeApplicationRefInput(ref: string): string {
  const trimmed = ref.trim().toUpperCase();
  const adMatch = trimmed.match(/^AD-?(\d{1,4})$/);
  if (adMatch) return adMatch[1].padStart(4, '0');
  return trimmed.replace(/^(?:ADOPT|APP)-?/, '');
}

export function findApplicationIdByRef(ref: string): string | null {
  const trimmed = ref.trim().toUpperCase();

  const adMatch = trimmed.match(/^AD-?(\d{1,4})$/);
  if (adMatch) {
    const num = Number.parseInt(adMatch[1], 10);
    return (
      loadAdoptionApplications().find((app) => adoptionReferenceNumber(app.id) === num)?.id ??
      null
    );
  }

  const legacy = ref.trim().match(/^(?:ADOPT|APP)-(\d+)$/i);
  if (legacy) return `app-${legacy[1]}`;

  return null;
}
