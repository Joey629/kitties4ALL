import type { CatPosition, ShelterLocation } from '../types/cat';

export const LOCATION_POSITIONS: Record<
  ShelterLocation,
  CatPosition & { description: string }
> = {
  window_nook: {
    x: -1.5,
    y: 0.1,
    z: -2.8,
    rotation: 0.5,
    description: 'Curled on the sunny window sill',
  },
  play_area: {
    x: 0.8,
    y: 0,
    z: 0.5,
    rotation: -0.6,
    description: 'Playing among the plush toys',
  },
  quiet_corner: {
    x: 3.2,
    y: 0,
    z: 2.2,
    rotation: -2.0,
    description: 'Nestled in the cozy nook',
  },
  cozy_bed: {
    x: -0.8,
    y: 0.06,
    z: 1.0,
    rotation: 1.0,
    description: 'Resting on the soft green rug',
  },
  food_station: {
    x: -2.3,
    y: 0,
    z: 2.5,
    rotation: 2.2,
    description: 'Near the food bowls',
  },
  exploration: {
    x: -0.3,
    y: 0,
    z: -0.5,
    rotation: 0.3,
    description: 'Exploring the play zone',
  },
  medical_rest: {
    x: 3.5,
    y: 0.08,
    z: 2.3,
    rotation: -1.8,
    description: 'Resting in the quiet nook',
  },
  foster_home: {
    x: 0,
    y: 0,
    z: 0,
    rotation: 0,
    description: 'Currently enjoying a foster home',
  },
};
