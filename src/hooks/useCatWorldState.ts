import { useMemo } from 'react';
import type { Cat, CatActivity, TimeOfDay, WorldCat } from '../types/cat';
import { LOCATION_POSITIONS } from '../data/locations';
import { getActivityForTime } from './useTimeCycle';

function resolveActivity(cat: Cat, timeOfDay: TimeOfDay): CatActivity {
  if (cat.fosterStatus === 'fostered') return 'resting';
  if (cat.healthStatus === 'medical_care') return timeOfDay === 'night' ? 'sleeping' : 'resting';

  const activity = getActivityForTime(timeOfDay, cat.currentActivity, cat.mood);
  return activity as CatActivity;
}

function resolveLocation(cat: Cat) {
  if (cat.fosterStatus === 'fostered') return LOCATION_POSITIONS.foster_home;
  if (cat.healthStatus === 'medical_care') return LOCATION_POSITIONS.medical_rest;
  return LOCATION_POSITIONS[cat.location];
}

export function useCatWorldState(cats: Cat[], timeOfDay: TimeOfDay): WorldCat[] {
  return useMemo(
    () =>
      cats.map((cat) => {
        const loc = resolveLocation(cat);
        const isPresent = cat.fosterStatus === 'in_shelter';

        return {
          ...cat,
          position: {
            x: loc.x,
            y: loc.y,
            z: loc.z,
            rotation: loc.rotation,
          },
          activity: resolveActivity(cat, timeOfDay),
          isPresent,
        };
      }),
    [cats, timeOfDay]
  );
}

export function getPresentCats(worldCats: WorldCat[]) {
  return worldCats.filter((c) => c.isPresent);
}

export function getFosteredCats(worldCats: WorldCat[]) {
  return worldCats.filter((c) => !c.isPresent);
}
