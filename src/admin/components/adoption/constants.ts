import type { AdoptionStage } from '@/admin/types';
import { formatApplicationRef } from '@/shared/adoptionReference';
import { getAssignableCaregivers } from '@/shared/caregivers';
import type { CaregiverRole } from '@/admin/types';

export const ADOPTION_STAGES: {
  key: AdoptionStage;
  label: string;
  shortLabel: string;
  headerBg: string;
  cardBg: string;
  cardBorder: string;
  cardBorderSelected: string;
  dot: string;
}[] = [
  {
    key: 'new',
    label: 'New adoption',
    shortLabel: 'New',
    headerBg: 'bg-sky/15',
    cardBg: 'bg-sky/8',
    cardBorder: 'border-sky/20',
    cardBorderSelected: 'border-sky/45 ring-sky/15',
    dot: 'bg-sky',
  },
  {
    key: 'reviewing',
    label: 'Reviewing',
    shortLabel: 'Review',
    headerBg: 'bg-soft-orange/15',
    cardBg: 'bg-soft-orange/8',
    cardBorder: 'border-soft-orange/20',
    cardBorderSelected: 'border-soft-orange/45 ring-soft-orange/15',
    dot: 'bg-soft-orange',
  },
  {
    key: 'approved',
    label: 'Approved',
    shortLabel: 'Approved',
    headerBg: 'bg-sage/15',
    cardBg: 'bg-sage/8',
    cardBorder: 'border-sage/20',
    cardBorderSelected: 'border-sage-dark/45 ring-sage/15',
    dot: 'bg-sage-dark',
  },
  {
    key: 'rejected',
    label: 'Rejected',
    shortLabel: 'Rejected',
    headerBg: 'bg-coral/12',
    cardBg: 'bg-coral/8',
    cardBorder: 'border-coral/20',
    cardBorderSelected: 'border-coral/45 ring-coral/15',
    dot: 'bg-coral',
  },
];

export function getAssignableCaregiversList() {
  return getAssignableCaregivers();
}

/** @deprecated Use getAssignableCaregiversList() for up-to-date roster */
export const ASSIGNABLE_CAREGIVERS = getAssignableCaregivers();

export function issueKey(id: string) {
  return formatApplicationRef(id);
}

export function applicantInitials(name: string) {
  return name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export function workRoleForCaregiver(role: CaregiverRole) {
  return role === 'foster_parent' ? 'foster_parent' : 'volunteer';
}

export const ADOPTION_PRIMARY_ACTION_CLASS =
  'bg-[hsl(214_48%_26%)] text-white shadow-sm hover:bg-[hsl(214_48%_22%)]';
