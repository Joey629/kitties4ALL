import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, Calendar, FileText, Heart, Undo2, X } from 'lucide-react';
import { Button } from './Button';
import { modalTransition, overlayTransition } from '@/experience/motion';
import {
  ADOPTER_TRACK_STEPS,
  ADOPTER_STAGE_INFO,
  canApplicantWithdrawApplication,
  getAdopterTrackProgress,
  getApplicantWithdrawConfirmMessage,
  getApplicantWithdrawTooltip,
  getAdoptionApprovedWelcomeContent,
  getApplicationOutcomeMessage,
  getApplicationProgressLabel,
  lookupApplicationsByNameAndEmail,
} from '@/shared/adoptionStatus';
import type { AdoptionApplication } from '@/admin/types';
import { formatDate, cn } from '@/admin/lib/utils';
import {
  ADOPTION_APPLICATIONS_STORAGE_KEY,
  invalidateAdoptionApplicationsCache,
  subscribeAdoptionApplications,
  withdrawAdoptionApplication,
  dismissRejectedApplicationsForApplicant,
} from '@/shared/adoptionApplications';
import {
  acceptContactByAdopter,
  counterProposeByAdopter,
  declineContactByAdopter,
  formatContactScheduleTime,
  getContactSchedule,
  shouldShowAdopterSchedulePanel,
  subscribeContactSchedules,
  type AdoptionContactSchedule,
} from '@/shared/adoptionContactSchedule';
import type { ReviewSubstage } from '@/shared/adoptionWorkflow';
import { InlineDateTimePicker } from '@/companion/components/InlineDateTimePicker';

interface ApplicationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  initialEmail?: string;
}

const inputClass =
  'w-full px-4 py-3 rounded-xl border-2 border-warm-brown/15 bg-white/70 focus:outline-none focus:ring-2 focus:ring-sage';

function applyLookupResult(matches: AdoptionApplication[]) {
  if (matches.length === 1) {
    return { matchedApps: matches, selectedId: matches[0].id };
  }
  return { matchedApps: matches, selectedId: null as string | null };
}

export function ApplicationStatusModal({
  isOpen,
  onClose,
  initialName = '',
  initialEmail = '',
}: ApplicationStatusModalProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [matchedApps, setMatchedApps] = useState<AdoptionApplication[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const [scheduleVersion, setScheduleVersion] = useState(0);

  const selectedApp = matchedApps.find((app) => app.id === selectedId) ?? null;
  const showLookupForm = matchedApps.length === 0;
  const showPicker = matchedApps.length > 1 && !selectedApp;
  const showBackToList = matchedApps.length > 1 && !!selectedApp;

  useEffect(() => {
    if (!isOpen) return;
    setName(initialName);
    setEmail(initialEmail);
    setMatchedApps([]);
    setSelectedId(null);
    setError(null);

    const trimmedName = initialName.trim();
    const trimmedEmail = initialEmail.trim();
    if (!trimmedName || !trimmedEmail) return;

    const matches = lookupApplicationsByNameAndEmail(trimmedName, trimmedEmail);
    if (matches.length === 0) {
      setError('No adoption found for this name and email. Please check and try again.');
      return;
    }
    const next = applyLookupResult(matches);
    setMatchedApps(next.matchedApps);
    setSelectedId(next.selectedId);
  }, [isOpen, initialName, initialEmail]);

  useEffect(() => {
    const unsubscribe = subscribeAdoptionApplications(() => {
      setVersion((current) => current + 1);
    });
    const onStorage = (event: StorageEvent) => {
      if (event.key === ADOPTION_APPLICATIONS_STORAGE_KEY) {
        invalidateAdoptionApplicationsCache();
        setVersion((current) => current + 1);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeContactSchedules(() => {
      setScheduleVersion((current) => current + 1);
    });
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'kitticare-adoption-contact-schedules') {
        setScheduleVersion((current) => current + 1);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    invalidateAdoptionApplicationsCache();
    setVersion((current) => current + 1);
    setScheduleVersion((current) => current + 1);
  }, [isOpen]);

  useEffect(() => {
    if (matchedApps.length === 0) return;
    const refreshed = lookupApplicationsByNameAndEmail(name.trim(), email.trim());
    if (refreshed.length === 0) return;
    setMatchedApps(refreshed);
    setSelectedId((current) => {
      if (current && refreshed.some((app) => app.id === current)) return current;
      return refreshed.length === 1 ? refreshed[0].id : null;
    });
  }, [version, name, email]);

  const handleLookup = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Please enter the name you used on your adoption request.');
      return;
    }
    if (!trimmedEmail) {
      setError('Please enter the email you used on your adoption request.');
      return;
    }

    const matches = lookupApplicationsByNameAndEmail(trimmedName, trimmedEmail);
    if (matches.length === 0) {
      setError('No adoption found for this name and email. Please check and try again.');
      setMatchedApps([]);
      setSelectedId(null);
      return;
    }

    const next = applyLookupResult(matches);
    setMatchedApps(next.matchedApps);
    setSelectedId(next.selectedId);
  };

  const handleWithdraw = () => {
    if (!selectedApp) return;
    const outcome = withdrawAdoptionApplication(selectedApp.id, name.trim(), email.trim());
    if (!outcome.ok) {
      setError('Could not withdraw this adoption.');
      return;
    }
    setError(null);
  };

  const refreshMatches = () => {
    const refreshed = lookupApplicationsByNameAndEmail(name.trim(), email.trim());
    if (refreshed.length === 0) {
      setMatchedApps([]);
      setSelectedId(null);
      setError('No adoptions found for this name and email.');
      return;
    }
    const next = applyLookupResult(refreshed);
    setMatchedApps(next.matchedApps);
    setSelectedId(next.selectedId);
    setError(null);
  };

  const handleDismissRejected = () => {
    const rejectedCount = matchedApps.filter((app) => app.stage === 'rejected').length;
    if (rejectedCount === 0) return;
    if (
      !window.confirm(
        `Remove ${rejectedCount} not approved adoption${rejectedCount === 1 ? '' : 's'} from your list?`,
      )
    ) {
      return;
    }
    dismissRejectedApplicationsForApplicant(name.trim(), email.trim());
    refreshMatches();
  };

  const rejectedCount = matchedApps.filter((app) => app.stage === 'rejected').length;

  const progress = selectedApp ? getAdopterTrackProgress(selectedApp.stage, selectedApp) : null;
  const outcomeMessage = selectedApp ? getApplicationOutcomeMessage(selectedApp) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
            className="fixed inset-0 z-[220] bg-warm-brown/25 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={modalTransition}
            className="fixed inset-0 z-[230] flex items-center justify-center p-6 pointer-events-none"
            role="dialog"
            aria-label="My adoptions"
          >
            <div
              className="experience-story-panel relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-warm-brown/10 p-8 shadow-2xl pointer-events-auto"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute top-5 right-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border-2 border-warm-brown/10 bg-white text-warm-brown/60 transition-colors hover:bg-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-5 pr-10">
                <div className="flex items-center gap-2">
                  {showBackToList && (
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-warm-brown/10 text-warm-brown/70 transition-colors hover:bg-white"
                      aria-label="Back to my adoptions"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}
                  <h2 className="font-display text-2xl font-bold text-warm-brown">My adoptions</h2>
                </div>
                {showLookupForm && (
                  <p className="mt-2 text-sm leading-relaxed text-charcoal/70">
                    Enter the name and email from your adoption request to see your progress.
                  </p>
                )}
              </div>

              {showLookupForm && (
                <form className="mt-5 space-y-3" onSubmit={handleLookup}>
                  <input
                    type="text"
                    placeholder="Your name"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="email"
                    placeholder="Email address"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={inputClass}
                  />
                  {error && (
                    <p className="rounded-xl border border-coral/20 bg-coral/5 px-3 py-2 text-sm text-coral">
                      {error}
                    </p>
                  )}
                  <Button type="submit" variant="coral" className="w-full">
                    Find my adoption
                  </Button>
                </form>
              )}

              {showPicker && (
                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/45">
                      Multiple adoptions found
                    </p>
                    {rejectedCount > 0 && (
                      <button
                        type="button"
                        onClick={handleDismissRejected}
                        className="shrink-0 text-xs font-semibold text-coral transition-colors hover:text-coral/80"
                      >
                        Remove all not approved
                      </button>
                    )}
                  </div>
                  {matchedApps.map((app) => (
                    <ApplicationPickerCard
                      key={app.id}
                      app={app}
                      onSelect={() => {
                        setSelectedId(app.id);
                        setError(null);
                      }}
                    />
                  ))}
                </div>
              )}

              {selectedApp && progress && (
                <motion.div
                  key={selectedApp.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 space-y-4"
                >
                  <div className="border-t border-warm-brown/10 pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-warm-brown">
                          Adoption for {selectedApp.catName}
                        </p>
                        <p className="mt-1 text-xs text-charcoal/50">
                          Submitted {formatDate(selectedApp.submittedDate)}
                        </p>
                      </div>
                      {canApplicantWithdrawApplication(selectedApp) && (
                        <WithdrawButton
                          confirmMessage={getApplicantWithdrawConfirmMessage(selectedApp)}
                          tooltip={getApplicantWithdrawTooltip(selectedApp)}
                          onConfirm={handleWithdraw}
                        />
                      )}
                    </div>
                  </div>

                  {!progress.rejected && selectedApp.stage !== 'approved' && (
                    <AdopterStageInfo app={selectedApp} />
                  )}

                  <TrackStepList
                    application={selectedApp}
                    activeIndex={progress.activeIndex}
                    rejected={progress.rejected}
                    outcomeMessage={outcomeMessage}
                    scheduleVersion={scheduleVersion}
                  />
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ApplicationStatusBadge({ app }: { app: AdoptionApplication }) {
  const progress = getAdopterTrackProgress(app.stage, app);
  const label = getApplicationProgressLabel(app);
  const isRejected = progress.rejected;

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium">
      <span
        className={cn('h-2 w-2 rounded-full', isRejected ? 'bg-coral' : 'bg-sage')}
        aria-hidden
      />
      <span className={isRejected ? 'text-coral' : 'text-sage-dark'}>{label}</span>
    </span>
  );
}

function ApplicationPickerCard({
  app,
  onSelect,
}: {
  app: AdoptionApplication;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-warm-brown/12 bg-white/80 px-4 py-3 text-left transition-colors hover:border-sage/30"
    >
      <div className="min-w-0">
        <p className="font-semibold text-warm-brown">{app.catName}</p>
        <p className="text-xs text-charcoal/50">{formatDate(app.submittedDate)}</p>
      </div>
      <ApplicationStatusBadge app={app} />
    </button>
  );
}

function WithdrawButton({
  confirmMessage,
  onConfirm,
  tooltip = 'Cancel this adoption',
}: {
  confirmMessage: string;
  onConfirm: () => void;
  tooltip?: string;
}) {
  return (
    <div className="group relative shrink-0">
      <button
        type="button"
        onClick={() => {
          if (window.confirm(confirmMessage)) {
            onConfirm();
          }
        }}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-charcoal/45 transition-colors hover:bg-coral/8 hover:text-coral"
        aria-label="Withdraw adoption"
      >
        <Undo2 className="h-3 w-3" />
        Withdraw
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-10 mt-1 hidden w-max max-w-[11rem] rounded-md bg-charcoal px-2 py-1 text-center text-[10px] leading-snug text-white shadow-sm group-hover:block"
      >
        {tooltip}
      </span>
    </div>
  );
}

function AdopterStageInfo({ app }: { app: AdoptionApplication }) {
  const info =
    app.stage === 'reviewing'
      ? ADOPTER_STAGE_INFO.reviewing
      : ADOPTER_STAGE_INFO[app.stage];

  return (
    <div className="rounded-xl border border-warm-brown/12 bg-white/70 px-4 py-3">
      <p className="text-sm leading-relaxed text-charcoal/75">{info.message}</p>
      <p className="mt-2 text-xs leading-relaxed text-charcoal/55">{info.nextStep}</p>
    </div>
  );
}

function TrackStepList({
  application,
  activeIndex,
  rejected,
  outcomeMessage,
  scheduleVersion,
}: {
  application: AdoptionApplication;
  activeIndex: number;
  rejected: boolean;
  outcomeMessage: string | null;
  scheduleVersion: number;
}) {
  void scheduleVersion;

  const isApproved = application.stage === 'approved';

  return (
    <ul className="space-y-3">
      {ADOPTER_TRACK_STEPS.map((step, index) => {
        const isApprovedStep = index === ADOPTER_TRACK_STEPS.length - 1;
        const failed = rejected && isApprovedStep;
        const done = !failed && (index < activeIndex || (isApprovedStep && isApproved));
        const current = !rejected && index === activeIndex && !(isApprovedStep && isApproved);
        const showContactPanel =
          !rejected &&
          step.key === 'contact' &&
          shouldShowAdopterSchedulePanel(application.id, 'contact', current);
        const showShelterVisitPanel =
          !rejected &&
          step.key === 'shelter_visit' &&
          shouldShowAdopterSchedulePanel(application.id, 'shelter_visit', current);

        return (
          <li key={step.key}>
            <div className="flex items-center gap-3">
              {failed ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-coral text-sm font-bold text-white">
                  ✕
                </span>
              ) : done ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              ) : (
                <span
                  className={cn(
                    'h-3 w-3 rounded-full',
                    current ? 'bg-sage ring-4 ring-sage/20' : 'border-2 border-warm-brown/20 bg-white',
                  )}
                />
              )}
              <span
                className={cn(
                  'text-sm',
                  failed
                    ? 'font-semibold text-coral'
                    : current
                      ? 'font-semibold text-warm-brown'
                      : done
                        ? 'text-charcoal/70'
                        : 'text-charcoal/40',
                )}
              >
                {step.label}
              </span>
            </div>
            {showContactPanel && (
              <ContactScheduleAdopterPanel
                key={`${scheduleVersion}-contact`}
                applicationId={application.id}
                reviewSubstage="contact"
              />
            )}
            {showShelterVisitPanel && (
              <ContactScheduleAdopterPanel
                key={`${scheduleVersion}-shelter_visit`}
                applicationId={application.id}
                reviewSubstage="shelter_visit"
              />
            )}
            {failed && outcomeMessage && (
              <p className="mt-2 ml-8 rounded-xl border border-coral/20 bg-coral/5 px-3 py-2 text-sm leading-relaxed text-charcoal/70">
                {outcomeMessage}
              </p>
            )}
            {isApprovedStep && isApproved && <AdoptionApprovedWelcome app={application} />}
          </li>
        );
      })}
    </ul>
  );
}

function AdoptionApprovedWelcome({ app }: { app: AdoptionApplication }) {
  const content = getAdoptionApprovedWelcomeContent(app);

  return (
    <div className="mt-2 ml-8 space-y-3 rounded-xl border border-sage/20 bg-sage/5 p-4">
      <div className="flex items-center gap-2">
        <Heart className="h-5 w-5 shrink-0 text-sage-dark" aria-hidden />
        <h3 className="font-display text-lg font-bold text-warm-brown">{content.headline}</h3>
      </div>
      <p className="text-sm leading-relaxed text-charcoal/75">{content.approvalMessage}</p>
      <ul className="space-y-2.5">
        <li className="flex items-start gap-3">
          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-charcoal/45" aria-hidden />
          <p className="text-sm leading-relaxed text-charcoal/75">{content.pickupTime}</p>
        </li>
        <li className="flex items-start gap-3">
          <Heart className="mt-0.5 h-4 w-4 shrink-0 text-charcoal/45" aria-hidden />
          <p className="text-sm leading-relaxed text-charcoal/75">{content.precautions}</p>
        </li>
        <li className="flex items-start gap-3">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-charcoal/45" aria-hidden />
          <p className="text-sm leading-relaxed text-charcoal/75">{content.agreementNote}</p>
        </li>
      </ul>
    </div>
  );
}

function isPastCounterTime(value: string) {
  if (!value) return true;
  const proposed = new Date(value);
  return Number.isNaN(proposed.getTime()) || proposed.getTime() <= Date.now();
}

const ADOPTER_SCHEDULE_COPY: Record<
  ReviewSubstage,
  {
    empty: string;
    requestFrom: string;
    confirmed: string;
    proposed: string;
    declined: string;
  }
> = {
  contact: {
    empty: 'Your adoption coordinator will send a contact time request here.',
    requestFrom: 'Contact request from',
    confirmed: 'Contact confirmed for',
    proposed: 'You proposed',
    declined: 'You declined the proposed contact time.',
  },
  shelter_visit: {
    empty: 'Your adoption coordinator will send a shelter visit time here.',
    requestFrom: 'Shelter visit request from',
    confirmed: 'Shelter visit confirmed for',
    proposed: 'You proposed',
    declined: 'You declined the proposed visit time.',
  },
};

function ContactScheduleAdopterPanel({
  applicationId,
  reviewSubstage,
}: {
  applicationId: string;
  reviewSubstage: ReviewSubstage;
}) {
  const copy = ADOPTER_SCHEDULE_COPY[reviewSubstage];
  const [schedule, setSchedule] = useState<AdoptionContactSchedule | null>(() =>
    getContactSchedule(applicationId, reviewSubstage),
  );
  const [counterTime, setCounterTime] = useState('');
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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

  const resetActionState = () => {
    setActionError(null);
    setShowCounterForm(false);
    setCounterTime('');
  };

  const handleAccept = () => {
    if (!acceptContactByAdopter(applicationId, reviewSubstage)) {
      setActionError('Could not accept this time. Please try again.');
      return;
    }
    resetActionState();
    setSchedule(getContactSchedule(applicationId, reviewSubstage));
  };

  const handleDecline = () => {
    if (!declineContactByAdopter(applicationId, reviewSubstage)) {
      setActionError('Could not decline this time. Please try again.');
      return;
    }
    resetActionState();
    setSchedule(getContactSchedule(applicationId, reviewSubstage));
  };

  const handleCounter = () => {
    if (!counterTime) return;
    if (
      !counterProposeByAdopter({
        applicationId,
        reviewSubstage,
        scheduledAt: new Date(counterTime).toISOString(),
      })
    ) {
      setActionError('Could not send your proposed time. Please try again.');
      return;
    }
    resetActionState();
    setSchedule(getContactSchedule(applicationId, reviewSubstage));
  };

  if (!schedule) {
    return (
      <p className="mt-2 ml-8 text-xs leading-relaxed text-charcoal/55">
        {copy.empty}
      </p>
    );
  }

  return (
    <div className="mt-2 ml-8 space-y-3 rounded-xl border border-warm-brown/12 bg-white/70 p-3">
      {schedule.status === 'pending_adopter' && (
        <>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/45">
              {copy.requestFrom} {schedule.volunteerName}
            </p>
            <p className="mt-1 text-sm font-medium text-warm-brown">
              {formatContactScheduleTime(schedule.scheduledAt)}
            </p>
            {schedule.note && (
              <p className="mt-1 text-xs leading-relaxed text-charcoal/65">{schedule.note}</p>
            )}
          </div>
          {!showCounterForm ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleAccept}
                className="rounded-md bg-coral px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-coral/90"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={handleDecline}
                className="rounded-md border border-warm-brown/15 bg-white px-2.5 py-1 text-xs font-semibold text-warm-brown transition-colors hover:bg-cream-dark"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => setShowCounterForm(true)}
                className="rounded-md border border-warm-brown/15 bg-white px-2.5 py-1 text-xs font-semibold text-warm-brown transition-colors hover:bg-cream-dark"
              >
                Propose new time
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <InlineDateTimePicker value={counterTime} onChange={setCounterTime} />
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  disabled={!counterTime || isPastCounterTime(counterTime)}
                  onClick={handleCounter}
                  className="rounded-md bg-coral px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-coral/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send new time
                </button>
                <button
                  type="button"
                  onClick={() => setShowCounterForm(false)}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-charcoal/55 transition-colors hover:text-warm-brown"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {schedule.status === 'counter_proposed' && (
        <p className="text-sm text-charcoal/70">
          You proposed{' '}
          <span className="font-medium text-warm-brown">
            {formatContactScheduleTime(schedule.scheduledAt)}
          </span>
          . Waiting for {schedule.volunteerName} to confirm.
        </p>
      )}

      {schedule.status === 'accepted' && (
        <p className="text-sm text-charcoal/70">
          {copy.confirmed}{' '}
          <span className="font-medium text-sage-dark">
            {formatContactScheduleTime(schedule.scheduledAt)}
          </span>
          .
        </p>
      )}

      {schedule.status === 'declined' && (
        <p className="text-sm text-charcoal/70">
          {copy.declined} {schedule.volunteerName} may send a new request.
        </p>
      )}

      {actionError && (
        <p className="text-xs text-coral">{actionError}</p>
      )}
    </div>
  );
}
