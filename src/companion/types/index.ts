export type TaskType =
  | 'medication'
  | 'feeding'
  | 'behavior'
  | 'cleaning'
  | 'socialization'
  | 'checkup'
  | 'pickup'
  | 'supply';
export type TaskStatus = 'pending' | 'completed';
export type Mood = 'happy' | 'normal' | 'concerned';
export type Eating = 'good' | 'low';
export type Behavior = 'friendly' | 'shy' | 'active';

export interface CompanionCat {
  id: string;
  name: string;
  photo: string;
  age: string;
  personality: string[];
  healthStatus: string;
  careInstructions: string;
  medication?: string;
  currentCaregiver: string;
  story: string;
  vaccinated: boolean;
  daysTogether?: number;
  recentUpdates?: string[];
}

export interface CareTask {
  id: string;
  catId: string | null;
  catName: string;
  type: TaskType;
  title: string;
  status: TaskStatus;
  dueTime: string;
  instructions: string;
  notes?: string;
  assigneeId: string;
  emoji: string;
  workRole: WorkRole;
  assignedBy?: 'manager';
  applicationId?: string;
  adoptionApplicant?: {
    name: string;
    email: string;
    phone?: string;
    visitAvailability?: string;
    catExperience?: string;
    housingType?: 'own' | 'rent';
    reviewSubstage?: string;
  };
  location?: string;
  /** Intake/reference photo for pickup comparison */
  referencePhotoUrl?: string;
  /** Volunteer-submitted field photos (pickup tasks) */
  submissionPhotos?: string[];
  supplyRequest?: {
    items: { id: string; name: string; quantity: number; unit?: string }[];
    requestedById: string;
    requestedByName: string;
    source: 'foster_resupply' | 'emergency';
    notes?: string;
  };
  incidentReportId?: string;
}

export interface CatUpdate {
  id: string;
  catId: string;
  mood: Mood;
  eating: Eating;
  behavior: Behavior;
  note: string;
  photo?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  from: string;
  fromRole: 'manager' | 'caregiver';
  text: string;
  timestamp: string;
  read: boolean;
}

export type WorkRole = 'volunteer' | 'foster_parent';

export interface QuickIntakeCat {
  name: string;
  source: string;
  healthTags: string[];
  notes?: string;
  photoPreview?: string | null;
}

export interface CaregiverProfile {
  id: string;
  name: string;
  role: 'volunteer' | 'foster_parent' | 'staff';
  avatar: string;
  impact: {
    catsHelped: number;
    tasksCompleted: number;
    adoptionStories: number;
  };
}

export interface VolunteerTier {
  id: string;
  label: string;
  minPoints: number;
  emoji: string;
  message: string;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  emoji: string;
  target: number;
  stat: keyof VolunteerStats | 'streakDays';
}

export interface VolunteerStats {
  tasksCompleted: number;
  updatesSubmitted: number;
  catsRegistered: number;
  socializationTasks: number;
  medicationTasks: number;
  pickupTasks: number;
  adoptionStories: number;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
}

export interface PointEvent {
  id: string;
  label: string;
  points: number;
  at: string;
}

export interface VolunteerProgress {
  points: number;
  streakDays: number;
  lastActiveDate: string | null;
  lastDailyBonusDate: string | null;
  completedTaskIds: string[];
  stats: VolunteerStats;
  unlockedAchievements: UnlockedAchievement[];
  recentEvents: PointEvent[];
}

export interface PointReward {
  points: number;
  label: string;
  newAchievements: AchievementDefinition[];
}

export interface UpdateDraft {
  mood: Mood | null;
  eating: Eating | null;
  behavior: Behavior | null;
  note: string;
  photo: string | null;
}
