import {
  ArrowRightLeft,
  ClipboardList,
  Heart,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';
import {
  markFosterAdoptionReady,
  requestFosterTransfer,
  requestFosterUpdate,
  scheduleFosterVetVisit,
} from '@/admin/lib/fosterCaregiverOps';
import type { Caregiver } from '@/admin/types';

export interface FosterCaregiverAction {
  id: string;
  label: string;
  icon: LucideIcon;
  run: (caregiver: Caregiver) => void;
}

export const FOSTER_CAREGIVER_ACTIONS: FosterCaregiverAction[] = [
  {
    id: 'request_update',
    label: 'Request Update',
    icon: ClipboardList,
    run: requestFosterUpdate,
  },
  {
    id: 'schedule_vet',
    label: 'Schedule Vet Visit',
    icon: Stethoscope,
    run: scheduleFosterVetVisit,
  },
  {
    id: 'adoption_ready',
    label: 'Mark Adoption Ready',
    icon: Heart,
    run: markFosterAdoptionReady,
  },
  {
    id: 'transfer',
    label: 'Transfer Foster',
    icon: ArrowRightLeft,
    run: requestFosterTransfer,
  },
];
