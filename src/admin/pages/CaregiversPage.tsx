import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Cat, Plus, Search } from 'lucide-react';
import { PageHeader } from '@/admin/components/shared/PageHeader';
import { PageToolbar } from '@/admin/components/shared/PageToolbar';
import { DataTableShell } from '@/admin/components/shared/DataTableShell';
import { Button } from '@/admin/components/ui/button';
import { Input } from '@/admin/components/ui/input';
import { Badge } from '@/admin/components/ui/badge';
import { Avatar, AvatarFallback } from '@/admin/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/admin/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/admin/components/ui/tabs';
import { caregivers as seedCaregivers, getCatById } from '@/admin/data/mock';
import { loadCaregivers, subscribeCaregivers } from '@/shared/caregivers';
import {
  getFosterApplicationForCaregiver,
  getPendingFosterApplications,
  isFosterWorkflowStorageKey,
  isPendingFosterApplication,
  subscribeFosterWorkflow,
} from '@/shared/fosterWorkflow';
import { cn } from '@/admin/lib/utils';
import type { Caregiver, CaregiverRole } from '@/admin/types';
import { useTeamTasks } from '@/hooks/useTeamTasks';
import {
  countPendingFosterSupplyRequests,
  getPendingSupplyRequestsByCaregiver,
  type TeamTask,
} from '@/shared/teamTasks';
import { FosterOperationalAlertsCell } from '@/admin/components/caregivers/FosterOperationalAlertsCell';
import { FosterApplicationReviewModal } from '@/admin/components/caregivers/FosterApplicationReviewModal';
import { FosterSupplyRequestModal } from '@/admin/components/caregivers/FosterSupplyRequestModal';

const roleConfig: Record<Exclude<CaregiverRole, 'staff'>, { label: string; variant: 'default' | 'success' | 'warning' }> = {
  volunteer: { label: 'Volunteer', variant: 'success' },
  foster_parent: { label: 'Foster Parent', variant: 'warning' },
};

const tabs = ['all', 'volunteer', 'foster_parent'] as const;
type CaregiverTab = (typeof tabs)[number];

function parseCaregiverTab(value: string | null): CaregiverTab {
  if (value && tabs.includes(value as CaregiverTab)) {
    return value as CaregiverTab;
  }
  return 'all';
}

function filterCaregivers(
  tab: CaregiverTab,
  caregiverList: typeof seedCaregivers,
  search: string,
  pendingApplicantIds: Set<string>,
  pendingSupplyCaregiverIds: Set<string>,
) {
  const visible = caregiverList.filter((caregiver) => caregiver.role !== 'staff');
  const byTab =
    tab === 'all'
      ? visible
      : tab === 'volunteer'
        ? visible.filter((caregiver) => caregiver.role === 'volunteer')
        : visible.filter(
            (caregiver) =>
              caregiver.role === 'foster_parent' ||
              pendingApplicantIds.has(caregiver.id) ||
              pendingSupplyCaregiverIds.has(caregiver.id),
          );
  const query = search.trim().toLowerCase();
  if (!query) return byTab;
  return byTab.filter(
    (caregiver) =>
      caregiver.name.toLowerCase().includes(query) ||
      caregiver.email.toLowerCase().includes(query) ||
      caregiver.phone?.toLowerCase().includes(query) ||
      caregiver.address?.toLowerCase().includes(query),
  );
}

function AssignedCatsCell({ caregiver }: { caregiver: Caregiver }) {
  if (caregiver.role === 'volunteer') {
    return <span className="text-sm text-muted-foreground">None</span>;
  }

  const cats = caregiver.assignedCatIds
    .map((id) => getCatById(id))
    .filter((cat): cat is NonNullable<typeof cat> => Boolean(cat));

  if (cats.length === 0) {
    return <span className="text-sm text-muted-foreground">None</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {cats.map((cat) => (
        <Link
          key={cat.id}
          to={`/admin/cats/${cat.id}`}
          onClick={(event) => event.stopPropagation()}
          className="inline-flex items-center gap-1 rounded bg-primary/8 px-1.5 py-0.5 text-[10px] font-medium text-primary transition-colors hover:bg-primary/12"
        >
          <Cat className="h-3 w-3" />
          {cat.name}
        </Link>
      ))}
    </div>
  );
}

export function CaregiversPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [caregiverList, setCaregiverList] = useState(() => loadCaregivers());
  const [fosterVersion, setFosterVersion] = useState(0);
  const teamTasks = useTeamTasks();
  const [applicationModal, setApplicationModal] = useState<{
    caregiverId: string;
    caregiverName: string;
  } | null>(null);
  const [supplyModalTask, setSupplyModalTask] = useState<TeamTask | null>(null);
  const activeTab = parseCaregiverTab(searchParams.get('tab'));

  const pendingFosterApplications = useMemo(
    () => getPendingFosterApplications(),
    [fosterVersion],
  );
  const pendingSupplyByCaregiver = useMemo(
    () => getPendingSupplyRequestsByCaregiver(teamTasks),
    [teamTasks],
  );
  const pendingApplicantIds = useMemo(
    () => new Set(pendingFosterApplications.map((application) => application.caregiverId)),
    [pendingFosterApplications],
  );
  const pendingSupplyCaregiverIds = useMemo(
    () => new Set(pendingSupplyByCaregiver.keys()),
    [pendingSupplyByCaregiver],
  );
  const pendingFosterCount = pendingFosterApplications.length;
  const pendingSupplyCount = useMemo(
    () => countPendingFosterSupplyRequests(teamTasks),
    [teamTasks],
  );
  const fosterOperationalCount = pendingFosterCount + pendingSupplyCount;

  useEffect(() => {
    const unsubscribe = subscribeCaregivers(setCaregiverList);
    const unsubscribeFoster = subscribeFosterWorkflow(() => {
      setFosterVersion((value) => value + 1);
    });
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'kitticare-caregivers') setCaregiverList(loadCaregivers());
      if (isFosterWorkflowStorageKey(event.key)) {
        setFosterVersion((value) => value + 1);
      }
    };
    const onFocus = () => setFosterVersion((value) => value + 1);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    return () => {
      unsubscribe();
      unsubscribeFoster();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const handleTabChange = (value: string) => {
    const nextTab = parseCaregiverTab(value);
    if (nextTab === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: nextTab });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex h-full min-h-0 flex-col"
    >
      <PageHeader
        title="Caregivers"
        description="Volunteers and foster parents — use team chat in the corner to message your team"
        actions={
          <Button size="sm" onClick={() => navigate('/admin/caregivers/new')}>
            <Plus className="h-4 w-4" />
            Add caregiver
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex min-h-0 flex-1 flex-col">
        <PageToolbar className="mb-3 shrink-0">
          <div className="relative w-full min-w-[12rem] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="volunteer">Volunteers</TabsTrigger>
            <TabsTrigger value="foster_parent" className="gap-1.5">
              Foster
              {fosterOperationalCount > 0 && (
                <Badge variant="warning" className="h-5 min-w-5 px-1.5 text-[10px] tabular-nums">
                  {fosterOperationalCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </PageToolbar>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden py-2">
          {tabs.map((tab) => {
            const filtered = filterCaregivers(
              tab,
              caregiverList,
              search,
              pendingApplicantIds,
              pendingSupplyCaregiverIds,
            );
            const showFosterColumns = tab === 'foster_parent';

            return (
              <TabsContent
                key={tab}
                value={tab}
                className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
              >
                {tab === 'foster_parent' && fosterOperationalCount > 0 && (
                  <div className="mb-3 flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {fosterOperationalCount} operational task{fosterOperationalCount === 1 ? '' : 's'} awaiting action
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {pendingFosterCount > 0 && (
                          <>
                            {pendingFosterCount} foster application{pendingFosterCount === 1 ? '' : 's'}
                          </>
                        )}
                        {pendingFosterCount > 0 && pendingSupplyCount > 0 && ' · '}
                        {pendingSupplyCount > 0 && (
                          <>
                            {pendingSupplyCount} supply request{pendingSupplyCount === 1 ? '' : 's'}
                          </>
                        )}
                        . Use the alerts at the end of each row to review details.
                      </p>
                    </div>
                  </div>
                )}

                <DataTableShell className="mb-0 flex min-h-0 flex-1 flex-col">
                  <Table containerClassName="min-h-0 flex-1 overflow-y-auto overscroll-y-contain scrollbar-gutter-stable">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Phone</TableHead>
                        {showFosterColumns && <TableHead>Address</TableHead>}
                        <TableHead>Assigned cats</TableHead>
                        <TableHead>Availability</TableHead>
                        {showFosterColumns && (
                          <TableHead className="text-right">Alerts</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((cg) => {
                        const role = roleConfig[cg.role as Exclude<CaregiverRole, 'staff'>];
                        const fosterApplication = getFosterApplicationForCaregiver(cg.id);
                        const fosterApplicationPending = isPendingFosterApplication(fosterApplication);
                        const supplyRequests = pendingSupplyByCaregiver.get(cg.id) ?? [];
                        const hasOperationalAlert =
                          fosterApplicationPending || supplyRequests.length > 0;
                        const isNewFosterApplicant =
                          fosterApplicationPending && cg.role !== 'foster_parent';

                        return (
                          <TableRow
                            key={cg.id}
                            className={cn(
                              hasOperationalAlert && 'bg-amber-50/70 hover:bg-amber-50',
                            )}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs bg-primary/8">{cg.avatar}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Link
                                      to={`/admin/caregivers/${cg.id}`}
                                      className="font-medium text-foreground transition-colors hover:text-primary"
                                    >
                                      {cg.name}
                                    </Link>
                                    {isNewFosterApplicant && (
                                      <Badge variant="outline" className="border-amber-300 text-[10px] text-amber-800">
                                        New applicant
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{cg.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={role.variant}>{role.label}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {cg.phone || '—'}
                            </TableCell>
                            {showFosterColumns && (
                              <TableCell className="max-w-[14rem] text-sm text-muted-foreground">
                                {cg.address || '—'}
                              </TableCell>
                            )}
                            <TableCell>
                              <AssignedCatsCell caregiver={cg} />
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{cg.availability}</TableCell>
                            {showFosterColumns && (
                              <TableCell className="text-right">
                                <FosterOperationalAlertsCell
                                  fosterApplication={fosterApplication}
                                  supplyRequests={supplyRequests}
                                  onOpenApplication={() =>
                                    setApplicationModal({
                                      caregiverId: cg.id,
                                      caregiverName: cg.name,
                                    })
                                  }
                                  onOpenSupply={(task) => setSupplyModalTask(task)}
                                />
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </DataTableShell>
              </TabsContent>
            );
          })}
        </div>
      </Tabs>

      <FosterApplicationReviewModal
        open={Boolean(applicationModal)}
        caregiverId={applicationModal?.caregiverId ?? null}
        caregiverName={applicationModal?.caregiverName ?? ''}
        onClose={() => setApplicationModal(null)}
        onReviewed={() => setFosterVersion((value) => value + 1)}
      />
      <FosterSupplyRequestModal
        open={Boolean(supplyModalTask)}
        task={supplyModalTask}
        onClose={() => setSupplyModalTask(null)}
      />
    </motion.div>
  );
}
