import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  HandCoins,
  Heart,
  Home,
  PawPrint,
  Sparkles,
  Users,
} from 'lucide-react';
import { StatCard } from '@/admin/components/shared/StatCard';
import { PageHeader } from '@/admin/components/shared/PageHeader';
import { VolunteerSchedulingPanel } from '@/admin/components/caregivers/VolunteerSchedulingPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/admin/components/ui/card';
import { Badge } from '@/admin/components/ui/badge';
import { Button } from '@/admin/components/ui/button';
import { issueKey } from '@/admin/components/adoption/constants';
import { useAdoptionApplications } from '@/hooks/useAdoptionApplications';
import { useDonors } from '@/hooks/useDonors';
import { formatCurrency } from '@/admin/lib/utils';
import {
  adoptionPipelineSnapshot,
  donationMonthSnapshot,
  formatQueueAge,
  getAllNewAdoptionQueueItems,
  managedCatsSnapshot,
  newAdoptionCount,
  shelterCapacitySnapshot,
} from '@/admin/lib/dashboardData';
import {
  getPendingFosterApplications,
  isFosterWorkflowStorageKey,
  subscribeFosterWorkflow,
} from '@/shared/fosterWorkflow';
import { countUnacknowledgedDonations } from '@/shared/donors';

const INSET_DIVIDER =
  'after:absolute after:bottom-0 after:left-6 after:right-6 after:border-b after:border-neutral-300';

const QUEUE_PAGE_SIZE = 5;

function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);

  return {
    items: items.slice(safePage * pageSize, safePage * pageSize + pageSize),
    page: safePage,
    totalPages,
    total,
  };
}

function ListPagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-auto flex shrink-0 items-center justify-between px-5 py-3">
      <span className="text-xs tabular-nums text-muted-foreground">
        Page {page + 1} of {totalPages}
      </span>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          disabled={page === 0}
          onClick={onPrevious}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          disabled={page >= totalPages - 1}
          onClick={onNext}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { applications } = useAdoptionApplications();
  const { donors } = useDonors();
  const [adoptionPage, setAdoptionPage] = useState(0);
  const [fosterVersion, setFosterVersion] = useState(0);
  const unacknowledgedGiftCount = useMemo(
    () => countUnacknowledgedDonations(donors),
    [donors],
  );

  const pendingFosterApplications = useMemo(
    () => getPendingFosterApplications(),
    [fosterVersion],
  );
  const pendingFosterCount = pendingFosterApplications.length;
  const managed = managedCatsSnapshot();
  const capacity = shelterCapacitySnapshot();
  const adoption = adoptionPipelineSnapshot(applications);
  const donations = donationMonthSnapshot(donors);
  const newQueueCount = newAdoptionCount(applications);

  const allNewQueue = useMemo(
    () => getAllNewAdoptionQueueItems(applications),
    [applications],
  );

  useEffect(() => {
    const unsubscribe = subscribeFosterWorkflow(() => {
      setFosterVersion((value) => value + 1);
    });
    const onStorage = (event: StorageEvent) => {
      if (isFosterWorkflowStorageKey(event.key)) {
        setFosterVersion((value) => value + 1);
      }
    };
    const onFocus = () => setFosterVersion((value) => value + 1);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const newQueuePagination = useMemo(
    () => paginate(allNewQueue, adoptionPage, QUEUE_PAGE_SIZE),
    [allNewQueue, adoptionPage],
  );

  useEffect(() => {
    setAdoptionPage((page) =>
      Math.min(page, Math.max(0, Math.ceil(allNewQueue.length / QUEUE_PAGE_SIZE) - 1)),
    );
  }, [allNewQueue.length]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader
        title="Overview"
        description="Operational snapshot — what needs attention today"
      />

      <div className="mb-4 grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Cats in our care"
          valueLines={[
            `${managed.shelter} in shelter`,
            `${managed.foster} in ${managed.fosterHomes} foster${managed.fosterHomes === 1 ? '' : 's'}`,
          ]}
          icon={PawPrint}
          metric={`Avg stay ${managed.avgShelterStayDays} days`}
        />
        <StatCard
          title="Shelter capacity"
          value={`${capacity.count} / ${capacity.capacity}`}
          icon={Home}
          metric={capacity.projection.label}
          subtitle={`Throughput ${capacity.projection.netPerMonth >= 0 ? '+' : ''}${capacity.projection.netPerMonth.toFixed(1)}/mo (${capacity.projection.avgIntake.toFixed(1)} in · ${capacity.projection.avgOutflow.toFixed(1)} out)${
            capacity.medicalCare > 0 ? ` · ${capacity.medicalCare} in medical care` : ''
          }`}
        />
        <StatCard
          title="Adoption pipeline"
          valueLines={[
            `${adoption.newCount} new`,
            `${adoption.reviewingCount} reviewing`,
          ]}
          icon={Heart}
          metric={`Available for Adoption: ${adoption.availableForAdoption}`}
        />
        <Link to="/admin/donors" className="block h-full">
          <StatCard
            title="Donations this month"
            value={formatCurrency(donations.received)}
            icon={HandCoins}
            metric={
              unacknowledgedGiftCount > 0
                ? `${unacknowledgedGiftCount} thank-you${unacknowledgedGiftCount === 1 ? '' : 's'} pending`
                : donations.runway.label
            }
          />
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <Card className="flex h-full flex-col">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <CardTitle className="text-base">New adoption queue</CardTitle>
              <Badge variant="secondary" className="shrink-0 tabular-nums">
                {newQueueCount}
              </Badge>
            </div>
            <Link
              to="/admin/adoption"
              className="shrink-0 text-xs font-medium text-primary hover:underline"
            >
              View all adoptions
            </Link>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col p-0">
            {allNewQueue.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-muted-foreground">
                No new adoptions waiting to be reviewed.
              </p>
            ) : (
              <div className="flex flex-1 flex-col">
                <div className="flex-1">
                  {newQueuePagination.items.map(({ app, matchScore }, index) => (
                    <Link
                      key={app.id}
                      to={`/admin/adoption/${app.id}`}
                      className={`relative flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40 ${
                        index < newQueuePagination.items.length - 1 ? INSET_DIVIDER : ''
                      }`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary">
                        <PawPrint className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {app.applicantName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {issueKey(app.id)} · {app.catName} · {formatQueueAge(app.submittedDate)}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sky/15 px-2 py-1 text-[10px] text-sky-700">
                        <Sparkles className="h-2.5 w-2.5 shrink-0" />
                        <span className="font-bold uppercase tracking-wide">AI</span>
                        <span className="text-xs font-normal tabular-nums normal-case text-foreground">
                          {matchScore}% match
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
                <ListPagination
                  page={newQueuePagination.page}
                  totalPages={newQueuePagination.totalPages}
                  onPrevious={() => setAdoptionPage((page) => Math.max(0, page - 1))}
                  onNext={() =>
                    setAdoptionPage((page) =>
                      Math.min(newQueuePagination.totalPages - 1, page + 1),
                    )
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <CardTitle className="text-base">Foster applications</CardTitle>
              <Badge variant="secondary" className="shrink-0 tabular-nums">
                {pendingFosterCount}
              </Badge>
            </div>
            <Link
              to="/admin/caregivers?tab=foster_parent"
              className="shrink-0 text-xs font-medium text-primary hover:underline"
            >
              View foster
            </Link>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col p-0">
            {pendingFosterApplications.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-muted-foreground">
                No foster applications waiting for review.
              </p>
            ) : (
              <div className="flex-1">
                {pendingFosterApplications.map((application, index) => (
                  <Link
                    key={application.id}
                    to={`/admin/caregivers/${application.caregiverId}`}
                    className={`relative flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40 ${
                      index < pendingFosterApplications.length - 1 ? INSET_DIVIDER : ''
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-700">
                      <Users className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {application.caregiverName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {application.householdType} · {application.status.replace('_', ' ')} ·{' '}
                        {formatQueueAge(application.submittedAt)}
                      </p>
                    </div>
                    <Badge variant="warning" className="shrink-0 text-[10px] capitalize">
                      Review
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <VolunteerSchedulingPanel />
      </div>
    </motion.div>
  );
}
