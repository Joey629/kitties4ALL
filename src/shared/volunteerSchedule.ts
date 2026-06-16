import { caregivers } from '@/admin/data/mock';
import { loadCaregivers } from '@/shared/caregivers';
import type { Caregiver } from '@/admin/types';

export const SCHEDULE_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;
export type ScheduleWeekday = (typeof SCHEDULE_WEEKDAYS)[number];

export interface VolunteerShift {
  id: string;
  label: string;
  timeRange: string;
  capacity: number;
  assignedVolunteerIds: string[];
}

export type VolunteerDaySchedule = Record<ScheduleWeekday, VolunteerShift[]>;

const STORAGE_KEY = 'kitticare-volunteer-schedule';

type Listener = (schedule: VolunteerDaySchedule) => void;
const listeners = new Set<Listener>();

function notify(schedule: VolunteerDaySchedule) {
  listeners.forEach((listener) => listener(schedule));
}

function shiftId(day: ScheduleWeekday, index: number) {
  return `${day.toLowerCase()}-shift-${index}`;
}

function buildSeedSchedule(): VolunteerDaySchedule {
  const volunteers = caregivers.filter((caregiver) => caregiver.role === 'volunteer');
  const byId = (id: string) => volunteers.find((volunteer) => volunteer.id === id)?.id;

  const templates: Record<
    ScheduleWeekday,
    { capacity: number; assigned: string[] }[]
  > = {
    Mon: [
      { capacity: 2, assigned: [byId('cg-2'), byId('cg-4')].filter(Boolean) as string[] },
      { capacity: 3, assigned: [byId('cg-4')].filter(Boolean) as string[] },
      { capacity: 2, assigned: [byId('cg-2'), byId('cg-4')].filter(Boolean) as string[] },
    ],
    Tue: [
      { capacity: 2, assigned: [byId('cg-2'), byId('cg-4')].filter(Boolean) as string[] },
      { capacity: 3, assigned: [byId('cg-2')].filter(Boolean) as string[] },
      { capacity: 2, assigned: [byId('cg-4'), byId('cg-2')].filter(Boolean) as string[] },
    ],
    Wed: [
      { capacity: 2, assigned: [byId('cg-4'), byId('cg-2')].filter(Boolean) as string[] },
      { capacity: 3, assigned: [byId('cg-2')].filter(Boolean) as string[] },
      { capacity: 2, assigned: [byId('cg-4'), byId('cg-2')].filter(Boolean) as string[] },
    ],
    Thu: [
      { capacity: 2, assigned: [byId('cg-2'), byId('cg-4')].filter(Boolean) as string[] },
      { capacity: 3, assigned: [byId('cg-4'), byId('cg-2')].filter(Boolean) as string[] },
      { capacity: 2, assigned: [byId('cg-2')].filter(Boolean) as string[] },
    ],
    Fri: [
      { capacity: 2, assigned: [byId('cg-4'), byId('cg-2')].filter(Boolean) as string[] },
      { capacity: 3, assigned: [] },
      { capacity: 2, assigned: [byId('cg-2'), byId('cg-4')].filter(Boolean) as string[] },
    ],
  };

  const shiftMeta = [
    { label: 'Morning shift', timeRange: '8:00 AM – 12:00 PM' },
    { label: 'Afternoon shift', timeRange: '12:00 PM – 4:00 PM' },
    { label: 'Evening shift', timeRange: '4:00 PM – 8:00 PM' },
  ];

  return SCHEDULE_WEEKDAYS.reduce((acc, day) => {
    acc[day] = templates[day].map((template, index) => ({
      id: shiftId(day, index),
      label: shiftMeta[index].label,
      timeRange: shiftMeta[index].timeRange,
      capacity: template.capacity,
      assignedVolunteerIds: [...template.assigned],
    }));
    return acc;
  }, {} as VolunteerDaySchedule);
}

export function loadVolunteerSchedule(): VolunteerDaySchedule {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = buildSeedSchedule();
      saveVolunteerSchedule(seed, { notifyListeners: false });
      return seed;
    }
    return JSON.parse(raw) as VolunteerDaySchedule;
  } catch {
    const seed = buildSeedSchedule();
    saveVolunteerSchedule(seed, { notifyListeners: false });
    return seed;
  }
}

export function saveVolunteerSchedule(
  schedule: VolunteerDaySchedule,
  options?: { notifyListeners?: boolean },
) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
  if (options?.notifyListeners === false) return;
  notify(schedule);
}

export function subscribeVolunteerSchedule(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getShiftFillRatio(shift: VolunteerShift): number {
  if (shift.capacity <= 0) return 1;
  return Math.min(1, shift.assignedVolunteerIds.length / shift.capacity);
}

export function isShiftFilled(shift: VolunteerShift): boolean {
  return shift.assignedVolunteerIds.length >= shift.capacity;
}

function getVolunteersForScheduling(): Caregiver[] {
  return loadCaregivers().filter((caregiver) => caregiver.role === 'volunteer');
}

function isVolunteerAssignedOnDay(
  schedule: VolunteerDaySchedule,
  day: ScheduleWeekday,
  volunteerId: string,
  excludeShiftId?: string,
): boolean {
  return schedule[day].some(
    (shift) =>
      shift.id !== excludeShiftId && shift.assignedVolunteerIds.includes(volunteerId),
  );
}

export function suggestVolunteersForShift(
  schedule: VolunteerDaySchedule,
  day: ScheduleWeekday,
  shiftId: string,
): Caregiver[] {
  const shift = schedule[day].find((item) => item.id === shiftId);
  if (!shift) return [];

  const openings = shift.capacity - shift.assignedVolunteerIds.length;
  if (openings <= 0) return [];

  return getVolunteersForScheduling()
    .filter((volunteer) => volunteer.availabilityDays.includes(day))
    .filter((volunteer) => !shift.assignedVolunteerIds.includes(volunteer.id))
    .filter(
      (volunteer) => !isVolunteerAssignedOnDay(schedule, day, volunteer.id, shiftId),
    )
    .sort(
      (left, right) =>
        left.assignedCatIds.length - right.assignedCatIds.length ||
        left.name.localeCompare(right.name),
    )
    .slice(0, openings);
}

export interface AutoFillShiftResult {
  ok: boolean;
  assignedVolunteers: Caregiver[];
  message: string;
  schedule: VolunteerDaySchedule;
}

export function autoFillVolunteerShift(
  day: ScheduleWeekday,
  shiftId: string,
  sourceSchedule = loadVolunteerSchedule(),
): AutoFillShiftResult {
  const suggestions = suggestVolunteersForShift(sourceSchedule, day, shiftId);
  if (suggestions.length === 0) {
    return {
      ok: false,
      assignedVolunteers: [],
      message: 'No available volunteers match this shift right now.',
      schedule: sourceSchedule,
    };
  }

  const next: VolunteerDaySchedule = {
    ...sourceSchedule,
    [day]: sourceSchedule[day].map((shift) => {
      if (shift.id !== shiftId) return shift;
      return {
        ...shift,
        assignedVolunteerIds: [
          ...shift.assignedVolunteerIds,
          ...suggestions.map((volunteer) => volunteer.id),
        ],
      };
    }),
  };

  saveVolunteerSchedule(next);

  const names = suggestions.map((volunteer) => volunteer.name).join(', ');
  return {
    ok: true,
    assignedVolunteers: suggestions,
    message: `AI assigned ${names} and sent shift reminders.`,
    schedule: next,
  };
}

export function getVolunteerNamesForShift(shift: VolunteerShift): string[] {
  return shift.assignedVolunteerIds
    .map((id) => loadCaregivers().find((caregiver) => caregiver.id === id)?.name)
    .filter((name): name is string => Boolean(name));
}

// --- Volunteer day timeline (Gantt-style blocks) ---

export type VolunteerBlockType = 'on_duty' | 'break' | 'vacation' | 'field_work';

export interface VolunteerTimelineBlock {
  id: string;
  volunteerId: string;
  type: VolunteerBlockType;
  startMinutes: number;
  endMinutes: number;
  label?: string;
}

export type VolunteerDayTimeline = Record<ScheduleWeekday, VolunteerTimelineBlock[]>;

export const TIMELINE_DAY_START = 8 * 60;
export const TIMELINE_DAY_END = 20 * 60;
export const TIMELINE_RANGE_MINUTES = TIMELINE_DAY_END - TIMELINE_DAY_START;
export const TIMELINE_HOUR_MARKS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19] as const;

export const BLOCK_TYPE_META: Record<
  VolunteerBlockType,
  { label: string; bar: string; strip: string; text: string }
> = {
  on_duty: {
    label: 'On duty',
    strip: 'bg-sage-dark',
    bar: 'border-sage/30 bg-white shadow-sm',
    text: 'text-foreground',
  },
  break: {
    label: 'Break',
    strip: 'bg-amber-400',
    bar: 'border-amber-200/80 bg-amber-50/90 shadow-sm',
    text: 'text-amber-950',
  },
  vacation: {
    label: 'Vacation',
    strip: 'bg-neutral-400',
    bar: 'border-border bg-muted/60 shadow-sm',
    text: 'text-muted-foreground',
  },
  field_work: {
    label: 'Field work',
    strip: 'bg-sky',
    bar: 'border-sky/25 bg-sky/10 shadow-sm',
    text: 'text-sky-800',
  },
};

const TIMELINE_STORAGE_KEY = 'kitticare-volunteer-timeline';

type TimelineListener = (timeline: VolunteerDayTimeline) => void;
const timelineListeners = new Set<TimelineListener>();

function notifyTimeline(timeline: VolunteerDayTimeline) {
  timelineListeners.forEach((listener) => listener(timeline));
}

function at(hour: number, minute = 0) {
  return hour * 60 + minute;
}

function block(
  id: string,
  volunteerId: string,
  type: VolunteerBlockType,
  startHour: number,
  endHour: number,
  startMinute = 0,
  endMinute = 0,
  label?: string,
): VolunteerTimelineBlock {
  return {
    id,
    volunteerId,
    type,
    startMinutes: at(startHour, startMinute),
    endMinutes: at(endHour, endMinute),
    label,
  };
}

function buildSeedTimeline(): VolunteerDayTimeline {
  return {
    Mon: [
      block('mon-mw-1', 'cg-2', 'on_duty', 8, 12, 0, 0, 'Morning shelter'),
      block('mon-mw-2', 'cg-2', 'break', 12, 12, 0, 30),
      block('mon-mw-3', 'cg-2', 'on_duty', 12, 16, 30, 0, 'Afternoon shelter'),
      block('mon-mw-4', 'cg-2', 'field_work', 16, 18, 0, 0, 'Supply run'),
      block('mon-jp-1', 'cg-4', 'on_duty', 12, 16, 0, 0, 'Afternoon shelter'),
      block('mon-jp-2', 'cg-4', 'break', 16, 16, 0, 30),
      block('mon-jp-3', 'cg-4', 'on_duty', 16, 20, 30, 0, 'Evening shelter'),
      block('mon-np-1', 'cg-6', 'on_duty', 8, 12, 0, 0, 'Morning intake'),
      block('mon-sk-1', 'cg-8', 'on_duty', 17, 20, 0, 0, 'Evening shelter'),
    ],
    Tue: [
      block('tue-mw-1', 'cg-2', 'on_duty', 8, 12, 0, 0, 'Morning shelter'),
      block('tue-mw-2', 'cg-2', 'on_duty', 12, 16, 0, 0, 'Afternoon shelter'),
      block('tue-jp-1', 'cg-4', 'vacation', 8, 20, 0, 0, 'Personal leave'),
      block('tue-sk-1', 'cg-8', 'on_duty', 17, 21, 0, 0, 'Evening shelter'),
    ],
    Wed: [
      block('wed-mw-1', 'cg-2', 'field_work', 9, 11, 0, 0, 'Vet pickup'),
      block('wed-mw-2', 'cg-2', 'on_duty', 11, 14, 0, 0, 'Midday shelter'),
      block('wed-mw-3', 'cg-2', 'break', 14, 14, 30, 0),
      block('wed-mw-4', 'cg-2', 'on_duty', 14, 18, 30, 0, 'Afternoon shelter'),
      block('wed-jp-1', 'cg-4', 'on_duty', 8, 12, 0, 0, 'Morning shelter'),
      block('wed-jp-2', 'cg-4', 'break', 12, 12, 30, 0),
      block('wed-jp-3', 'cg-4', 'on_duty', 12, 20, 30, 0, 'Long shift'),
      block('wed-np-1', 'cg-6', 'on_duty', 8, 12, 0, 0, 'Morning shelter'),
      block('wed-np-2', 'cg-6', 'break', 12, 12, 30, 0),
      block('wed-np-3', 'cg-6', 'on_duty', 12, 16, 30, 0, 'Afternoon shelter'),
    ],
    Thu: [
      block('thu-mw-1', 'cg-2', 'on_duty', 8, 12, 0, 0, 'Morning shelter'),
      block('thu-mw-2', 'cg-2', 'break', 12, 12, 30, 0),
      block('thu-mw-3', 'cg-2', 'on_duty', 12, 16, 30, 0, 'Afternoon shelter'),
      block('thu-jp-1', 'cg-4', 'field_work', 10, 13, 0, 0, 'Adoption event'),
      block('thu-jp-2', 'cg-4', 'on_duty', 16, 20, 0, 0, 'Evening shelter'),
      block('thu-sk-1', 'cg-8', 'on_duty', 17, 21, 0, 0, 'Evening shelter'),
      block('thu-tb-1', 'cg-7', 'field_work', 10, 14, 0, 0, 'Weekend prep'),
    ],
    Fri: [
      block('fri-mw-1', 'cg-2', 'on_duty', 8, 12, 0, 0, 'Morning shelter'),
      block('fri-mw-2', 'cg-2', 'on_duty', 12, 16, 0, 0, 'Afternoon shelter'),
      block('fri-jp-1', 'cg-4', 'on_duty', 8, 11, 0, 0, 'Opening tasks'),
      block('fri-jp-2', 'cg-4', 'break', 11, 11, 30, 0),
      block('fri-jp-3', 'cg-4', 'field_work', 13, 15, 0, 0, 'Foster home visit'),
      block('fri-jp-4', 'cg-4', 'on_duty', 16, 20, 0, 0, 'Closing shift'),
      block('fri-np-1', 'cg-6', 'on_duty', 8, 12, 0, 0, 'Morning shelter'),
      block('fri-np-2', 'cg-6', 'field_work', 13, 15, 0, 0, 'Supply pickup'),
    ],
  };
}

export function loadVolunteerTimeline(): VolunteerDayTimeline {
  try {
    const raw = localStorage.getItem(TIMELINE_STORAGE_KEY);
    if (!raw) {
      const seed = buildSeedTimeline();
      saveVolunteerTimeline(seed, { notifyListeners: false });
      return seed;
    }
    return JSON.parse(raw) as VolunteerDayTimeline;
  } catch {
    const seed = buildSeedTimeline();
    saveVolunteerTimeline(seed, { notifyListeners: false });
    return seed;
  }
}

export function saveVolunteerTimeline(
  timeline: VolunteerDayTimeline,
  options?: { notifyListeners?: boolean },
) {
  localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(timeline));
  if (options?.notifyListeners === false) return;
  notifyTimeline(timeline);
}

export function subscribeVolunteerTimeline(listener: TimelineListener) {
  timelineListeners.add(listener);
  return () => timelineListeners.delete(listener);
}

export function formatTimelineTime(minutes: number): string {
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return minute === 0 ? `${hour12}${period}` : `${hour12}:${String(minute).padStart(2, '0')}${period}`;
}

export function formatTimelineHourLabel(hour: number): string {
  if (hour === 12) return '12p';
  if (hour > 12) return `${hour - 12}p`;
  return `${hour}a`;
}

export function getBlockLayout(entry: VolunteerTimelineBlock) {
  const start = Math.max(entry.startMinutes, TIMELINE_DAY_START);
  const end = Math.min(entry.endMinutes, TIMELINE_DAY_END);
  if (end <= start) return null;

  const left = ((start - TIMELINE_DAY_START) / TIMELINE_RANGE_MINUTES) * 100;
  const width = ((end - start) / TIMELINE_RANGE_MINUTES) * 100;
  return { left, width };
}

export function getTimelineVolunteers(): Caregiver[] {
  return getVolunteersForScheduling().sort((a, b) => a.name.localeCompare(b.name));
}

export function getVolunteerBlocksForDay(
  timeline: VolunteerDayTimeline,
  day: ScheduleWeekday,
  volunteerId: string,
): VolunteerTimelineBlock[] {
  return timeline[day]
    .filter((entry) => entry.volunteerId === volunteerId)
    .sort((a, b) => a.startMinutes - b.startMinutes);
}

const JS_DAY_TO_SCHEDULE: Record<number, ScheduleWeekday | null> = {
  0: null,
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: null,
};

export function getTodayScheduleWeekday(): ScheduleWeekday | null {
  return JS_DAY_TO_SCHEDULE[new Date().getDay()] ?? null;
}

export function getNowTimelinePercent(): number | null {
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  if (now < TIMELINE_DAY_START || now > TIMELINE_DAY_END) return null;
  return ((now - TIMELINE_DAY_START) / TIMELINE_RANGE_MINUTES) * 100;
}

export function countOpenShiftSlots(schedule: VolunteerDaySchedule, day: ScheduleWeekday): number {
  return schedule[day].reduce(
    (sum, shift) => sum + Math.max(0, shift.capacity - shift.assignedVolunteerIds.length),
    0,
  );
}

function inferVolunteerDutyWindow(volunteer: Caregiver): { startHour: number; endHour: number } {
  const text = volunteer.availability.toLowerCase();

  if (text.includes('evening') || text.includes('pm')) {
    return { startHour: 16, endHour: 20 };
  }
  if (text.includes('morning') || text.includes('am')) {
    return { startHour: 8, endHour: 12 };
  }
  if (text.includes('afternoon') || text.includes('midday')) {
    return { startHour: 12, endHour: 16 };
  }

  return { startHour: 9, endHour: 17 };
}

export function countTimelineGaps(timeline: VolunteerDayTimeline, day: ScheduleWeekday): number {
  return getVolunteersForScheduling().filter(
    (volunteer) =>
      volunteer.availabilityDays.includes(day) &&
      getVolunteerBlocksForDay(timeline, day, volunteer.id).length === 0,
  ).length;
}

export interface AutoFillTimelineResult {
  ok: boolean;
  filled: number;
  timeline: VolunteerDayTimeline;
  message: string;
}

export function autoFillTimelineGaps(
  day: ScheduleWeekday,
  sourceTimeline = loadVolunteerTimeline(),
): AutoFillTimelineResult {
  const volunteers = getVolunteersForScheduling()
    .filter(
      (volunteer) =>
        volunteer.availabilityDays.includes(day) &&
        getVolunteerBlocksForDay(sourceTimeline, day, volunteer.id).length === 0,
    )
    .sort((left, right) => left.name.localeCompare(right.name));

  if (volunteers.length === 0) {
    return {
      ok: false,
      filled: 0,
      timeline: sourceTimeline,
      message: '',
    };
  }

  const newBlocks: VolunteerTimelineBlock[] = [];

  volunteers.forEach((volunteer, index) => {
    const window = inferVolunteerDutyWindow(volunteer);
    const baseId = `${day.toLowerCase()}-${volunteer.id}-ai-${index}`;

    newBlocks.push(
      block(
        `${baseId}-duty`,
        volunteer.id,
        'on_duty',
        window.startHour,
        window.endHour,
        0,
        0,
        'Shelter duty',
      ),
    );

    if (window.endHour - window.startHour >= 4) {
      const breakHour = Math.floor((window.startHour + window.endHour) / 2);
      newBlocks.push(block(`${baseId}-break`, volunteer.id, 'break', breakHour, breakHour, 0, 30));
    }
  });

  const next: VolunteerDayTimeline = {
    ...sourceTimeline,
    [day]: [...sourceTimeline[day], ...newBlocks],
  };

  saveVolunteerTimeline(next);

  return {
    ok: true,
    filled: volunteers.length,
    timeline: next,
    message: '',
  };
}
