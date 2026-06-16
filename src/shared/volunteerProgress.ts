import type { CareTask } from '@/companion/types';
import type {
  AchievementDefinition,
  PointEvent,
  PointReward,
  VolunteerProgress,
  VolunteerTier,
} from '@/companion/types';

const STORAGE_PREFIX = 'kitticare-volunteer-progress';

export const TASK_POINT_VALUES: Record<CareTask['type'], number> = {
  medication: 15,
  feeding: 10,
  behavior: 12,
  cleaning: 10,
  socialization: 15,
  checkup: 12,
  pickup: 25,
  supply: 18,
};

export const ACTION_POINTS = {
  catUpdate: 20,
  catRegistration: 30,
  dailyAllTasks: 25,
} as const;

export const VOLUNTEER_TIERS: VolunteerTier[] = [
  {
    id: 'new-paw',
    label: 'New Paw',
    minPoints: 0,
    emoji: '🌱',
    message: 'Every visit starts with one small act of care.',
  },
  {
    id: 'trusted-helper',
    label: 'Trusted Helper',
    minPoints: 100,
    emoji: '🤝',
    message: 'The cats recognize your gentle presence.',
  },
  {
    id: 'shelter-star',
    label: 'Shelter Star',
    minPoints: 250,
    emoji: '⭐',
    message: 'Your consistency keeps the shelter running smoothly.',
  },
  {
    id: 'guardian-angel',
    label: 'Guardian Angel',
    minPoints: 500,
    emoji: '🪽',
    message: 'You are part of the reason cats heal and find homes.',
  },
];

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first-task',
    title: 'First Step',
    description: 'Complete your first care task',
    emoji: '🌱',
    target: 1,
    stat: 'tasksCompleted',
  },
  {
    id: 'gentle-hands',
    title: 'Gentle Hands',
    description: 'Lead 5 socialization sessions',
    emoji: '🤲',
    target: 5,
    stat: 'socializationTasks',
  },
  {
    id: 'medicine-maven',
    title: 'Medicine Maven',
    description: 'Complete 3 medication tasks',
    emoji: '💊',
    target: 3,
    stat: 'medicationTasks',
  },
  {
    id: 'rescue-ranger',
    title: 'Rescue Ranger',
    description: 'Complete a pickup or rescue task',
    emoji: '🚗',
    target: 1,
    stat: 'pickupTasks',
  },
  {
    id: 'field-hero',
    title: 'Field Hero',
    description: 'Register a cat from field intake',
    emoji: '📋',
    target: 1,
    stat: 'catsRegistered',
  },
  {
    id: 'voice-for-cats',
    title: 'Voice for Cats',
    description: 'Send 3 care updates to the team',
    emoji: '💬',
    target: 3,
    stat: 'updatesSubmitted',
  },
  {
    id: 'streak-keeper',
    title: 'Streak Keeper',
    description: 'Care for cats 3 days in a row',
    emoji: '🔥',
    target: 3,
    stat: 'streakDays',
  },
  {
    id: 'week-warrior',
    title: 'Week Warrior',
    description: 'Show up 7 days in a row',
    emoji: '🏆',
    target: 7,
    stat: 'streakDays',
  },
  {
    id: 'shelter-champion',
    title: 'Shelter Champion',
    description: 'Earn 500 Paw Points',
    emoji: '🐾',
    target: 500,
    stat: 'tasksCompleted',
  },
];

const SEED_PROGRESS: VolunteerProgress = {
  points: 420,
  streakDays: 2,
  lastActiveDate: null,
  lastDailyBonusDate: null,
  completedTaskIds: ['ct-4', 'ct-5'],
  stats: {
    tasksCompleted: 35,
    updatesSubmitted: 8,
    catsRegistered: 2,
    socializationTasks: 6,
    medicationTasks: 9,
    pickupTasks: 1,
    adoptionStories: 0,
  },
  unlockedAchievements: [
    { id: 'first-task', unlockedAt: '2025-05-01T10:00:00.000Z' },
    { id: 'gentle-hands', unlockedAt: '2025-05-18T14:00:00.000Z' },
    { id: 'medicine-maven', unlockedAt: '2025-06-02T09:00:00.000Z' },
    { id: 'rescue-ranger', unlockedAt: '2025-06-05T16:30:00.000Z' },
    { id: 'field-hero', unlockedAt: '2025-06-08T11:00:00.000Z' },
    { id: 'streak-keeper', unlockedAt: '2025-06-11T08:00:00.000Z' },
  ],
  recentEvents: [
    { id: 'evt-seed-1', label: 'Socialization with Pearl', points: 15, at: '2025-06-12T11:00:00.000Z' },
    { id: 'evt-seed-2', label: 'Afternoon feeding for Ginger', points: 10, at: '2025-06-12T12:00:00.000Z' },
    { id: 'evt-seed-3', label: 'Care update sent', points: 20, at: '2025-06-11T18:00:00.000Z' },
  ],
};

type Listener = (progress: VolunteerProgress) => void;
const listeners = new Set<Listener>();

function storageKey(caregiverId: string) {
  return `${STORAGE_PREFIX}-${caregiverId}`;
}

function notify(caregiverId: string, progress: VolunteerProgress) {
  listeners.forEach((fn) => fn(progress));
  void caregiverId;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function bumpStreak(progress: VolunteerProgress): VolunteerProgress {
  const today = todayKey();
  if (progress.lastActiveDate === today) return progress;

  const nextStreak =
    progress.lastActiveDate === yesterdayKey()
      ? progress.streakDays + 1
      : 1;

  return {
    ...progress,
    streakDays: nextStreak,
    lastActiveDate: today,
  };
}

function appendEvent(progress: VolunteerProgress, label: string, points: number): VolunteerProgress {
  const event: PointEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    label,
    points,
    at: new Date().toISOString(),
  };

  return {
    ...progress,
    points: progress.points + points,
    recentEvents: [event, ...progress.recentEvents].slice(0, 12),
  };
}

function getAchievementValue(progress: VolunteerProgress, achievement: AchievementDefinition) {
  if (achievement.id === 'shelter-champion') return progress.points;
  if (achievement.stat === 'streakDays') return progress.streakDays;
  return progress.stats[achievement.stat];
}

function unlockAchievements(progress: VolunteerProgress): {
  progress: VolunteerProgress;
  newAchievements: AchievementDefinition[];
} {
  const unlockedIds = new Set(progress.unlockedAchievements.map((item) => item.id));
  const newAchievements: AchievementDefinition[] = [];

  for (const achievement of ACHIEVEMENT_DEFINITIONS) {
    if (unlockedIds.has(achievement.id)) continue;
    if (getAchievementValue(progress, achievement) >= achievement.target) {
      unlockedIds.add(achievement.id);
      newAchievements.push(achievement);
    }
  }

  if (newAchievements.length === 0) {
    return { progress, newAchievements };
  }

  return {
    progress: {
      ...progress,
      unlockedAchievements: [
        ...progress.unlockedAchievements,
        ...newAchievements.map((achievement) => ({
          id: achievement.id,
          unlockedAt: new Date().toISOString(),
        })),
      ],
    },
    newAchievements,
  };
}

function applyReward(
  caregiverId: string,
  progress: VolunteerProgress,
  label: string,
  points: number,
): PointReward {
  let next = bumpStreak(progress);
  next = appendEvent(next, label, points);
  const { progress: withAchievements, newAchievements } = unlockAchievements(next);
  saveVolunteerProgress(withAchievements, caregiverId);
  return { points, label, newAchievements };
}

export function loadVolunteerProgress(caregiverId: string): VolunteerProgress {
  try {
    const raw = localStorage.getItem(storageKey(caregiverId));
    if (!raw) {
      saveVolunteerProgress(SEED_PROGRESS, caregiverId);
      return SEED_PROGRESS;
    }
    return JSON.parse(raw) as VolunteerProgress;
  } catch {
    return SEED_PROGRESS;
  }
}

export function saveVolunteerProgress(progress: VolunteerProgress, caregiverId = 'cg-2') {
  localStorage.setItem(storageKey(caregiverId), JSON.stringify(progress));
  notify(caregiverId, progress);
}

export function subscribeVolunteerProgress(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVolunteerTier(points: number): VolunteerTier {
  return [...VOLUNTEER_TIERS].reverse().find((tier) => points >= tier.minPoints) ?? VOLUNTEER_TIERS[0];
}

export function getNextVolunteerTier(points: number): VolunteerTier | null {
  return VOLUNTEER_TIERS.find((tier) => points < tier.minPoints) ?? null;
}

export function getTaskPointValue(task: Pick<CareTask, 'type'>): number {
  return TASK_POINT_VALUES[task.type] ?? 10;
}

export function getAchievementProgress(
  progress: VolunteerProgress,
  achievement: AchievementDefinition,
): { current: number; target: number } {
  return {
    current: getAchievementValue(progress, achievement),
    target: achievement.target,
  };
}

export function recordTaskCompletion(
  caregiverId: string,
  task: CareTask,
  options?: { adoptionStory?: boolean },
): PointReward | null {
  const progress = loadVolunteerProgress(caregiverId);
  if (progress.completedTaskIds.includes(task.id)) return null;

  const points = getTaskPointValue(task);
  const label = `Completed: ${task.title}`;

  let next: VolunteerProgress = {
    ...progress,
    completedTaskIds: [...progress.completedTaskIds, task.id],
    stats: {
      ...progress.stats,
      tasksCompleted: progress.stats.tasksCompleted + 1,
      socializationTasks:
        task.type === 'socialization'
          ? progress.stats.socializationTasks + 1
          : progress.stats.socializationTasks,
      medicationTasks:
        task.type === 'medication'
          ? progress.stats.medicationTasks + 1
          : progress.stats.medicationTasks,
      pickupTasks:
        task.type === 'pickup' ? progress.stats.pickupTasks + 1 : progress.stats.pickupTasks,
      adoptionStories:
        options?.adoptionStory
          ? progress.stats.adoptionStories + 1
          : progress.stats.adoptionStories,
    },
  };

  next = bumpStreak(next);
  next = appendEvent(next, label, points);
  const { progress: withAchievements, newAchievements } = unlockAchievements(next);
  saveVolunteerProgress(withAchievements, caregiverId);

  return { points, label, newAchievements };
}

export function recordCatUpdate(caregiverId: string, catName: string): PointReward {
  const progress = loadVolunteerProgress(caregiverId);
  const next: VolunteerProgress = {
    ...progress,
    stats: {
      ...progress.stats,
      updatesSubmitted: progress.stats.updatesSubmitted + 1,
    },
  };

  return applyReward(caregiverId, next, `Care update for ${catName}`, ACTION_POINTS.catUpdate);
}

export function recordCatRegistration(caregiverId: string, catName: string): PointReward {
  const progress = loadVolunteerProgress(caregiverId);
  const next: VolunteerProgress = {
    ...progress,
    stats: {
      ...progress.stats,
      catsRegistered: progress.stats.catsRegistered + 1,
    },
  };

  return applyReward(caregiverId, next, `Field intake: ${catName}`, ACTION_POINTS.catRegistration);
}

export function recordDailyCompletionBonus(
  caregiverId: string,
  roleLabel: string,
): PointReward | null {
  const progress = loadVolunteerProgress(caregiverId);
  const today = todayKey();
  if (progress.lastDailyBonusDate === today) return null;

  const next: VolunteerProgress = {
    ...progress,
    lastDailyBonusDate: today,
  };

  return applyReward(caregiverId, next, `All ${roleLabel} tasks done today`, ACTION_POINTS.dailyAllTasks);
}

export function getImpactSummary(progress: VolunteerProgress, baseline: {
  catsHelped: number;
  adoptionStories: number;
}) {
  return {
    pawPoints: progress.points,
    streakDays: progress.streakDays,
    tasksCompleted: progress.stats.tasksCompleted,
    updatesSubmitted: progress.stats.updatesSubmitted,
    catsHelped: baseline.catsHelped + progress.stats.catsRegistered,
    adoptionStories: baseline.adoptionStories + progress.stats.adoptionStories,
    achievementsUnlocked: progress.unlockedAchievements.length,
    achievementsTotal: ACHIEVEMENT_DEFINITIONS.length,
  };
}
