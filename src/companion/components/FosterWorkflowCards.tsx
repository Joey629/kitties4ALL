import { Link } from 'react-router-dom';
import { ClipboardList, Heart, Home, Hourglass, PawPrint } from 'lucide-react';
import { Card, CardContent } from '@/admin/components/ui/card';
import { Button } from '@/admin/components/ui/button';
import { Badge } from '@/admin/components/ui/badge';
import type {
  FosterAdoptionInterest,
  FosterApplication,
  FosterMatch,
} from '@/shared/fosterWorkflow';
import { isPendingFosterApplication } from '@/shared/fosterWorkflow';

const APPLICATION_STATUS: Record<FosterApplication['status'], string> = {
  submitted: 'Submitted — awaiting review',
  under_review: 'Under review by shelter team',
  approved: 'Approved — ready for cat matching',
  rejected: 'Not approved',
};

export function FosterApplicationCard({
  application,
  compact = false,
  onWithdraw,
}: {
  application: FosterApplication;
  compact?: boolean;
  onWithdraw?: () => void;
}) {
  if (application.status === 'rejected') {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className={compact ? 'p-4' : 'p-5'}>
          <p className="text-sm font-semibold text-foreground">Foster application</p>
          <p className="mt-1 text-sm text-muted-foreground">{APPLICATION_STATUS.rejected}</p>
          {application.rejectionReason && (
            <p className="mt-2 text-sm text-foreground">{application.rejectionReason}</p>
          )}
          <Button asChild className="mt-4 h-11 w-full rounded-xl">
            <Link to="/companion/foster/apply">Apply again</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (application.status === 'approved') {
    return (
      <Card className="border-emerald-200/80 bg-emerald-50/50">
        <CardContent className={compact ? 'p-4' : 'p-5'}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Home className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Foster application approved</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The shelter may send cat matches for you to review.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200/80 bg-amber-50/50">
      <CardContent className={compact ? 'p-4' : 'p-5'}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Hourglass className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Foster application pending</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {APPLICATION_STATUS[application.status]}
            </p>
          </div>
        </div>
        {onWithdraw && isPendingFosterApplication(application) && (
          <Button
            variant="outline"
            className="mt-4 h-11 w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
            onClick={() => {
              if (
                window.confirm(
                  'Withdraw your foster application? You can submit a new one later if your plans change.',
                )
              ) {
                onWithdraw();
              }
            }}
          >
            Withdraw application
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function FosterApplyPromptCard({ compact = false }: { compact?: boolean }) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className={compact ? 'p-4' : 'p-5'}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Become a foster parent</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Submit a foster application and wait for shelter approval before receiving cat matches.
            </p>
            <Button asChild className="mt-4 h-11 w-full rounded-xl">
              <Link to="/companion/foster/apply">Start foster application</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FosterMatchCard({ match }: { match: FosterMatch }) {
  return (
    <Card className="border-primary/25">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PawPrint className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Foster match — {match.catName}</p>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{match.summary}</p>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0">New</Badge>
        </div>
        <Button asChild variant="outline" className="mt-4 h-11 w-full rounded-xl">
          <Link to={`/companion/foster/matches/${match.id}`}>Review cat profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function FosterAdoptionInterestCard({
  interest,
  onAcknowledge,
}: {
  interest: FosterAdoptionInterest;
  onAcknowledge: (interestId: string) => void;
}) {
  return (
    <Card className="border-rose-200/80 bg-rose-50/40">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
            <Heart className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Adoption interest for {interest.catName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{interest.message}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="h-10 flex-1 rounded-xl">
            <Link to={`/companion/cats/${interest.catId}`}>View {interest.catName}</Link>
          </Button>
          <Button
            className="h-10 flex-1 rounded-xl"
            onClick={() => onAcknowledge(interest.id)}
          >
            Acknowledge
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function FosterWorkflowBlock({
  fosterApplication,
  fosterMatches,
  fosterAdoptionInterests,
  onWithdraw,
  onAcknowledge,
  showApplyPrompt = true,
}: {
  fosterApplication: FosterApplication | undefined;
  fosterMatches: FosterMatch[];
  fosterAdoptionInterests: FosterAdoptionInterest[];
  onWithdraw?: () => void;
  onAcknowledge: (interestId: string) => void;
  showApplyPrompt?: boolean;
}) {
  const showApprovedWaiting =
    fosterApplication?.status === 'approved' &&
    fosterMatches.length === 0 &&
    showApplyPrompt;

  return (
    <div className="space-y-3">
      {showApplyPrompt && !fosterApplication && <FosterApplyPromptCard compact />}
      {fosterApplication && fosterApplication.status !== 'approved' && (
        <FosterApplicationCard
          application={fosterApplication}
          compact
          onWithdraw={onWithdraw}
        />
      )}
      {showApprovedWaiting && (
        <Card className="border-border bg-muted/20">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Application approved. The shelter will send foster cat matches when a good fit is ready.
          </CardContent>
        </Card>
      )}
      {fosterMatches.map((match) => (
        <FosterMatchCard key={match.id} match={match} />
      ))}
      {fosterAdoptionInterests.map((interest) => (
        <FosterAdoptionInterestCard
          key={interest.id}
          interest={interest}
          onAcknowledge={onAcknowledge}
        />
      ))}
    </div>
  );
}
