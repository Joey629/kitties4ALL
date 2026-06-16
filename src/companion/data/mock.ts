import { adminCats } from '../../admin/data/mock';
import { getCatImageUrl } from '@/shared/catImages';
import type { CompanionCat, CareTask, Message, CaregiverProfile, WorkRole } from '../types';

export const CURRENT_USER: CaregiverProfile = {
  id: 'cg-2',
  name: 'Marcus',
  role: 'volunteer',
  avatar: 'MW',
  impact: {
    catsHelped: 12,
    tasksCompleted: 35,
    adoptionStories: 3,
  },
};

export const WORK_ENVIRONMENTS: Record<WorkRole, { label: string; description: string; assigneeId: string }> = {
  volunteer: {
    label: 'Volunteer',
    description: 'Shelter shift — on-site care',
    assigneeId: 'cg-2',
  },
  foster_parent: {
    label: 'Foster',
    description: 'Foster home — in-home care',
    assigneeId: 'cg-3',
  },
};

export const companionCats: CompanionCat[] = adminCats.map((cat) => ({
  id: cat.id,
  name: cat.name,
  photo: getCatImageUrl(cat.id) ?? cat.photo,
  age: cat.age,
  personality: cat.personality,
  healthStatus:
    cat.health === 'medical'
      ? 'Medical care'
      : cat.health === 'pending_exam'
        ? 'Pending exam'
        : cat.health === 'monitoring'
          ? 'Monitoring'
          : 'Healthy',
  careInstructions: getCareInstructions(cat.id),
  medication: cat.id === 'willow' ? 'Give 1 tablet with food' : cat.id === 'luna' ? 'Give 1 tablet with morning meal' : undefined,
  currentCaregiver: cat.caregiverId,
  story: cat.story,
  vaccinated: true,
  daysTogether: cat.id === 'maple' ? 14 : undefined,
  recentUpdates: cat.id === 'maple'
    ? ['Eating well', 'More playful', 'Sleeps through the night']
    : cat.id === 'pearl'
      ? ['First purr during session!', 'Approached volunteer']
      : undefined,
}));

function getCareInstructions(catId: string): string {
  const map: Record<string, string> = {
    luna: 'Gentle morning approach. Luna may be nervous — speak softly and offer treats.',
    mochi: 'High energy — ensure 15 min play time. Watch for overstimulation.',
    shadow: 'Sit quietly nearby. Do not approach directly. Let Shadow come to you.',
    pearl: 'Slow movements only. Use gentle voice. Reward any brave behavior.',
    willow: 'Recovery care — limit activity. Check incision site. Report any concerns.',
    ginger: 'Senior cat — joint supplements in food. Monitor mobility.',
    biscuit: 'Lap cat — enjoys quiet time. Prepare for adoption pickup today.',
    maple: 'Weekly photo update. Track eating and litter box habits.',
  };
  return map[catId] ?? 'Standard care routine. Observe and report any changes.';
}

export const careTasks: CareTask[] = [
  {
    id: 'ct-1',
    catId: 'luna',
    catName: 'Luna',
    type: 'medication',
    title: 'Give medication',
    status: 'pending',
    dueTime: '9:00 AM',
    instructions: 'Give 1 tablet with morning meal.',
    notes: 'Luna may be nervous in the morning. Approach slowly.',
    assigneeId: 'cg-2',
    emoji: '💊',
    workRole: 'volunteer',
  },
  {
    id: 'ct-2',
    catId: 'mochi',
    catName: 'Mochi',
    type: 'behavior',
    title: 'Update behavior',
    status: 'pending',
    dueTime: '2:00 PM',
    instructions: 'Observe play session and log behavior notes.',
    notes: 'Note energy level and social interactions.',
    assigneeId: 'cg-2',
    emoji: '📝',
    workRole: 'volunteer',
  },
  {
    id: 'ct-3',
    catId: null,
    catName: 'Shelter room',
    type: 'cleaning',
    title: 'Cleaning',
    status: 'pending',
    dueTime: '3:00 PM',
    instructions: 'Litter change, fresh bedding, wipe surfaces.',
    assigneeId: 'cg-2',
    emoji: '🧹',
    workRole: 'volunteer',
  },
  {
    id: 'ct-4',
    catId: 'pearl',
    catName: 'Pearl',
    type: 'socialization',
    title: 'Socialization session',
    status: 'completed',
    dueTime: '11:00 AM',
    instructions: '15-minute gentle socialization in quiet corner.',
    notes: 'Pearl purred for the first time yesterday!',
    assigneeId: 'cg-2',
    emoji: '🐾',
    workRole: 'volunteer',
  },
  {
    id: 'ct-5',
    catId: 'ginger',
    catName: 'Ginger',
    type: 'feeding',
    title: 'Afternoon feeding',
    status: 'completed',
    dueTime: '12:00 PM',
    instructions: 'Add joint supplement to food bowl.',
    assigneeId: 'cg-2',
    emoji: '🍽️',
    workRole: 'volunteer',
  },
  {
    id: 'ft-1',
    catId: 'maple',
    catName: 'Maple',
    type: 'feeding',
    title: 'Morning feeding log',
    status: 'pending',
    dueTime: '8:00 AM',
    instructions: 'Record food intake and note litter box habits.',
    assigneeId: 'cg-3',
    emoji: '🍽️',
    workRole: 'foster_parent',
  },
  {
    id: 'ft-2',
    catId: 'maple',
    catName: 'Maple',
    type: 'checkup',
    title: 'Weekly photo update',
    status: 'pending',
    dueTime: '6:00 PM',
    instructions: 'Take 2–3 photos and note mood and activity level.',
    assigneeId: 'cg-3',
    emoji: '📷',
    workRole: 'foster_parent',
  },
  {
    id: 'ft-3',
    catId: 'maple',
    catName: 'Maple',
    type: 'medication',
    title: 'Evening medication',
    status: 'completed',
    dueTime: '7:00 PM',
    instructions: 'Give supplement mixed into evening meal.',
    assigneeId: 'cg-3',
    emoji: '💊',
    workRole: 'foster_parent',
  },
  {
    id: 'ft-4',
    catId: 'maple',
    catName: 'Maple',
    type: 'checkup',
    title: 'Foster weekly check-in',
    status: 'pending',
    dueTime: 'This week',
    instructions: 'Confirm eating, litter box, and behavior. Submit a care update for the shelter team.',
    notes: 'Linked to shelter foster update reminders.',
    assigneeId: 'cg-3',
    emoji: '📋',
    workRole: 'foster_parent',
  },
];

export const messages: Message[] = [
  {
    id: 'msg-1',
    from: 'Sarah Chen',
    fromRole: 'manager',
    text: 'Luna has a vet appointment tomorrow at 10 AM. Please keep her calm today.',
    timestamp: '2025-06-12T08:00:00',
    read: false,
  },
  {
    id: 'msg-2',
    from: 'Sarah Chen',
    fromRole: 'manager',
    text: 'Great work with Pearl yesterday! Her confidence is really growing.',
    timestamp: '2025-06-11T16:00:00',
    read: true,
  },
  {
    id: 'msg-3',
    from: 'Marcus Webb',
    fromRole: 'caregiver',
    text: 'Mochi had an amazing play session today. Very social with visitors!',
    timestamp: '2025-06-11T14:30:00',
    read: true,
  },
  {
    id: 'msg-4',
    from: 'Sarah Chen',
    fromRole: 'manager',
    text: 'Reminder: Biscuit adoption pickup at 2 PM today. Rivera family confirmed.',
    timestamp: '2025-06-12T07:30:00',
    read: false,
  },
];

export function getCompanionCat(id: string) {
  return companionCats.find((c) => c.id === id);
}

export function getTask(id: string) {
  return careTasks.find((t) => t.id === id);
}

export function getTasksForUser(userId: string) {
  return careTasks.filter((t) => t.assigneeId === userId);
}

export function getMyCatsForRole(role: WorkRole, extraIds: string[] = []) {
  const baseIds = role === 'volunteer'
    ? ['mochi', 'ginger']
    : ['maple'];
  const ids = [...new Set([...baseIds, ...extraIds])];
  return companionCats.filter((c) => ids.includes(c.id));
}

export function getMyCats(userId: string) {
  const assignedIds = userId === 'cg-3'
    ? ['maple']
    : userId === 'cg-2'
      ? ['mochi', 'ginger']
      : [];
  return companionCats.filter((c) => assignedIds.includes(c.id));
}

export function getShelterCats() {
  return companionCats.filter((cat) => {
    const adminCat = adminCats.find((entry) => entry.id === cat.id);
    return adminCat?.placement === 'shelter' && adminCat.adoptionPipeline !== 'adopted';
  });
}

export function getTasksForWorkRole(role: WorkRole, tasks: CareTask[], userId?: string) {
  const assigneeId = WORK_ENVIRONMENTS[role].assigneeId;
  if (role === 'foster_parent' && userId) {
    return tasks.filter((task) => task.assigneeId === assigneeId || task.assigneeId === userId);
  }
  return tasks.filter((task) => task.assigneeId === assigneeId);
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
