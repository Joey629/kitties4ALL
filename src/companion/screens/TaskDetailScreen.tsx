import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  MapPin,
  MessageSquarePlus,
  Cat,
  Mail,
  Phone,
  User,
  Home,
  ImageIcon,
} from 'lucide-react';
import { getTask } from '../data/mock';
import { useCompanion } from '../context/CompanionContext';
import { CatAvatar } from '../components/MobileShell';
import { PickupPhotoCapture } from '../components/PickupPhotoCapture';
import { Button } from '@/admin/components/ui/button';
import { Card, CardContent } from '@/admin/components/ui/card';
import { cn } from '@/admin/lib/utils';
import { getTaskPointValue } from '@/shared/volunteerProgress';
import { loadAdoptionApplications, subscribeAdoptionApplications } from '@/shared/adoptionApplications';
import {
  getAdoptionPickupGuide,
  RECOMMENDATION_LABELS,
  getAdoptionReviewStepGuide,
  resolveAdoptionReviewSubstage,
  type VolunteerRecommendation,
} from '@/shared/adoptionReviewActivities';
import { normalizeReviewSubstage, getReviewSubstageLabel } from '@/shared/adoptionWorkflow';
import {
  formatContactScheduleTime,
  getContactSchedule,
  subscribeContactSchedules,
  type AdoptionContactSchedule,
} from '@/shared/adoptionContactSchedule';
import { updateTeamTaskDueTime } from '@/shared/teamTasks';
import { AdoptionContactScheduler } from '../components/AdoptionContactScheduler';
import { InlineDateTimePicker } from '../components/InlineDateTimePicker';
import {
  getTaskDetailSubtitle,
  getTaskDetailTitle,
  isAdoptionPickupTask,
  isAdoptionReviewTask,
  isSupplyDeliveryTask,
  isFosterCheckInTask,
} from '../lib/taskDisplay';
import {
  getPickupReferencePhoto,
  hasRequiredPickupPhotos,
  isPickupTask,
  PICKUP_PHOTO_COUNT,
} from '../lib/pickupPhotos';
import type { CareTask } from '../types';
import { TaskCompletionFeedback } from '../components/TaskCompletionFeedback';
import {
  isSupplyDeliveryComplete,
  SupplyDeliveryPanel,
} from '../components/SupplyDeliveryPanel';
import type { PointReward } from '../types';

const ASSESSMENT_RECOMMENDATIONS: VolunteerRecommendation[] = [
  'proceed',
  'concerns',
  'not_recommended',
];

function useAdoptionApplicantInfo(task: CareTask) {
  return useMemo(() => {
    if (!isAdoptionReviewTask(task) && !isAdoptionPickupTask(task)) return null;

    if (task.adoptionApplicant) {
      const application = loadAdoptionApplications().find((item) => item.id === task.applicationId);
      return {
        ...task.adoptionApplicant,
        reviewSubstage:
          application?.stage === 'reviewing'
            ? getReviewSubstageLabel(normalizeReviewSubstage(application))
            : task.adoptionApplicant.reviewSubstage,
        lifestyleProfile: application?.lifestyleProfile,
      };
    }

    if (!task.applicationId) return null;

    const application = loadAdoptionApplications().find((item) => item.id === task.applicationId);
    if (!application) return null;

    return {
      name: application.applicantName,
      email: application.email,
      phone: application.phone,
      visitAvailability: application.visitAvailability,
      catExperience: application.catExperience,
      housingType: application.housingType,
      reviewSubstage: application.stage === 'reviewing'
        ? getReviewSubstageLabel(normalizeReviewSubstage(application))
        : undefined,
      lifestyleProfile: application.lifestyleProfile,
    };
  }, [task]);
}

function housingLabel(housingType?: 'own' | 'rent') {
  if (housingType === 'own') return 'Owns home';
  if (housingType === 'rent') return 'Rents home';
  return undefined;
}

export function TaskDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, cats, completeTask, completeAdoptionReviewTask, submitPickupPhotos } = useCompanion();
  const task = tasks.find((t) => t.id === id) ?? getTask(id ?? '');
  const cat = task?.catId ? cats.find((c) => c.id === task.catId) ?? null : null;
  const applicantInfo = useAdoptionApplicantInfo(task ?? ({} as CareTask));
  const [assessmentNotes, setAssessmentNotes] = useState('');
  const [recommendation, setRecommendation] = useState<VolunteerRecommendation>('proceed');
  const [pickupTime, setPickupTime] = useState('');
  const [contactSchedule, setContactSchedule] = useState<AdoptionContactSchedule | null>(null);
  const [applicationVersion, setApplicationVersion] = useState(0);
  const [supplyChecked, setSupplyChecked] = useState<Record<string, boolean>>({});
  const [deliveryNote, setDeliveryNote] = useState('');
  const [completionOpen, setCompletionOpen] = useState(false);
  const [completionReward, setCompletionReward] = useState<PointReward | null>(null);
  const isAdoptionReview = task ? isAdoptionReviewTask(task) : false;
  const applicationId = task?.applicationId;

  useEffect(() => {
    if (!isAdoptionReview || !applicationId) {
      setContactSchedule(null);
      return;
    }

    const refresh = () => {
      const application = loadAdoptionApplications().find((item) => item.id === applicationId);
      const substage =
        application?.stage === 'reviewing'
          ? normalizeReviewSubstage(application) ?? 'contact'
          : 'contact';
      setContactSchedule(getContactSchedule(applicationId, substage));
    };
    refresh();
    const unsubscribeSchedules = subscribeContactSchedules(refresh);
    const unsubscribeApps = subscribeAdoptionApplications(() => {
      setApplicationVersion((current) => current + 1);
      refresh();
    });
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'kitticare-adoption-contact-schedules') refresh();
      if (event.key === 'kitticare-adoption-applications-v2') {
        setApplicationVersion((current) => current + 1);
        refresh();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsubscribeSchedules();
      unsubscribeApps();
      window.removeEventListener('storage', onStorage);
    };
  }, [isAdoptionReview, applicationId]);

  const adoptionApplication = useMemo(() => {
    void applicationVersion;
    if (!task || !isAdoptionReview || !task.applicationId) return undefined;
    return loadAdoptionApplications().find((item) => item.id === task.applicationId);
  }, [applicationVersion, task, isAdoptionReview]);

  if (!task) {
    return <div className="p-8 text-center text-muted-foreground">Task not found</div>;
  }

  const isAdoptionPickup = isAdoptionPickupTask(task);
  const isAdoptionTask = isAdoptionReview || isAdoptionPickup;
  const isSupplyDelivery = isSupplyDeliveryTask(task);
  const isFosterCheckIn = isFosterCheckInTask(task);
  const supplyReady = !isSupplyDelivery || isSupplyDeliveryComplete(task, supplyChecked);

  const finishWithFeedback = (reward: PointReward | null) => {
    setCompletionReward(reward);
    setCompletionOpen(true);
  };

  const handleComplete = () => {
    if (isAdoptionPickup && pickupTime) {
      updateTeamTaskDueTime(task.id, formatContactScheduleTime(new Date(pickupTime).toISOString()));
    }
    finishWithFeedback(completeTask(task.id));
  };

  const handleSubmitAssessment = () => {
    finishWithFeedback(
      completeAdoptionReviewTask(task.id, {
        notes: assessmentNotes,
        recommendation,
      }),
    );
  };

  const isRescuePickup = task.type === 'pickup' && !task.catId && !isAdoptionPickup;
  const isPickup = isPickupTask(task) && !isAdoptionPickup;
  const referencePhoto = isPickup ? getPickupReferencePhoto(task, cat) : null;
  const submissionPhotos = task.submissionPhotos ?? [];
  const canCompletePickup = !isPickup || hasRequiredPickupPhotos(task);
  const canCompleteSupply = supplyReady;
  const intakeUrl = `/companion/cats/new?fromTask=${task.id}${task.location ? `&location=${encodeURIComponent(task.location)}` : ''}`;
  const pointValue = getTaskPointValue(task);
  const reviewStepGuide = isAdoptionReview
    ? getAdoptionReviewStepGuide(resolveAdoptionReviewSubstage(adoptionApplication))
    : null;
  const reviewSubstage = resolveAdoptionReviewSubstage(adoptionApplication);
  const isSchedulingStep =
    isAdoptionReview && task.applicationId && (reviewSubstage === 'contact' || reviewSubstage === 'shelter_visit');
  const canSubmitAssessment =
    isAdoptionReview &&
    (!isSchedulingStep || contactSchedule?.status === 'accepted');

  const pickupGuide = isAdoptionPickup ? getAdoptionPickupGuide() : null;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="min-h-full">
      <div className="px-5 pt-8 pb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm mb-6 hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-start gap-4 mb-6">
          {cat ? (
            <CatAvatar photo={cat.photo} name={cat.name} size="lg" />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-accent flex items-center justify-center text-4xl border border-border">
              {task.emoji}
            </div>
          )}
          <div>
            {task.assignedBy === 'manager' && (
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-primary">From shelter</p>
            )}
            <h1 className="text-2xl font-semibold text-foreground">{getTaskDetailTitle(task)}</h1>
            {isAdoptionReview && cat && (
              <Link
                to={`/companion/cats/${cat.id}`}
                className="mt-2 inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
              >
                <Cat className="h-3 w-3" />
                {cat.name}
              </Link>
            )}
            {!isAdoptionReview && (
              <p className="text-muted-foreground">{getTaskDetailSubtitle(task)}</p>
            )}
            {task.location && !isAdoptionTask && (
              <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{task.location}</span>
              </p>
            )}
            {!isAdoptionTask && (
              <p className="text-sm text-primary font-medium mt-1">{task.dueTime}</p>
            )}
          </div>
        </div>

        {applicantInfo && (
          <Card className="mb-4">
            <CardContent className="p-5 space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Applicant
              </h2>
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <dd className="font-medium text-foreground">{applicantInfo.name}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <dd>{applicantInfo.email}</dd>
                </div>
                {applicantInfo.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <dd>{applicantInfo.phone}</dd>
                  </div>
                )}
                {housingLabel(applicantInfo.housingType) && (
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <dd>{housingLabel(applicantInfo.housingType)}</dd>
                  </div>
                )}
                {applicantInfo.catExperience && (
                  <div>
                    <dt className="text-muted-foreground">Cat experience</dt>
                    <dd className="font-medium text-foreground">{applicantInfo.catExperience}</dd>
                  </div>
                )}
                {applicantInfo.visitAvailability && (
                  <div>
                    <dt className="text-muted-foreground">Visit availability</dt>
                    <dd className="font-medium text-foreground">{applicantInfo.visitAvailability}</dd>
                  </div>
                )}
                {applicantInfo.reviewSubstage && (
                  <div>
                    <dt className="text-muted-foreground">Review step</dt>
                    <dd className="font-medium text-foreground">{applicantInfo.reviewSubstage}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        )}

        {isSchedulingStep && task.applicationId && (
          <AdoptionContactScheduler
            applicationId={task.applicationId}
            reviewSubstage={reviewSubstage}
          />
        )}

        {isAdoptionReview && reviewStepGuide && !isSchedulingStep && (
          <Card className="mb-4">
            <CardContent className="p-5 space-y-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {reviewStepGuide.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-foreground">{reviewStepGuide.summary}</p>
              </div>
              <ul className="space-y-2 text-sm text-foreground">
                {reviewStepGuide.checklist.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {isAdoptionPickup && pickupGuide && (
          <Card className="mb-4">
            <CardContent className="p-5 space-y-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {pickupGuide.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-foreground">{pickupGuide.summary}</p>
              </div>
              <ul className="space-y-2 text-sm text-foreground">
                {pickupGuide.checklist.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {!isAdoptionTask && (
        <Card className="mb-4">
          <CardContent className="p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Care instructions
            </h2>
            {isPickup && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Reference photo</p>
                {referencePhoto ? (
                  <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
                    <img
                      src={referencePhoto}
                      alt={`Reference for ${task.catName}`}
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                      Compare the cat on-site with this intake photo before transfer.
                    </p>
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/60" />
                    <p className="text-sm text-muted-foreground">
                      {isRescuePickup
                        ? 'Complete quick cat intake to add a reference photo.'
                        : 'No reference photo on file yet.'}
                    </p>
                  </div>
                )}
              </div>
            )}
            <p className="text-foreground leading-relaxed">{task.instructions}</p>
            {task.notes && (
              <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border italic">
                {task.notes}
              </p>
            )}
          </CardContent>
        </Card>
        )}

        {isPickup && task.status !== 'completed' && (
          <Card className="mb-4">
            <CardContent className="p-5">
              <PickupPhotoCapture
                photos={submissionPhotos}
                onChange={(photos) => submitPickupPhotos(task.id, photos)}
              />
            </CardContent>
          </Card>
        )}

        {isSupplyDelivery && task.status !== 'completed' && (
          <SupplyDeliveryPanel
            task={task}
            checked={supplyChecked}
            onToggle={(itemId) =>
              setSupplyChecked((prev) => ({ ...prev, [itemId]: !prev[itemId] }))
            }
            deliveryNote={deliveryNote}
            onDeliveryNoteChange={setDeliveryNote}
          />
        )}

        {isPickup && task.status === 'completed' && submissionPhotos.length > 0 && (
          <Card className="mb-4">
            <CardContent className="p-5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Submitted photos
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {submissionPhotos.map((photo) => (
                  <img
                    key={photo}
                    src={photo}
                    alt="Submitted pickup"
                    className="aspect-square rounded-xl border border-border object-cover"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {cat && !isAdoptionReview && (
          <Link
            to={`/companion/cats/${cat.id}`}
            className="block bg-accent rounded-xl p-4 mb-6 text-sm text-primary font-medium border border-border"
          >
            View {cat.name}&apos;s profile →
          </Link>
        )}

        <div className="space-y-3">
          {task.status !== 'completed' && isRescuePickup && (
            <Button asChild className="w-full h-12 rounded-xl text-base">
              <Link to={intakeUrl}>
                <Cat className="w-5 h-5" />
                Quick cat intake
              </Link>
            </Button>
          )}
          {task.status !== 'completed' && isAdoptionPickup && (
            <Card className="mb-3">
              <CardContent className="p-5 space-y-3">
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Pickup time
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Set when the adopter should pick up {task.catName}.
                  </p>
                </div>
                <InlineDateTimePicker value={pickupTime} onChange={setPickupTime} />
                {task.dueTime && (
                  <p className="text-xs text-muted-foreground">
                    Current: <span className="font-medium text-foreground">{task.dueTime}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          )}
          {task.status !== 'completed' && isAdoptionPickup && (
            <Button onClick={handleComplete} className="w-full h-12 rounded-xl text-base">
              <Check className="w-5 h-5" />
              Mark pickup complete · +{pointValue} pts
            </Button>
          )}
          {task.status !== 'completed' && isAdoptionReview && canSubmitAssessment && (
            <Card className="mb-1">
              <CardContent className="p-5 space-y-4">
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Your assessment
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Record what you found and whether this adoption should move to the next step.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Recommendation
                  </p>
                  <div className="space-y-2" role="radiogroup" aria-label="Recommendation">
                    {ASSESSMENT_RECOMMENDATIONS.map((key) => {
                      const selected = recommendation === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setRecommendation(key)}
                          className={cn(
                            'flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                            selected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/40',
                          )}
                        >
                          <span
                            className={cn(
                              'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                              selected ? 'border-primary' : 'border-muted-foreground/40',
                            )}
                            aria-hidden
                          >
                            {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                          </span>
                          <span className="text-sm text-foreground">{RECOMMENDATION_LABELS[key]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="assessment-notes"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Notes
                  </label>
                  <textarea
                    id="assessment-notes"
                    value={assessmentNotes}
                    onChange={(event) => setAssessmentNotes(event.target.value)}
                    rows={2}
                    placeholder={reviewStepGuide?.notesPlaceholder ?? 'Brief notes from this step'}
                    className="min-h-[4.5rem] w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <Button
                  onClick={handleSubmitAssessment}
                  disabled={!assessmentNotes.trim()}
                  className="w-full h-12 rounded-xl text-base"
                >
                  <Check className="w-5 h-5" />
                  Submit assessment · +{pointValue} pts
                </Button>
              </CardContent>
            </Card>
          )}
          {task.status !== 'completed' && !isAdoptionTask && (
            <Button
              onClick={handleComplete}
              variant={isRescuePickup ? 'outline' : 'default'}
              disabled={!canCompletePickup || !canCompleteSupply}
              className="w-full h-12 rounded-xl text-base"
            >
              <Check className="w-5 h-5" />
              {isPickup && !canCompletePickup
                ? `Add ${PICKUP_PHOTO_COUNT} photos to complete`
                : isSupplyDelivery && !canCompleteSupply
                  ? 'Check all items to complete delivery'
                  : `Complete task · +${pointValue} pts`}
            </Button>
          )}
          {cat && !isPickup && !isAdoptionTask && isFosterCheckIn && task.status !== 'completed' && (
            <Button asChild variant="outline" className="w-full h-12 rounded-xl text-base">
              <Link to={`/companion/cats/${cat.id}/update`}>
                <MessageSquarePlus className="w-5 h-5" />
                Submit foster check-in update
              </Link>
            </Button>
          )}
          {cat && !isPickup && !isAdoptionTask && !isFosterCheckIn && (
            <>
              <Button asChild variant="outline" className="w-full h-12 rounded-xl text-base">
                <Link to={`/companion/cats/${cat.id}/update`}>
                  <MessageSquarePlus className="w-5 h-5" />
                  Add update
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <TaskCompletionFeedback
        open={completionOpen}
        task={task}
        reward={completionReward}
        onContinue={() => {
          setCompletionOpen(false);
          navigate('/companion');
        }}
      />
    </motion.div>
  );
}
