import { useEffect, useState } from 'react';
import { adminCats } from '@/admin/data/mock';
import {
  getFosterApplicationForCaregiver,
  markFosterApplicationUnderReview,
  proposeFosterMatch,
  reviewFosterApplication,
  subscribeFosterWorkflow,
  type FosterApplication,
} from '@/shared/fosterWorkflow';
import { Button } from '@/admin/components/ui/button';
import { Badge } from '@/admin/components/ui/badge';
import { cn, formatDate } from '@/admin/lib/utils';

interface FosterApplicationReviewBodyProps {
  caregiverId: string;
  caregiverName: string;
  markUnderReviewOnOpen?: boolean;
  onReviewed?: () => void;
}

export function FosterApplicationReviewBody({
  caregiverId,
  caregiverName,
  markUnderReviewOnOpen = false,
  onReviewed,
}: FosterApplicationReviewBodyProps) {
  const [application, setApplication] = useState<FosterApplication | undefined>(() =>
    getFosterApplicationForCaregiver(caregiverId),
  );
  const [selectedCatId, setSelectedCatId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setApplication(getFosterApplicationForCaregiver(caregiverId));
    };
    refresh();
    const unsubscribe = subscribeFosterWorkflow(refresh);
    return unsubscribe;
  }, [caregiverId]);

  useEffect(() => {
    if (!markUnderReviewOnOpen || !application || application.status !== 'submitted') return;
    markFosterApplicationUnderReview(application.id);
    setApplication(getFosterApplicationForCaregiver(caregiverId));
  }, [application?.id, application?.status, caregiverId, markUnderReviewOnOpen]);

  if (!application) {
    return (
      <p className="text-sm text-muted-foreground">
        No foster application on file for this caregiver.
      </p>
    );
  }

  const shelterCats = adminCats.filter(
    (cat) => cat.placement === 'shelter' && cat.adoptionPipeline !== 'adopted',
  );
  const isPending =
    application.status === 'submitted' || application.status === 'under_review';

  const handleApprove = () => {
    const updated = reviewFosterApplication(application.id, 'approve');
    if (updated) {
      setApplication(updated);
      onReviewed?.();
    }
  };

  const handleReject = () => {
    const updated = reviewFosterApplication(application.id, 'reject', {
      rejectionReason: rejectReason.trim() || 'Not approved at this time.',
    });
    if (updated) {
      setApplication(updated);
      setShowRejectForm(false);
      onReviewed?.();
    }
  };

  const handleProposeMatch = () => {
    if (!selectedCatId) return;
    proposeFosterMatch({
      caregiverId,
      caregiverName,
      catId: selectedCatId,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{caregiverName}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Submitted {formatDate(application.submittedAt.slice(0, 10))}
          </p>
        </div>
        <Badge
          variant={
            application.status === 'approved'
              ? 'success'
              : application.status === 'rejected'
                ? 'danger'
                : 'warning'
          }
        >
          {application.status.replace('_', ' ')}
        </Badge>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Home</dt>
          <dd className="font-medium capitalize">{application.householdType}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Other pets</dt>
          <dd className="font-medium">{application.hasOtherPets ? 'Yes' : 'No'}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Experience</dt>
          <dd className="font-medium">{application.experience}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Availability</dt>
          <dd className="font-medium">{application.availability}</dd>
        </div>
        {application.notes && (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Notes</dt>
            <dd className="font-medium">{application.notes}</dd>
          </div>
        )}
      </dl>

      {isPending && !showRejectForm && (
        <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
          <Button size="sm" onClick={handleApprove}>
            Approve application
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowRejectForm(true)}>
            Reject
          </Button>
        </div>
      )}

      {isPending && showRejectForm && (
        <div className="space-y-3 border-t border-border/60 pt-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Reason for rejection
          </label>
          <textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            rows={3}
            placeholder="Brief reason shared with the caregiver"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="destructive" onClick={handleReject}>
              Confirm reject
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowRejectForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {application.status === 'approved' && (
        <div className="space-y-3 border-t border-border/60 pt-4">
          <p className="text-sm font-medium text-foreground">Propose foster match</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={selectedCatId}
              onChange={(event) => setSelectedCatId(event.target.value)}
              className={cn(
                'h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm',
              )}
            >
              <option value="">Select a shelter cat…</option>
              {shelterCats.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} · {cat.health}
                </option>
              ))}
            </select>
            <Button size="sm" disabled={!selectedCatId} onClick={handleProposeMatch}>
              Send match
            </Button>
          </div>
        </div>
      )}

      {application.status === 'rejected' && application.rejectionReason && (
        <p className="rounded-lg bg-destructive/5 px-3 py-2 text-sm text-foreground">
          {application.rejectionReason}
        </p>
      )}
    </div>
  );
}
