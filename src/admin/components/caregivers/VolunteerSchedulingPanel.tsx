import { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/admin/components/ui/avatar';
import { Button } from '@/admin/components/ui/button';
import { cn } from '@/admin/lib/utils';
import {
  autoFillTimelineGaps,
  BLOCK_TYPE_META,
  countTimelineGaps,
  formatTimelineHourLabel,
  formatTimelineTime,
  getBlockLayout,
  getNowTimelinePercent,
  getTodayScheduleWeekday,
  getTimelineVolunteers,
  getVolunteerBlocksForDay,
  loadVolunteerTimeline,
  SCHEDULE_WEEKDAYS,
  subscribeVolunteerTimeline,
  TIMELINE_HOUR_MARKS,
  type ScheduleWeekday,
  type VolunteerTimelineBlock,
} from '@/shared/volunteerSchedule';
import type { Caregiver } from '@/admin/types';

type ScheduleView = 'day' | 'week';

function TimelineBlockBar({
  entry,
  volunteer,
}: {
  entry: VolunteerTimelineBlock;
  volunteer: Caregiver;
}) {
  const layout = getBlockLayout(entry);
  if (!layout) return null;

  const meta = BLOCK_TYPE_META[entry.type];
  const showLabel = layout.width >= 12;

  return (
    <div
      className={cn(
        'absolute top-1/2 flex h-9 min-w-[2.5rem] -translate-y-1/2 items-center overflow-hidden rounded-md border',
        meta.bar,
      )}
      style={{ left: `${layout.left}%`, width: `${layout.width}%` }}
      title={`${meta.label}${entry.label ? ` · ${entry.label}` : ''} · ${formatTimelineTime(entry.startMinutes)} – ${formatTimelineTime(entry.endMinutes)}`}
    >
      <span className={cn('h-full w-1 shrink-0', meta.strip)} />
      <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
        {showLabel && (
          <span className={cn('truncate text-[11px] font-medium leading-none', meta.text)}>
            {entry.label ?? meta.label}
          </span>
        )}
      </div>
      {layout.width >= 18 && (
        <Avatar className="mr-1.5 h-6 w-6 shrink-0 border border-white/80">
          <AvatarFallback className="bg-primary/8 text-[9px] font-semibold text-primary">
            {volunteer.avatar}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

function VolunteerTimelineRow({
  volunteer,
  day,
  timeline,
  showNowMarker,
}: {
  volunteer: Caregiver;
  day: ScheduleWeekday;
  timeline: ReturnType<typeof loadVolunteerTimeline>;
  showNowMarker: boolean;
}) {
  const blocks = getVolunteerBlocksForDay(timeline, day, volunteer.id);
  const nowPercent = showNowMarker ? getNowTimelinePercent() : null;

  return (
    <div className="grid grid-cols-[9.5rem_minmax(0,1fr)] border-b border-border/70 last:border-b-0">
      <div className="flex items-center gap-2 border-r border-border/70 px-3 py-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary/8 text-[10px] font-semibold text-primary">
            {volunteer.avatar}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{volunteer.name}</p>
        </div>
      </div>

      <div className="relative min-h-[3.75rem] bg-[linear-gradient(to_right,hsl(var(--border)/0.55)_1px,transparent_1px)] bg-[size:calc(100%/12)_100%]">
        {nowPercent !== null && (
          <div
            className="pointer-events-none absolute inset-y-1 z-20 w-0.5 bg-sky"
            style={{ left: `${nowPercent}%` }}
          />
        )}
        {blocks.length === 0 ? (
          <div className="flex h-full items-center px-3">
            <span className="text-xs text-muted-foreground">No scheduled blocks</span>
          </div>
        ) : (
          blocks.map((entry) => (
            <TimelineBlockBar key={entry.id} entry={entry} volunteer={volunteer} />
          ))
        )}
      </div>
    </div>
  );
}

function WeekCell({ blocks }: { blocks: VolunteerTimelineBlock[] }) {
  if (blocks.length === 0) {
    return (
      <div className="flex min-h-[3.5rem] items-center justify-center border-l border-border/60 px-1.5">
        <span className="text-[10px] text-muted-foreground">—</span>
      </div>
    );
  }

  return (
    <div className="min-h-[3.5rem] space-y-1 border-l border-border/60 p-1.5">
      {blocks.slice(0, 2).map((entry) => {
        const meta = BLOCK_TYPE_META[entry.type];
        return (
          <div
            key={entry.id}
            className={cn(
              'flex items-center gap-1 overflow-hidden rounded-md border px-1.5 py-1',
              meta.bar,
            )}
            title={`${meta.label}${entry.label ? ` · ${entry.label}` : ''}`}
          >
            <span className={cn('h-3.5 w-1 shrink-0 rounded-full', meta.strip)} />
            <span className={cn('truncate text-[10px] font-medium', meta.text)}>
              {entry.label ?? meta.label}
            </span>
          </div>
        );
      })}
      {blocks.length > 2 && (
        <span className="block text-[10px] text-muted-foreground">+{blocks.length - 2} more</span>
      )}
    </div>
  );
}

export function VolunteerSchedulingPanel() {
  const [selectedDay, setSelectedDay] = useState<ScheduleWeekday>(
    () => getTodayScheduleWeekday() ?? 'Mon',
  );
  const [view, setView] = useState<ScheduleView>('day');
  const [timeline, setTimeline] = useState(() => loadVolunteerTimeline());
  const [autoFilling, setAutoFilling] = useState(false);

  useEffect(() => {
    const refreshTimeline = () => setTimeline(loadVolunteerTimeline());
    const unsubTimeline = subscribeVolunteerTimeline(refreshTimeline);
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'kitticare-volunteer-timeline') refreshTimeline();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsubTimeline();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const volunteers = useMemo(() => getTimelineVolunteers(), [timeline]);
  const today = getTodayScheduleWeekday();
  const openGaps = countTimelineGaps(timeline, selectedDay);
  const showNowMarker = view === 'day' && selectedDay === today;

  const handleAutoFillDay = () => {
    if (openGaps === 0) return;
    setAutoFilling(true);
    const result = autoFillTimelineGaps(selectedDay, timeline);
    setTimeline(result.timeline);
    setAutoFilling(false);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card admin-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Volunteer scheduling</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            See who is on shelter duty, on break, on vacation, or out on field work — by day and time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5 border-sky/25 bg-sky/10 text-sky hover:bg-sky/15 hover:text-sky disabled:opacity-50"
            disabled={autoFilling || openGaps === 0}
            onClick={handleAutoFillDay}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI fill gap{openGaps === 1 ? '' : 's'}
            {openGaps > 0 && ` (${openGaps})`}
          </Button>
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
            {(['day', 'week'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  view === mode
                    ? 'bg-neutral-900 text-white'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {mode === 'day' ? '1d' : '5d'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex flex-wrap gap-2">
          {SCHEDULE_WEEKDAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={cn(
                'rounded-full border px-3.5 py-1 text-sm font-medium transition-colors',
                day === today
                  ? 'border-sky/30 bg-sky/15 text-sky'
                  : selectedDay === day
                    ? 'border-sky/30 bg-sky/10 text-sky'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground',
              )}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {(Object.keys(BLOCK_TYPE_META) as Array<keyof typeof BLOCK_TYPE_META>).map((type) => {
            const meta = BLOCK_TYPE_META[type];
            return (
              <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn('h-2.5 w-2.5 rounded-sm', meta.strip)} />
                {meta.label}
              </div>
            );
          })}
        </div>
      </div>

      {view === 'day' ? (
        <div className="overflow-x-auto">
          <div className="min-w-[56rem]">
            <div className="grid grid-cols-[9.5rem_minmax(0,1fr)] border-b border-border bg-muted/20">
              <div className="border-r border-border/70 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Volunteer
              </div>
              <div className="relative grid grid-cols-12">
                {TIMELINE_HOUR_MARKS.map((hour) => (
                  <div
                    key={hour}
                    className="border-r border-border/50 px-1 py-2 text-center text-[11px] font-medium text-muted-foreground last:border-r-0"
                  >
                    {formatTimelineHourLabel(hour)}
                  </div>
                ))}
                {showNowMarker && getNowTimelinePercent() !== null && (
                  <div
                    className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-sky"
                    style={{ left: `${getNowTimelinePercent()}%` }}
                  />
                )}
              </div>
            </div>

            {volunteers.map((volunteer) => (
              <VolunteerTimelineRow
                key={volunteer.id}
                volunteer={volunteer}
                day={selectedDay}
                timeline={timeline}
                showNowMarker={showNowMarker}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[44rem]">
            <div className="grid grid-cols-[9.5rem_repeat(5,minmax(0,1fr))] border-b border-border bg-muted/20">
              <div className="border-r border-border/70 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Volunteer
              </div>
              {SCHEDULE_WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className={cn(
                    'border-r border-border/70 px-2 py-2 text-center text-xs font-semibold last:border-r-0',
                    day === today ? 'bg-sky/8 text-sky' : 'text-muted-foreground',
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {volunteers.map((volunteer) => (
              <div
                key={volunteer.id}
                className="grid grid-cols-[9.5rem_repeat(5,minmax(0,1fr))] border-b border-border/70 last:border-b-0"
              >
                <div className="flex items-center gap-2 border-r border-border/70 px-3 py-2">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-primary/8 text-[9px] font-semibold text-primary">
                      {volunteer.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm font-medium text-foreground">{volunteer.name}</span>
                </div>
                {SCHEDULE_WEEKDAYS.map((day) => (
                  <WeekCell
                    key={day}
                    blocks={getVolunteerBlocksForDay(timeline, day, volunteer.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
