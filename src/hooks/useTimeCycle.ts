import { useState, useEffect, useRef } from 'react';
import type { TimeOfDay } from '../types/cat';

const CYCLE_ORDER: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];

const TIME_CONFIG: Record<
  TimeOfDay,
  { label: string; ambient: string; icon: string }
> = {
  morning: {
    label: 'Morning',
    ambient: 'Sunlight fills the room as cats wake up',
    icon: '🌅',
  },
  afternoon: {
    label: 'Afternoon',
    ambient: 'A gentle bustle of play and volunteer visits',
    icon: '☀️',
  },
  evening: {
    label: 'Evening',
    ambient: 'The shelter grows quiet as day softens',
    icon: '🌇',
  },
  night: {
    label: 'Night',
    ambient: 'Soft lamplight — most cats are dreaming',
    icon: '🌙',
  },
};

function getTimeFromHour(hour: number): TimeOfDay {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function useTimeCycle(cycleInterval = 90000) {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() =>
    getTimeFromHour(new Date().getHours())
  );
  const [prevTime, setPrevTime] = useState<TimeOfDay>(timeOfDay);
  const [transition, setTransition] = useState(1);
  const transitioning = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay((current) => {
        const idx = CYCLE_ORDER.indexOf(current);
        const next = CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length];
        setPrevTime(current);
        setTransition(0);
        transitioning.current = true;
        return next;
      });
    }, cycleInterval);

    return () => clearInterval(interval);
  }, [cycleInterval]);

  useEffect(() => {
    if (!transitioning.current || transition >= 1) {
      transitioning.current = false;
      return;
    }

    const frame = requestAnimationFrame(() => {
      setTransition((t) => {
        const next = Math.min(1, t + 0.015);
        if (next >= 1) transitioning.current = false;
        return next;
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [transition, timeOfDay]);

  return {
    timeOfDay,
    prevTime,
    transition,
    config: TIME_CONFIG[timeOfDay],
  };
}

export interface LightingConfig {
  ambient: number;
  directional: number;
  color: string;
  bg: string;
  fog: string;
  windowGlow: string;
  warmth: number;
}

const LIGHTING: Record<TimeOfDay, LightingConfig> = {
  morning: {
    ambient: 0.7,
    directional: 0.9,
    color: '#fffaf5',
    bg: '#f8f4ec',
    fog: '#f0ebe3',
    windowGlow: '#ffecc8',
    warmth: 0.7,
  },
  afternoon: {
    ambient: 0.75,
    directional: 1.0,
    color: '#ffffff',
    bg: '#faf6f0',
    fog: '#ede8e0',
    windowGlow: '#fff4d0',
    warmth: 0.5,
  },
  evening: {
    ambient: 0.5,
    directional: 0.6,
    color: '#ffe8c8',
    bg: '#5a4838',
    fog: '#6a5848',
    windowGlow: '#ffbb77',
    warmth: 0.9,
  },
  night: {
    ambient: 0.35,
    directional: 0.3,
    color: '#c8d8f0',
    bg: '#2a2a3a',
    fog: '#3a3a4a',
    windowGlow: '#8090c0',
    warmth: 0.25,
  },
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    const h = hex.replace('#', '');
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const bl = Math.round(lerp(ab, bb, t));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

export function getLightingForTime(
  time: TimeOfDay,
  prevTime?: TimeOfDay,
  transition = 1
): LightingConfig {
  const current = LIGHTING[time];
  if (!prevTime || prevTime === time || transition >= 1) return current;
  const previous = LIGHTING[prevTime];
  const t = transition;
  return {
    ambient: lerp(previous.ambient, current.ambient, t),
    directional: lerp(previous.directional, current.directional, t),
    color: lerpColor(previous.color, current.color, t),
    bg: lerpColor(previous.bg, current.bg, t),
    fog: lerpColor(previous.fog, current.fog, t),
    windowGlow: lerpColor(previous.windowGlow, current.windowGlow, t),
    warmth: lerp(previous.warmth, current.warmth, t),
  };
}

export function getActivityForTime(
  time: TimeOfDay,
  baseActivity: string,
  mood: string
): string {
  if (time === 'night') return mood === 'playful' ? 'resting' : 'sleeping';
  if (time === 'morning') return mood === 'playful' ? 'stretching' : baseActivity;
  if (time === 'afternoon')
    return mood === 'shy' ? 'resting' : mood === 'playful' ? 'playing' : 'looking_around';
  if (time === 'evening') return mood === 'playful' ? 'resting' : 'resting';
  return baseActivity;
}
