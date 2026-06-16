export type AdoptionStatus = 'available' | 'pending' | 'adopted';
export type HealthStatus = 'healthy' | 'medical_care' | 'recovering';
export type FosterStatus = 'in_shelter' | 'fostered';
export type CatMood = 'calm' | 'playful' | 'shy' | 'curious' | 'sleepy' | 'content';
export type CatActivity =
  | 'sleeping'
  | 'stretching'
  | 'looking_around'
  | 'walking'
  | 'playing'
  | 'resting'
  | 'hiding'
  | 'exploring';

export type ShelterLocation =
  | 'window_nook'
  | 'play_area'
  | 'quiet_corner'
  | 'cozy_bed'
  | 'food_station'
  | 'exploration'
  | 'medical_rest'
  | 'foster_home';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface CatPosition {
  x: number;
  y: number;
  z: number;
  rotation?: number;
}

export type CoatPattern =
  | 'solid'
  | 'black'
  | 'white'
  | 'pointed'
  | 'tabby_brown'
  | 'tabby_orange'
  | 'calico'
  | 'golden_shaded'
  | 'silver_shaded';

export interface CatAppearance {
  bodyColor: string;
  bellyColor: string;
  accentColor: string;
  eyeColor: string;
  hasStripes: boolean;
  pattern: CoatPattern;
  size: 'kitten' | 'medium' | 'large';
  earShape: 'pointed' | 'rounded';
}

export interface Cat {
  id: string;
  name: string;
  age: string;
  breed: string;
  personality: string[];
  adoptionStatus: AdoptionStatus;
  healthStatus: HealthStatus;
  fosterStatus: FosterStatus;
  location: ShelterLocation;
  mood: CatMood;
  currentActivity: CatActivity;
  story: string;
  tagline: string;
  image: string;
  appearance: CatAppearance;
  preferredSpot: string;
}

export interface WorldCat extends Cat {
  position: CatPosition;
  activity: CatActivity;
  isPresent: boolean;
}
