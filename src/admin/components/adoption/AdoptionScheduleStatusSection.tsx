import { getContactSchedule } from '@/shared/adoptionContactSchedule';
import {
  getContactScheduleStatusLabel,
  getContactScheduleStatusTone,
} from '@/shared/adoptionScheduleStatus';
import type { AdoptionApplication } from '@/admin/types';
import { cn } from '@/admin/lib/utils';

const TONE_STYLES = {
  neutral: 'border-border bg-muted/20 text-muted-foreground',
  waiting: 'border-amber-200 bg-amber-50 text-amber-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-coral/20 bg-coral/5 text-coral',
} as const;

function ScheduleRow({
  label,
  schedule,
}: {
  label: string;
  schedule: ReturnType<typeof getContactSchedule>;
}) {
  const tone = getContactScheduleStatusTone(schedule);

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={cn(
          'rounded-lg border px-3 py-2 text-sm',
          TONE_STYLES[tone],
        )}
      >
        {getContactScheduleStatusLabel(schedule)}
        {schedule?.volunteerName && schedule.status !== 'accepted' && (
          <span className="mt-1 block text-xs opacity-80">Volunteer: {schedule.volunteerName}</span>
        )}
      </p>
    </div>
  );
}

export function AdoptionScheduleStatusSection({ app }: { app: AdoptionApplication }) {
  if (app.stage !== 'reviewing') return null;

  const contactSchedule = getContactSchedule(app.id, 'contact');
  const visitSchedule = getContactSchedule(app.id, 'shelter_visit');

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Scheduling
      </h3>
      <div className="space-y-3">
        <ScheduleRow label="Contact" schedule={contactSchedule} />
        <ScheduleRow label="Shelter visit" schedule={visitSchedule} />
      </div>
    </section>
  );
}
