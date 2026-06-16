import { useEffect, useState } from 'react';
import { Calendar, Check, Clock } from 'lucide-react';
import { Button } from '@/admin/components/ui/button';
import { Card, CardContent } from '@/admin/components/ui/card';
import { InlineDateTimePicker } from './InlineDateTimePicker';
import { useCompanion } from '../context/CompanionContext';
import {
  acceptCounterByVolunteer,
  formatContactScheduleTime,
  getContactSchedule,
  proposeVolunteerContactTime,
  subscribeContactSchedules,
  type AdoptionContactSchedule,
} from '@/shared/adoptionContactSchedule';
import type { ReviewSubstage } from '@/shared/adoptionWorkflow';

interface AdoptionContactSchedulerProps {
  applicationId: string;
  reviewSubstage: ReviewSubstage;
}

const SCHEDULER_COPY: Record<
  ReviewSubstage,
  {
    title: string;
    summary: string;
    waitingLabel: string;
    confirmedLabel: string;
    sendLabel: string;
  }
> = {
  contact: {
    title: 'Contact',
    summary: 'Propose a call time. The applicant can accept, decline, or suggest another time.',
    waitingLabel: 'Waiting for applicant',
    confirmedLabel: 'Contact time confirmed',
    sendLabel: 'Send to applicant',
  },
  shelter_visit: {
    title: 'Shelter visit',
    summary:
      'Propose a time for the applicant to visit the shelter and meet the cat in person.',
    waitingLabel: 'Waiting for applicant',
    confirmedLabel: 'Shelter visit confirmed',
    sendLabel: 'Send visit time',
  },
};

export function AdoptionContactScheduler({
  applicationId,
  reviewSubstage,
}: AdoptionContactSchedulerProps) {
  const { user } = useCompanion();
  const copy = SCHEDULER_COPY[reviewSubstage];
  const [schedule, setSchedule] = useState<AdoptionContactSchedule | null>(() =>
    getContactSchedule(applicationId, reviewSubstage),
  );
  const [scheduledAt, setScheduledAt] = useState('');

  useEffect(() => {
    const refresh = () => setSchedule(getContactSchedule(applicationId, reviewSubstage));
    refresh();
    const unsubscribe = subscribeContactSchedules(refresh);
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'kitticare-adoption-contact-schedules') refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', onStorage);
    };
  }, [applicationId, reviewSubstage]);

  const handlePropose = () => {
    if (!scheduledAt) return;
    const proposed = new Date(scheduledAt);
    if (Number.isNaN(proposed.getTime()) || proposed.getTime() <= Date.now()) return;
    proposeVolunteerContactTime({
      applicationId,
      reviewSubstage,
      volunteerId: user.id,
      volunteerName: user.name,
      scheduledAt: new Date(scheduledAt).toISOString(),
    });
    setSchedule(getContactSchedule(applicationId, reviewSubstage));
  };

  const handleAcceptCounter = () => {
    acceptCounterByVolunteer(applicationId, reviewSubstage);
    setSchedule(getContactSchedule(applicationId, reviewSubstage));
  };

  const proposedTime = scheduledAt ? new Date(scheduledAt) : null;
  const isPastProposal =
    proposedTime !== null &&
    !Number.isNaN(proposedTime.getTime()) &&
    proposedTime.getTime() <= Date.now();

  const showProposalForm =
    !schedule || schedule.status === 'declined' || schedule.status === 'counter_proposed';

  return (
    <Card className="mb-4">
      <CardContent className="p-5 space-y-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {copy.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{copy.summary}</p>
        </div>

        {schedule?.status === 'pending_adopter' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm">
            <p className="font-medium text-foreground">{copy.waitingLabel}</p>
            <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {formatContactScheduleTime(schedule.scheduledAt)}
            </p>
            {schedule.note && (
              <p className="mt-1 text-xs text-muted-foreground">{schedule.note}</p>
            )}
          </div>
        )}

        {schedule?.status === 'counter_proposed' && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm space-y-3">
            <div>
              <p className="font-medium text-foreground">Applicant suggested a new time</p>
              <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                {formatContactScheduleTime(schedule.scheduledAt)}
              </p>
            </div>
            <Button type="button" size="sm" className="w-full" onClick={handleAcceptCounter}>
              <Check className="h-4 w-4" />
              Accept this time
            </Button>
          </div>
        )}

        {schedule?.status === 'accepted' && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm">
            <p className="font-medium text-foreground">{copy.confirmedLabel}</p>
            <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              {formatContactScheduleTime(schedule.scheduledAt)}
            </p>
          </div>
        )}

        {schedule?.status === 'declined' && (
          <div className="rounded-xl border border-coral/20 bg-coral/5 px-3 py-2.5 text-sm">
            <p className="font-medium text-foreground">Applicant declined this time</p>
            <p className="mt-1 text-xs text-muted-foreground">Propose a new time below.</p>
          </div>
        )}

        {showProposalForm && schedule?.status !== 'pending_adopter' && (
          <div className="space-y-3 border-t border-border pt-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Date & time
              </p>
              <InlineDateTimePicker value={scheduledAt} onChange={setScheduledAt} />
            </div>
            <Button
              type="button"
              className="w-full"
              disabled={!scheduledAt || isPastProposal}
              onClick={handlePropose}
            >
              {copy.sendLabel}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
