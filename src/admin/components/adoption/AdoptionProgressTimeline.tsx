import { getContactSchedule } from '@/shared/adoptionContactSchedule';
import {
  getContactScheduleStatusLabel,
  getContactScheduleStatusTone,
} from '@/shared/adoptionScheduleStatus';
import { getAdoptionWorkflowStepIndex } from '@/shared/adoptionWorkflow';
import type { AdoptionApplication } from '@/admin/types';
import { cn } from '@/admin/lib/utils';
import { VolunteerFieldWorkSection } from './VolunteerFieldWorkSection';

type TimelineStepKey = 'new' | 'contact' | 'shelter_visit' | 'approved';

const TIMELINE_STEPS: {
  key: TimelineStepKey;
  label: string;
  scheduleType?: 'contact' | 'shelter_visit';
}[] = [
  { key: 'new', label: 'New' },
  { key: 'contact', label: 'Contact', scheduleType: 'contact' },
  { key: 'shelter_visit', label: 'Shelter visit', scheduleType: 'shelter_visit' },
  { key: 'approved', label: 'Approved' },
];

const REJECTED_DOT = 'border border-coral/40 bg-coral';

const TONE_TEXT = {
  neutral: 'text-muted-foreground',
  waiting: 'text-amber-700',
  success: 'text-emerald-700',
  warning: 'text-coral',
} as const;

function stepDotClass(done: boolean, current: boolean) {
  if (current) return 'border border-sky/40 bg-sky';
  if (done) return 'border border-sage-dark/30 bg-sage-dark';
  return 'border border-border/70 bg-card';
}

function scheduleSubtitle(
  app: AdoptionApplication,
  stepIndex: number,
  activeIndex: number,
  scheduleType: 'contact' | 'shelter_visit',
): string | null {
  if (app.stage === 'new' || app.stage === 'rejected') return null;

  const schedule = getContactSchedule(app.id, scheduleType);

  if (stepIndex < activeIndex) {
    if (schedule?.status === 'accepted') {
      return getContactScheduleStatusLabel(schedule);
    }
    return null;
  }

  if (stepIndex > activeIndex) return null;

  return getContactScheduleStatusLabel(schedule);
}

function scheduleTone(
  app: AdoptionApplication,
  stepIndex: number,
  activeIndex: number,
  scheduleType: 'contact' | 'shelter_visit',
) {
  if (app.stage === 'new') return 'neutral' as const;

  const schedule = getContactSchedule(app.id, scheduleType);

  if (stepIndex < activeIndex) {
    return schedule?.status === 'accepted' ? ('success' as const) : ('neutral' as const);
  }

  if (stepIndex !== activeIndex) return 'neutral' as const;

  return getContactScheduleStatusTone(schedule);
}

function ProgressHeading() {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      Adoption progress
    </h3>
  );
}

function ProgressTrack({ app }: { app: AdoptionApplication }) {
  const activeIndex = getAdoptionWorkflowStepIndex(app);
  const isRejected = app.stage === 'rejected';
  const isWithdrawn = isRejected && app.withdrawnByApplicant;
  const isClosedRejected = isRejected && !app.withdrawnByApplicant;
  const lastIndex = TIMELINE_STEPS.length - 1;
  const progressPercent = lastIndex > 0 ? (activeIndex / lastIndex) * 100 : 0;

  return (
    <div className="relative px-1 pt-0.5">
      <div
        className="pointer-events-none absolute inset-x-[10%] top-[5px] h-0.5 rounded-full bg-border"
        aria-hidden
      />
      {!isRejected && activeIndex > 0 && (
        <div
          className="pointer-events-none absolute left-[10%] top-[5px] h-0.5 rounded-full bg-sage-dark/35"
          style={{ width: `calc(80% * ${progressPercent / 100})` }}
          aria-hidden
        />
      )}
      {isClosedRejected && (
        <div
          className="pointer-events-none absolute left-[10%] top-[5px] h-0.5 w-[26%] rounded-full bg-coral/30"
          aria-hidden
        />
      )}

      <div className="relative flex w-full items-start">
        {TIMELINE_STEPS.map((step, index) => {
          const done =
            !isRejected &&
            (index < activeIndex || (app.stage === 'approved' && step.key === 'approved'));
          const current = !isRejected && !done && activeIndex === index;

          let subtitle: string | null = null;
          let tone: keyof typeof TONE_TEXT = 'neutral';

          if (isWithdrawn && index === 0) {
            subtitle = 'Withdrawn by applicant';
            tone = 'warning';
          } else if (!isRejected && step.scheduleType) {
            subtitle = scheduleSubtitle(app, index, activeIndex, step.scheduleType);
            tone = scheduleTone(app, index, activeIndex, step.scheduleType);
          }

          let dotClass = stepDotClass(done, current);
          if (isClosedRejected) {
            dotClass = REJECTED_DOT;
          } else if (isWithdrawn) {
            dotClass = index === 0 ? REJECTED_DOT : 'border border-border bg-background';
          }

          const labelClass =
            isWithdrawn && index === 0
              ? 'font-semibold text-foreground'
              : current
                ? 'font-semibold text-foreground'
                : 'font-medium text-muted-foreground';

          return (
            <div key={step.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5 px-1">
              <span className={cn('relative z-10 h-2.5 w-2.5 shrink-0 rounded-full', dotClass)} />
              <span className={cn('text-center text-[11px] leading-tight', labelClass)}>
                {step.label}
              </span>
              {subtitle && (
                <span className={cn('text-center text-[10px] leading-snug', TONE_TEXT[tone])}>
                  {subtitle}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineSection({ app }: { app: AdoptionApplication }) {
  return (
    <section className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="space-y-3">
        <ProgressHeading />
        <ProgressTrack app={app} />
        <VolunteerFieldWorkSection app={app} embedded />
      </div>
    </section>
  );
}

export function AdoptionProgressTimeline({ app }: { app: AdoptionApplication }) {
  return <TimelineSection app={app} />;
}
