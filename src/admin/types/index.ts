export type AdoptionPipelineStatus = 'available' | 'pending' | 'adopted' | 'unavailable';
export type HealthStatus = 'healthy' | 'pending_exam' | 'medical' | 'monitoring';
export type CatPlacement = 'shelter' | 'foster';
export type CatSex = 'male' | 'female' | 'unknown';
export type CaregiverRole = 'volunteer' | 'foster_parent' | 'staff';
export type AdoptionStage = 'new' | 'reviewing' | 'approved' | 'rejected';
export type ReviewSubstage = 'contact' | 'shelter_visit';
export type VolunteerRecommendation = 'proceed' | 'concerns' | 'not_recommended';

export interface ReviewActivityAssessment {
  type: ReviewSubstage;
  assigneeId: string;
  assigneeName: string;
  notes: string;
  recommendation: VolunteerRecommendation;
  completedAt: string;
}

export type HousingType = 'apartment' | 'house';
export type HomeTime = 'often' | 'part_time' | 'away';
export type CatExperience = 'first_time' | 'some' | 'experienced';

export interface LifestyleProfile {
  housing: HousingType;
  hasChildren: boolean;
  hasOtherPets: boolean;
  homeTime: HomeTime;
  experience: CatExperience;
}
export type ActivityType =
  | 'intake'
  | 'medical'
  | 'foster'
  | 'adoption'
  | 'donation'
  | 'care'
  | 'note';

export interface TimelineEvent {
  id: string;
  date: string;
  type: ActivityType;
  title: string;
  description: string;
}

export interface HealthRecord {
  id: string;
  date: string;
  type: string;
  provider: string;
  notes: string;
  status: 'completed' | 'scheduled' | 'ongoing';
}

export interface CareLog {
  id: string;
  date: string;
  caregiver: string;
  activity: string;
  notes: string;
}

export interface FosterRecord {
  id: string;
  startDate: string;
  endDate?: string;
  fosterParent: string;
  status: 'active' | 'completed';
  notes: string;
}

export interface AdminCat {
  id: string;
  name: string;
  age: string;
  breed: string;
  sex: CatSex;
  photo: string;
  adoptionPipeline: AdoptionPipelineStatus;
  placement: CatPlacement;
  location: string;
  health: HealthStatus;
  personality: string[];
  story: string;
  tagline: string;
  caregiverId: string;
  intakeDate: string;
  timeline: TimelineEvent[];
  healthRecords: HealthRecord[];
  careHistory: CareLog[];
  fosterHistory: FosterRecord[];
  adoptionStatus: string;
  /** Listed on the public adoption site */
  publicPagePublished?: boolean;
  hasPublicPhoto?: boolean;
  /** When the cat was marked available on the public page */
  listedForAdoptionSince?: string;
  /** Who this cat is best suited for — used in AI adoption matching */
  idealAdopterDescription?: string;
  /** Last foster check-in or update from foster parent */
  lastFosterUpdate?: string;
}

export interface Caregiver {
  id: string;
  name: string;
  email: string;
  role: CaregiverRole;
  availability: string;
  /** Short day codes shown on the availability picker, e.g. Mon, Wed */
  availabilityDays: string[];
  /** Volunteer skills / focus areas */
  skills: string[];
  assignedCatIds: string[];
  phone: string;
  /** Foster home address — foster parents only */
  address?: string;
  joinedDate: string;
  activityCount: number;
  avatar: string;
}

export interface AdoptionApplication {
  id: string;
  applicantName: string;
  email: string;
  phone?: string;
  housingType?: 'own' | 'rent';
  landlordAllowsPets?: boolean;
  hasOtherPets?: boolean;
  hasChildren?: boolean;
  catExperience?: string;
  visitAvailability?: string;
  catId: string;
  catName: string;
  stage: AdoptionStage;
  reviewSubstage?: ReviewSubstage;
  submittedDate: string;
  notes: string;
  interviewer?: string;
  interviewerId?: string;
  rejectionReason?: string;
  withdrawnByApplicant?: boolean;
  /** Hidden from the adopter's My adoptions view */
  dismissedByApplicant?: boolean;
  lifestyleProfile?: LifestyleProfile;
  matchScore?: number;
  matchReasons?: string[];
  reviewAssessments?: ReviewActivityAssessment[];
}

export interface Donation {
  id: string;
  date: string;
  amount: number;
  type: 'one-time' | 'monthly';
  catId?: string;
  catName?: string;
  acknowledged?: boolean;
}

export interface Communication {
  id: string;
  date: string;
  type: 'email' | 'call' | 'thank-you';
  subject: string;
  notes: string;
}

export interface Donor {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalDonated: number;
  memberSince: string;
  supportedCatIds: string[];
  donations: Donation[];
  communications: Communication[];
  avatar: string;
  tier: 'friend' | 'supporter' | 'champion' | 'guardian';
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string;
  actor: string;
}

export interface DashboardStats {
  totalCats: number;
  available: number;
  medical: number;
  foster: number;
  applications: number;
  donationTotal: number;
  capacity: number;
  capacityUsed: number;
  cashReserve: number;
  dailyOperatingCost: number;
}
