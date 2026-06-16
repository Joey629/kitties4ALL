import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Cat, Check, CheckCircle2, ClipboardList, Mail, Phone, Sparkles, TriangleAlert, User, X } from 'lucide-react';
import { PageHeader } from '@/admin/components/shared/PageHeader';
import { Badge, badgeVariants } from '@/admin/components/ui/badge';
import { Button } from '@/admin/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/admin/components/ui/tabs';
import { formatDate, cn } from '@/admin/lib/utils';
import {
  getAdvanceBlockReason,
  getCurrentReviewSubstage,
  getOrderedAssessments,
  getScheduleBlockReason,
  hasAssessmentForCurrentStep,
  RECOMMENDATION_LABELS,
  RECOMMENDATION_STYLES,
} from '@/shared/adoptionReviewActivities';
import { generateAdoptionAiAssessment } from '@/shared/adoptionMatch';
import type { AdoptionApplication } from '@/admin/types';
import {
  ADOPTION_STAGES,
  ADOPTION_PRIMARY_ACTION_CLASS,
  getAssignableCaregiversList,
  issueKey,
} from './constants';
import {
  getNextWorkflowAction,
  getReviewSubstageLabel,
  normalizeReviewSubstage,
} from '@/shared/adoptionWorkflow';
import { AdoptionProgressTimeline } from './AdoptionProgressTimeline';

interface AdoptionApplicationDetailProps {
  app: AdoptionApplication;
  onAssign: (
    appId: string,
    caregiverId: string,
    options?: { moveToReviewing?: boolean },
  ) => AdoptionApplication | null;
  onUnassign: (appId: string) => void;
  onReject: (appId: string) => void;
  onAdvance: (appId: string) => void;
  layout?: 'drawer' | 'page';
  assignPickerOpen?: boolean;
  onAssignPickerOpenChange?: (open: boolean) => void;
  pageHeader?: {
    title: string;
    description?: string;
    actions?: ReactNode;
    advanceBlockReason?: string | null;
  };
}

function getFooterAdvanceBlockReason(app: AdoptionApplication): string | null {
  const reason = getAdvanceBlockReason(app);
  if (!reason) return null;
  const scheduleBlock = getScheduleBlockReason(app);
  if (scheduleBlock && reason === scheduleBlock) return null;
  return reason;
}

function VolunteerAssessmentsSection({ app }: { app: AdoptionApplication }) {
  const assessments = getOrderedAssessments(app);
  const currentSubstage = getCurrentReviewSubstage(app);
  const awaitingAssessment = app.stage === 'reviewing' && !hasAssessmentForCurrentStep(app);

  if (assessments.length === 0 && !awaitingAssessment) return null;

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Volunteer assessments
      </h3>
      {awaitingAssessment && currentSubstage && (
        <div className="rounded-lg border border-sky/20 bg-sky/5 px-3 py-2.5 text-sm text-foreground">
          <p className="font-medium text-sky-700">Waiting for volunteer review</p>
        </div>
      )}
      {assessments.map((assessment) => {
        const styles = RECOMMENDATION_STYLES[assessment.recommendation];
        return (
          <div
            key={assessment.type}
            className="rounded-lg border border-border bg-muted/20 p-3 text-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                {getReviewSubstageLabel(assessment.type)}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                  styles.badge,
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', styles.dot)} />
                {RECOMMENDATION_LABELS[assessment.recommendation]}
              </span>
            </div>
            <p className="mt-2 leading-relaxed text-foreground">{assessment.notes}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {assessment.assigneeName} · {formatDate(assessment.completedAt.slice(0, 10))}
            </p>
          </div>
        );
      })}
    </section>
  );
}

function AssignNoticeBanner({
  assigneeName,
  onDismiss,
}: {
  assigneeName: string;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5"
    >
      <div className="flex items-start gap-2">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-foreground">
          Assignment complete. <span className="font-semibold">{assigneeName}</span> will see this
          adoption review task.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-emerald-100"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

const assignNoticeByApp = new Map<string, string>();
const dismissedAssignNoticeApps = new Set<string>();

function getAssignNotice(appId: string) {
  if (dismissedAssignNoticeApps.has(appId)) return null;
  return assignNoticeByApp.get(appId) ?? null;
}

function persistAssignNotice(appId: string, assigneeName: string) {
  assignNoticeByApp.set(appId, assigneeName);
  dismissedAssignNoticeApps.delete(appId);
}

function dismissAssignNotice(appId: string) {
  dismissedAssignNoticeApps.add(appId);
  assignNoticeByApp.delete(appId);
}

export function AdoptionApplicationDetail({
  app,
  onAssign,
  onUnassign,
  onReject,
  onAdvance,
  layout = 'drawer',
  assignPickerOpen,
  onAssignPickerOpenChange,
  pageHeader,
}: AdoptionApplicationDetailProps) {
  const stage = ADOPTION_STAGES.find((item) => item.key === app.stage)!;
  const reviewSubstage = normalizeReviewSubstage(app);
  const nextAction = getNextWorkflowAction(app);
  const advanceBlockReason = getFooterAdvanceBlockReason(app);
  const isAdvanceBlocked = Boolean(getAdvanceBlockReason(app));
  const assignableCaregivers = useMemo(() => getAssignableCaregiversList(), []);
  const assignSectionRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [internalPickingAssignee, setInternalPickingAssignee] = useState(false);
  const [assignNotice, setAssignNotice] = useState(() => getAssignNotice(app.id));
  const [assigneeId, setAssigneeId] = useState(
    app.interviewerId ?? assignableCaregivers[0]?.id ?? '',
  );
  const isPage = layout === 'page';
  const pickingAssignee = onAssignPickerOpenChange ? (assignPickerOpen ?? false) : internalPickingAssignee;
  const setPickingAssignee = (open: boolean) => {
    if (onAssignPickerOpenChange) onAssignPickerOpenChange(open);
    else setInternalPickingAssignee(open);
  };
  const aiAssessment = useMemo(() => generateAdoptionAiAssessment(app), [app]);

  const openAssignPicker = () => {
    setActiveTab('details');
    setPickingAssignee(true);
    requestAnimationFrame(() => {
      assignSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  useEffect(() => {
    setAssigneeId(app.interviewerId ?? assignableCaregivers[0]?.id ?? '');
    setPickingAssignee(false);
    setActiveTab('details');
    setAssignNotice(getAssignNotice(app.id));
  }, [app.id, app.interviewerId, app.stage, assignableCaregivers]);

  const handleAssign = () => {
    if (!assigneeId) return;
    if (app.interviewerId === assigneeId && app.stage !== 'new') {
      setPickingAssignee(false);
      return;
    }
    const caregiver = assignableCaregivers.find((item) => item.id === assigneeId);
    const updated = onAssign(app.id, assigneeId, {
      moveToReviewing: app.stage === 'new',
    });
    setPickingAssignee(false);
    if (updated && caregiver) {
      persistAssignNotice(app.id, caregiver.name);
      setAssignNotice(caregiver.name);
    }
  };

  const handleDismissAssignNotice = () => {
    dismissAssignNotice(app.id);
    setAssignNotice(null);
  };

  const handleUnassign = () => {
    if (!app.interviewerId) return;
    onUnassign(app.id);
    setPickingAssignee(false);
    dismissAssignNotice(app.id);
    setAssignNotice(null);
  };

  const showAssignVolunteerAlert =
    !app.interviewerId && app.stage !== 'rejected' && app.stage !== 'approved';

  const assignVolunteerAlert = showAssignVolunteerAlert ? (
    <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
      <span>Assign a volunteer to move this adoption to the contact step.</span>
    </p>
  ) : null;

  const statusBadges = (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline" className="gap-1">
        <span className={cn('h-2 w-2 rounded-full', stage.dot)} />
        {stage.label}
      </Badge>
      {reviewSubstage && (
        <Badge variant="secondary" className="text-[11px]">
          {getReviewSubstageLabel(reviewSubstage)}
        </Badge>
      )}
      <Link
        to={`/admin/cats/${app.catId}`}
        className={cn(
          badgeVariants({ variant: 'default' }),
          'gap-1 transition-colors hover:bg-primary/15',
        )}
      >
        <Cat className="h-3 w-3" />
        {app.catName}
      </Link>
    </div>
  );

  const contactContent = (
    <dl className="space-y-2.5 text-sm">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground">
          <User className="h-4 w-4" />
        </span>
        <dd className="m-0 min-w-0 font-medium text-foreground">{app.applicantName}</dd>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground">
          <Mail className="h-4 w-4" />
        </span>
        <dd className="m-0 min-w-0 truncate">{app.email}</dd>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground">
          <Phone className="h-4 w-4" />
        </span>
        <dd className={cn('m-0 min-w-0', !app.phone && 'italic text-muted-foreground')}>
          {app.phone ?? 'Not provided'}
        </dd>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground">
          <Calendar className="h-4 w-4" />
        </span>
        <dd className="m-0 min-w-0">Submitted {formatDate(app.submittedDate)}</dd>
      </div>
      <div
        ref={assignSectionRef}
        className={cn(
          'flex min-w-0 gap-2.5',
          pickingAssignee || showAssignVolunteerAlert ? 'items-start' : 'items-center',
        )}
      >
        <span
          className={cn(
            'inline-flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground',
            pickingAssignee && 'mt-2',
          )}
        >
          <User className="h-4 w-4" />
        </span>
        <dt className="sr-only">Assigned reviewer</dt>
        {pickingAssignee ? (
          <dd className="m-0 min-w-0 flex-1">
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <select
                  value={assigneeId}
                  onChange={(event) => setAssigneeId(event.target.value)}
                  className="h-8 min-w-0 flex-1 rounded-md border border-border bg-card px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {assignableCaregivers.map((caregiver) => (
                    <option key={caregiver.id} value={caregiver.id}>
                      {caregiver.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleAssign}
                  disabled={!assigneeId}
                  aria-label="Confirm assignment"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
              {assignVolunteerAlert}
            </div>
          </dd>
        ) : app.interviewerId ? (
          <dd className="m-0 flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <span className="text-sm font-medium leading-none text-foreground">{app.interviewer}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={openAssignPicker}
            >
              Change
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={handleUnassign}
              aria-label="Remove assignment"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </dd>
        ) : (
          <dd className="m-0 min-w-0 flex-1">
            <div className="flex min-w-0 flex-col gap-1.5">
              <button
                type="button"
                onClick={openAssignPicker}
                className="text-left text-sm font-medium leading-none text-primary underline-offset-2 hover:underline"
              >
                Unassigned
              </button>
              {assignVolunteerAlert}
            </div>
          </dd>
        )}
      </div>
    </dl>
  );

  const aiAssessmentSection = (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        AI assessment
      </h3>
      <div className="space-y-3 rounded-lg border border-sky/20 bg-sky/5 p-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-sky/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
            <Sparkles className="h-3 w-3" />
            AI
          </span>
          <span className="text-lg font-bold text-foreground">{aiAssessment.score}% match</span>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Match summary
          </h4>
          <p className="mt-1.5 text-sm font-medium leading-relaxed text-foreground">
            {aiAssessment.matchSummary}
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Risk points
          </h4>
          <ul className="mt-1.5 space-y-1.5 text-sm text-foreground">
            {aiAssessment.riskPoints.map((point) => (
              <li key={point} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-soft-orange" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Suggested next steps
          </h4>
          <ul className="mt-1.5 space-y-1.5 text-sm text-foreground">
            {aiAssessment.suggestedNextSteps.map((step) => (
              <li key={step} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-dark" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );

  const assessmentsTabContent = (
    <>
      {aiAssessmentSection}
      <VolunteerAssessmentsSection app={app} />
    </>
  );

  const detailsTabContent = (
    <>
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Adoption details
        </h3>
        {contactContent}
      </section>

      <AdoptionProgressTimeline app={app} />

      {app.stage === 'rejected' && app.rejectionReason && !app.withdrawnByApplicant && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Rejection reason
          </h3>
          <p className="rounded-lg border border-coral/20 bg-coral/5 p-3 text-sm leading-relaxed text-foreground">
            {app.rejectionReason}
          </p>
        </section>
      )}
    </>
  );

  const detailTabs = (
    <Tabs
      key={app.id}
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex flex-col"
    >
      <TabsList className="h-9 w-full shrink-0">
        <TabsTrigger value="details" className="flex-1 text-xs">
          Details
        </TabsTrigger>
        <TabsTrigger value="assessment" className="flex-1 text-xs">
          Assessments
        </TabsTrigger>
      </TabsList>
      <div className={isPage ? 'mt-4' : 'mt-3'}>
        <TabsContent value="details" className="mt-0 space-y-4">
          {detailsTabContent}
        </TabsContent>
        <TabsContent value="assessment" className="mt-0 space-y-4">
          {assessmentsTabContent}
        </TabsContent>
      </div>
    </Tabs>
  );

  const footer = (() => {
    const showReject = app.stage !== 'rejected' && app.stage !== 'approved';
    const showAssign = !app.interviewerId && showReject;
    const showFooterReject = showReject && !isPage;
    const showFooterAssign = showAssign && !isPage;
    const showFooterNextAction = nextAction && !isPage;
    if (!showFooterReject && !showFooterAssign && !showFooterNextAction) return null;

    return (
      <div className={cn('shrink-0', isPage ? 'space-y-2 pt-4' : 'border-t border-border p-4 space-y-2')}>
        {advanceBlockReason && nextAction && (
          <p className="text-xs leading-relaxed text-muted-foreground">{advanceBlockReason}</p>
        )}
        <div className="flex gap-2">
          {showFooterReject && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-coral/30 text-coral hover:bg-coral/5"
              onClick={() => onReject(app.id)}
            >
              Reject
            </Button>
          )}
          {showFooterAssign && (
            <Button
              size="sm"
              className={cn('flex-1', ADOPTION_PRIMARY_ACTION_CLASS)}
              onClick={openAssignPicker}
            >
              Assign
            </Button>
          )}
          {showFooterNextAction && (
            <Button
              size="sm"
              className={cn(
                showFooterReject || showFooterAssign ? 'flex-1' : 'w-full',
                ADOPTION_PRIMARY_ACTION_CLASS,
              )}
              disabled={isAdvanceBlocked}
              onClick={() => onAdvance(app.id)}
            >
              {nextAction.label}
            </Button>
          )}
        </div>
      </div>
    );
  })();

  if (isPage) {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="admin-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-6">
            {pageHeader && (
              <div className="mb-4 border-b border-border/60 pb-4">
                <PageHeader
                  variant="section"
                  className="mb-0 gap-3 border-0 pb-0 sm:items-center"
                  title={pageHeader.title}
                  description={pageHeader.description}
                  actions={pageHeader.actions}
                />
                {pageHeader.advanceBlockReason && (
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {pageHeader.advanceBlockReason}
                  </p>
                )}
              </div>
            )}
            <div className="mb-4 space-y-2">
              {statusBadges}
              {assignNotice && (
                <AssignNoticeBanner
                  assigneeName={assignNotice}
                  onDismiss={handleDismissAssignNotice}
                />
              )}
            </div>
            {detailTabs}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
        <div className="px-4 pt-3 pb-4">
          <div className="mb-3 space-y-2">
            {statusBadges}
            {assignNotice && (
              <AssignNoticeBanner
                assigneeName={assignNotice}
                onDismiss={handleDismissAssignNotice}
              />
            )}
          </div>
          {detailTabs}
        </div>
      </div>
      {footer}
    </div>
  );
}

export function adoptionDetailTitle(app: AdoptionApplication) {
  const stageLabel = ADOPTION_STAGES.find((item) => item.key === app.stage)?.label ?? app.stage;
  const substage = normalizeReviewSubstage(app);
  return {
    reference: issueKey(app.id),
    applicantName: app.applicantName,
    stageLabel: substage ? `${stageLabel} · ${getReviewSubstageLabel(substage)}` : stageLabel,
  };
}
