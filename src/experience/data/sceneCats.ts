import type { Cat, CatActivity, ShelterLocation } from '../../types/cat';

export interface IllustrationSpot {
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
}

/** Reference cat aspect (w/h) — ginger baseline for visual normalization */
const REF_ASPECT = 561 / 882;

const CAT_IMAGE_ASPECT: Record<string, number> = {
  luna: 388 / 786,
  mochi: 814 / 1032,
  shadow: 665 / 785,
  biscuit: 529 / 995,
  pearl: 583 / 800,
  ginger: 561 / 882,
  willow: 502 / 915,
  maple: 561 / 882,
  dumpling: 561 / 882,
  sesame: 665 / 785,
};

/** Percent positions tuned for living-shelter-bg.png */
const SPOT_POSITIONS: Record<ShelterLocation, Pick<IllustrationSpot, 'x' | 'y'>> = {
  window_nook: { x: 11, y: 73 },
  play_area: { x: 27, y: 56 },
  cozy_bed: { x: 36, y: 78 },
  food_station: { x: 41, y: 80 },
  exploration: { x: 50, y: 73 },
  quiet_corner: { x: 64, y: 77 },
  medical_rest: { x: 90, y: 56 },
  foster_home: { x: 50, y: 50 },
};

/** Per-cat overrides when multiple cats share a location */
const CAT_SPOT_OVERRIDES: Record<string, Pick<IllustrationSpot, 'x' | 'y' | 'flip'>> = {
  pearl: { x: 77, y: 71 },
  shadow: { x: 64, y: 77 },
  luna: { x: 11, y: 73 },
  mochi: { x: 27, y: 56 },
  biscuit: { x: 36, y: 78 },
  ginger: { x: 50, y: 73 },
  willow: { x: 90, y: 56 },
  dumpling: { x: 20, y: 58 },
  sesame: { x: 72, y: 74 },
};

/** Cats further up the scene sit farther back and render smaller */
export function depthScale(y: number): number {
  const t = Math.min(1, Math.max(0, (y - 54) / (80 - 54)));
  return 0.78 + t * 0.22;
}

function imageAspectNorm(catId: string): number {
  const aspect = CAT_IMAGE_ASPECT[catId] ?? REF_ASPECT;
  return Math.pow(REF_ASPECT / aspect, 0.55);
}

function resolveSpotScale(catId: string, y: number): number {
  return depthScale(y) * imageAspectNorm(catId);
}

export interface SceneCat extends Cat {
  spot: IllustrationSpot;
  activity: CatActivity;
  visible: boolean;
}

export function mapCatsToScene(cats: Cat[]): SceneCat[] {
  return cats
    .filter((c) => c.fosterStatus === 'in_shelter')
    .map((cat) => {
      const location =
        cat.healthStatus === 'medical_care' ? 'medical_rest' : cat.location;
      const base = CAT_SPOT_OVERRIDES[cat.id] ?? SPOT_POSITIONS[location];
      if (location === 'foster_home') {
        return {
          ...cat,
          spot: { ...base, scale: 0 },
          activity: resolveActivity(cat),
          visible: false,
        };
      }
      return {
        ...cat,
        spot: {
          ...base,
          scale: resolveSpotScale(cat.id, base.y),
        },
        activity: resolveActivity(cat),
        visible: true,
      };
    });
}

function resolveActivity(cat: Cat): CatActivity {
  if (cat.healthStatus === 'medical_care') return 'resting';
  return cat.currentActivity;
}

export function getStatusLabel(cat: Cat): string {
  if (cat.healthStatus === 'medical_care') return 'Resting & recovering';
  if (cat.adoptionStatus === 'pending') return 'Adoption in progress';
  if (cat.adoptionStatus === 'adopted') return 'Found a family';
  return 'Available for adoption';
}

export function getAdoptionStatusNote(cat: Cat): string | null {
  if (cat.adoptionStatus === 'pending') {
    return `We're reviewing an adoption for ${cat.name}. New applications will open if it doesn't move forward.`;
  }
  if (cat.healthStatus === 'medical_care' || cat.healthStatus === 'recovering') {
    return `${cat.name} is under health care right now and isn't accepting new adoptions yet.`;
  }
  return null;
}
