import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageBackLink } from '@/admin/components/shared/PageBackLink';
import { Button } from '@/admin/components/ui/button';
import { useAdoptionApplications } from '@/hooks/useAdoptionApplications';
import {
  assignAdoptionReviewerWithTask,
  advanceAdoptionWorkflowWithTask,
  rejectAdoptionWithTask,
  unassignAdoptionReviewerWithTask,
} from '@/shared/adoptionAssignment';
import {
  AdoptionApplicationDetail,
  adoptionDetailTitle,
} from '@/admin/components/adoption/AdoptionApplicationDetail';
import {
  getAssignableCaregiversList,
  ADOPTION_PRIMARY_ACTION_CLASS,
} from '@/admin/components/adoption/constants';
import type { AdoptionApplication } from '@/admin/types';
import { formatDate } from '@/admin/lib/utils';
import { getAdvanceBlockReason, getScheduleBlockReason } from '@/shared/adoptionReviewActivities';
import { getNextWorkflowAction } from '@/shared/adoptionWorkflow';

export function AdoptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { applications } = useAdoptionApplications();
  const [rejectPrompt, setRejectPrompt] = useState(false);
  const [assignPickerOpen, setAssignPickerOpen] = useState(false);

  const app = useMemo(
    () => applications.find((item) => item.id === id) ?? null,
    [applications, id],
  );

  const handleAssign = (
    appId: string,
    caregiverId: string,
    options?: { moveToReviewing?: boolean },
  ) => {
    const caregiver = getAssignableCaregiversList().find((item) => item.id === caregiverId);
    if (!caregiver) return null;

    return assignAdoptionReviewerWithTask(
      appId,
      { id: caregiver.id, name: caregiver.name },
      options,
      applications,
    );
  };

  const handleUnassign = (appId: string) => {
    unassignAdoptionReviewerWithTask(appId);
  };

  const handleAdvance = (appId: string) => {
    advanceAdoptionWorkflowWithTask(appId);
  };

  const handleReject = (reason: string) => {
    if (!app) return;
    rejectAdoptionWithTask(app.id, reason);
    setRejectPrompt(false);
  };

  if (!app) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Adoption not found.</p>
        <PageBackLink to="/admin/adoption" className="mb-0 mt-4">
          Back to adoption board
        </PageBackLink>
      </div>
    );
  }

  const { reference, applicantName } = adoptionDetailTitle(app);
  const showReject = app.stage !== 'rejected' && app.stage !== 'approved';
  const showAssign = !app.interviewerId && showReject;
  const nextAction = getNextWorkflowAction(app);
  const advanceBlockReason = (() => {
    const reason = getAdvanceBlockReason(app);
    if (!reason) return null;
    const scheduleBlock = getScheduleBlockReason(app);
    if (scheduleBlock && reason === scheduleBlock) return null;
    return reason;
  })();
  const isAdvanceBlocked = Boolean(getAdvanceBlockReason(app));
  const headerActions = showReject || showAssign || nextAction;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="-mx-4 -mb-4 flex min-h-0 flex-1 flex-col bg-muted/35 px-6 pb-5 pt-0 sm:-mx-6 lg:-mx-8"
    >
      <PageBackLink to="/admin/adoption">Back to adoption board</PageBackLink>

      <div className="flex min-h-0 w-full flex-1 flex-col">
        <AdoptionApplicationDetail
          app={app}
          onAssign={handleAssign}
          onUnassign={handleUnassign}
          onReject={() => setRejectPrompt(true)}
          onAdvance={handleAdvance}
          layout="page"
          assignPickerOpen={assignPickerOpen}
          onAssignPickerOpenChange={setAssignPickerOpen}
          pageHeader={{
            title: applicantName,
            description: `${reference} · Submitted ${formatDate(app.submittedDate)}`,
            advanceBlockReason: advanceBlockReason && nextAction ? advanceBlockReason : null,
            actions: headerActions ? (
              <div className="flex shrink-0 items-center gap-2">
                {showReject && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-coral/30 text-coral hover:bg-coral/5"
                    onClick={() => setRejectPrompt(true)}
                  >
                    Reject
                  </Button>
                )}
                {showAssign && (
                  <Button
                    size="sm"
                    className={ADOPTION_PRIMARY_ACTION_CLASS}
                    onClick={() => setAssignPickerOpen(true)}
                  >
                    Assign
                  </Button>
                )}
                {nextAction && (
                  <Button
                    size="sm"
                    className={ADOPTION_PRIMARY_ACTION_CLASS}
                    disabled={isAdvanceBlocked}
                    onClick={() => handleAdvance(app.id)}
                  >
                    {nextAction.label}
                  </Button>
                )}
              </div>
            ) : undefined,
          }}
        />
      </div>

      <RejectReasonDialog
        app={rejectPrompt ? app : null}
        onCancel={() => setRejectPrompt(false)}
        onConfirm={handleReject}
      />
    </motion.div>
  );
}

function RejectReasonDialog({
  app,
  onCancel,
  onConfirm,
}: {
  app: AdoptionApplication | null;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (app) setReason('');
  }, [app?.id]);

  if (!app) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-base font-semibold">Reject adoption</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {app.applicantName} · {app.catName}
        </p>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Reason for applicant
        </label>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          placeholder="Brief reason shown to the applicant"
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="mt-4 flex gap-2">
          <Button
            className="flex-1"
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim())}
          >
            Reject adoption
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
