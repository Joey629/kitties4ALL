import { caregivers as seedCaregivers } from '@/admin/data/mock';
import type { Caregiver, CaregiverRole } from '@/admin/types';

const STORAGE_KEY = 'kitticare-caregivers';

type Listener = (caregivers: Caregiver[]) => void;
const listeners = new Set<Listener>();

let caregiversCache: Caregiver[] | null = null;

function notify(caregivers: Caregiver[]) {
  listeners.forEach((listener) => listener(caregivers));
}

function persistCaregivers(caregivers: Caregiver[], options?: { notifyListeners?: boolean }) {
  caregiversCache = caregivers;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(caregivers));
  if (options?.notifyListeners === false) return;
  notify(caregivers);
}

function migrateCaregivers(stored: Caregiver[]): Caregiver[] {
  const storedIds = new Set(stored.map((caregiver) => caregiver.id));
  const missingSeed = seedCaregivers.filter((seed) => !storedIds.has(seed.id));
  return [...stored, ...missingSeed];
}

export function loadCaregivers(): Caregiver[] {
  if (caregiversCache) return caregiversCache;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      persistCaregivers(seedCaregivers, { notifyListeners: false });
      return seedCaregivers;
    }
    const parsed = JSON.parse(raw) as Caregiver[];
    const migrated = migrateCaregivers(parsed);
    if (JSON.stringify(parsed) !== JSON.stringify(migrated)) {
      persistCaregivers(migrated, { notifyListeners: false });
      return migrated;
    }
    caregiversCache = migrated;
    return migrated;
  } catch {
    persistCaregivers(seedCaregivers, { notifyListeners: false });
    return seedCaregivers;
  }
}

export function subscribeCaregivers(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCaregiverById(id: string): Caregiver | undefined {
  return loadCaregivers().find((caregiver) => caregiver.id === id);
}

export function getCaregiverByName(name: string): Caregiver | undefined {
  const normalized = name.trim().toLowerCase();
  return loadCaregivers().find((caregiver) => caregiver.name.trim().toLowerCase() === normalized);
}

export function getAssignableCaregivers(): Caregiver[] {
  return loadCaregivers().filter(
    (caregiver) => caregiver.role === 'volunteer' || caregiver.role === 'foster_parent',
  );
}

export function caregiverAvatar(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CG';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export interface AddCaregiverInput {
  name: string;
  email: string;
  phone: string;
  role: Exclude<CaregiverRole, 'staff'>;
  availabilityDays: string[];
  skills: string[];
  availability: string;
}

export function addCaregiver(input: AddCaregiverInput): Caregiver {
  const caregiver: Caregiver = {
    id: `cg-${Date.now()}`,
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    role: input.role,
    availability:
      input.availability.trim() ||
      (input.availabilityDays.length > 0
        ? `${input.availabilityDays.join(', ')} shifts`
        : 'Availability to be confirmed'),
    availabilityDays: input.availabilityDays,
    skills: input.skills,
    assignedCatIds: [],
    joinedDate: new Date().toISOString().slice(0, 10),
    activityCount: 0,
    avatar: caregiverAvatar(input.name),
  };

  persistCaregivers([caregiver, ...loadCaregivers()]);
  return caregiver;
}
