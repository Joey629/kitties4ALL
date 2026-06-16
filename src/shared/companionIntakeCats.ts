import type { AdminCat } from '@/admin/types';

const STORAGE_KEY = 'kitticare-companion-intake-cats';

export interface CompanionIntakeRecord {
  id: string;
  name: string;
  photo: string;
  healthStatus: string;
  story: string;
  intakeDate: string;
  source: string;
  registeredById: string;
  registeredByName: string;
  breed?: string;
  age?: string;
}

type Listener = (records: CompanionIntakeRecord[]) => void;
const listeners = new Set<Listener>();

function notify(records: CompanionIntakeRecord[]) {
  listeners.forEach((listener) => listener(records));
}

export function loadCompanionIntakeCats(): CompanionIntakeRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CompanionIntakeRecord[];
  } catch {
    return [];
  }
}

export function registerCompanionIntakeCat(input: Omit<CompanionIntakeRecord, 'intakeDate'>) {
  const record: CompanionIntakeRecord = {
    ...input,
    intakeDate: new Date().toISOString().slice(0, 10),
  };
  const next = [record, ...loadCompanionIntakeCats()];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  notify(next);
  return record;
}

export function subscribeCompanionIntakeCats(listener: Listener) {
  listener(loadCompanionIntakeCats());
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function intakeHealthStatus(record: CompanionIntakeRecord): AdminCat['health'] {
  const status = record.healthStatus.toLowerCase();
  if (status.includes('injury') || status.includes('emaciated')) return 'medical';
  if (status.includes('pregnant')) return 'monitoring';
  return 'pending_exam';
}

export function intakeRecordToAdminCat(record: CompanionIntakeRecord): AdminCat {
  const registeredVia = record.registeredById === 'admin' ? 'Admin console' : 'Paw Companion';
  return {
    id: record.id,
    name: record.name,
    age: record.age?.trim() || 'Unknown',
    breed: record.breed?.trim() || 'Unknown',
    sex: 'unknown',
    photo: record.photo,
    adoptionPipeline: 'unavailable',
    placement: 'shelter',
    location: 'Intake Holding',
    health: intakeHealthStatus(record),
    personality: [],
    story: record.story,
    tagline: 'Recently registered in the field.',
    caregiverId: record.registeredById,
    intakeDate: record.intakeDate,
    adoptionStatus: 'Awaiting exam',
    timeline: [
      {
        id: `tl-intake-${record.id}`,
        date: record.intakeDate,
        type: 'intake',
        title: 'Field intake registered',
        description: `Registered by ${record.registeredByName} via ${registeredVia}.`,
      },
    ],
    healthRecords: [],
    careHistory: [],
    fosterHistory: [],
  };
}
