import { useMemo, useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/admin/components/ui/button';
import { Badge } from '@/admin/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/admin/components/ui/tabs';
import { PageBackLink } from '@/admin/components/shared/PageBackLink';
import { AssignTaskForm } from '@/admin/components/tasks/AssignTaskForm';
import { AssignSupplyRequestPanel } from '@/admin/components/tasks/AssignSupplyRequestPanel';
import { OpenTasksSummary } from '@/admin/components/tasks/OpenTasksPanel';
import { useTeamTasks } from '@/hooks/useTeamTasks';
import { useDonors } from '@/hooks/useDonors';
import { useAdoptionApplications } from '@/hooks/useAdoptionApplications';
import { isUnassignedSupplyRequest } from '@/shared/teamTasks';
import { getCaregiverById } from '@/shared/caregivers';
import { getFosterCaregiverIdForCat } from '@/shared/taskAdmin';
import { adminCats, getCatById } from '@/admin/data/mock';
import {
  formatUpdateSummary,
  getCatCareUpdatesForCat,
  subscribeCatCareUpdates,
} from '@/shared/catCareUpdates';
import {
  acknowledgeIncidentReport,
  getIncidentReportById,
  subscribeIncidentReports,
} from '@/shared/incidentReports';
import { getDonorsForCat } from '@/shared/donors';
import { getActiveApplicationForCat } from '@/shared/adoptionStatus';
import { cn, formatCurrency, formatDate } from '@/admin/lib/utils';
import { CatPhotoGallery } from '@/admin/components/cats/CatPhotoGallery';
import {
  getIdealAdopterDescription,
  saveIdealAdopterDescription,
  saveCatProfileFields,
} from '@/shared/adminCatProfiles';
import type { ActivityType, AdminCat, AdoptionPipelineStatus, CatPlacement, HealthStatus } from '@/admin/types';
import {
  ADOPTION_PIPELINE_OPTIONS,
  HEALTH_OPTIONS,
  getAdoptionPipelineDisplay,
  getPlacementLabel,
  healthConfig,
  placementConfig,
} from '@/admin/lib/catDisplay';

type ProfileTab = 'profile' | 'timeline' | 'medical' | 'adoption';
type LogCategory = 'medical' | 'daily' | 'adoption';

interface LogEntry {
  id: string;
  date: string;
  category: LogCategory;
  title: string;
  description: string;
  photoUrl?: string | null;
}

const LOG_TAG_STYLES: Record<LogCategory, string> = {
  medical: 'bg-sky/15 text-sky border-sky/20',
  daily: 'bg-muted text-muted-foreground border-border',
  adoption: 'bg-soft-orange/15 text-foreground border-soft-orange/20',
};

const LOG_TAG_LABELS: Record<LogCategory, string> = {
  medical: 'Medical',
  daily: 'Daily',
  adoption: 'Adoption',
};

function catRefId(catId: string) {
  const index = adminCats.findIndex((cat) => cat.id === catId);
  return `KA-${String(index + 1).padStart(4, '0')}`;
}

function mapActivityType(type: ActivityType): LogCategory {
  if (type === 'medical') return 'medical';
  if (type === 'adoption' || type === 'foster') return 'adoption';
  return 'daily';
}

function formatLogDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function sortByDateDesc<T extends { date: string }>(entries: T[]) {
  return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function shelterDays(intakeDate: string) {
  const diff = Math.floor((Date.now() - new Date(intakeDate).getTime()) / 86400000);
  return Math.max(diff, 0);
}

function buildCompanionUpdateEntries(catId: string): LogEntry[] {
  return getCatCareUpdatesForCat(catId).map((update) => ({
    id: update.id,
    date: update.createdAt.slice(0, 10),
    category: 'daily' as const,
    title: `Update from ${update.reporterName}`,
    description: formatUpdateSummary(update),
    photoUrl: update.photo,
  }));
}

function buildTimelineEntries(cat: AdminCat): LogEntry[] {
  return sortByDateDesc([
    ...cat.timeline.map((event) => ({
      id: `tl-${event.id}`,
      date: event.date,
      category: mapActivityType(event.type),
      title: event.title,
      description: event.description,
    })),
    ...buildCompanionUpdateEntries(cat.id),
  ]);
}

function buildMedicalEntries(cat: AdminCat): LogEntry[] {
  return sortByDateDesc(
    cat.healthRecords.map((record) => ({
      id: `health-${record.id}`,
      date: record.date,
      category: 'medical' as const,
      title: record.type,
      description: record.notes,
    })),
  );
}

function buildAdoptionEntries(cat: AdminCat): LogEntry[] {
  return sortByDateDesc(
    cat.timeline
      .filter((event) => event.type === 'adoption' || event.type === 'foster')
      .map((event) => ({
        id: `adopt-${event.id}`,
        date: event.date,
        category: 'adoption' as const,
        title: event.title,
        description: event.description,
      })),
  );
}

function InfoRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={cn('text-right text-foreground', valueClassName)}>{value}</dd>
    </div>
  );
}

function LogEntriesList({ entries }: { entries: LogEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No records in this category yet.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border/60">
      {entries.map((entry) => (
        <article key={entry.id} className="py-4">
          <div className="flex flex-wrap items-center gap-2">
            <time className="text-sm text-foreground">{formatLogDate(entry.date)}</time>
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 text-[11px] font-medium',
                LOG_TAG_STYLES[entry.category],
              )}
            >
              {LOG_TAG_LABELS[entry.category]}
            </span>
          </div>
          <div className="mt-2 flex gap-3">
            {entry.photoUrl && (
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/30">
                <img
                  src={entry.photoUrl}
                  alt=""
                  className="h-full w-full object-cover object-center"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">{entry.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {entry.description}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function CatProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const cat = getCatById(id ?? '');
  const [activeTab, setActiveTab] = useState<ProfileTab>(() =>
    searchParams.get('careTask') === '1' ? 'medical' : 'profile',
  );
  const [idealAdopterDraft, setIdealAdopterDraft] = useState('');
  const [idealAdopterSaved, setIdealAdopterSaved] = useState(false);
  const [careTaskFormOpen, setCareTaskFormOpen] = useState(
    () => searchParams.get('careTask') === '1',
  );
  const [careUpdateVersion, setCareUpdateVersion] = useState(0);
  const [, setIncidentVersion] = useState(0);
  const teamTasks = useTeamTasks();
  const { donors } = useDonors();
  const { applications } = useAdoptionApplications();
  const activeAdoption = useMemo(
    () => (cat ? getActiveApplicationForCat(cat.id) : null),
    [cat?.id, applications],
  );
  const [healthDraft, setHealthDraft] = useState<HealthStatus>('healthy');
  const [placementDraft, setPlacementDraft] = useState<CatPlacement>('shelter');
  const [pipelineDraft, setPipelineDraft] = useState<AdoptionPipelineStatus>('available');
  const [profileFieldsSaved, setProfileFieldsSaved] = useState(false);
  const catSupporters = useMemo(
    () => (cat ? getDonorsForCat(cat.id, donors) : []),
    [cat, donors],
  );
  const supplyTaskId = searchParams.get('supplyTask');
  const incidentId = searchParams.get('incident');
  const incident = incidentId ? getIncidentReportById(incidentId) : null;
  const pendingSupplyTask = useMemo(() => {
    if (!cat) return null;
    if (supplyTaskId) {
      const match = teamTasks.find((task) => task.id === supplyTaskId);
      if (match && isUnassignedSupplyRequest(match)) return match;
    }
    return (
      teamTasks.find(
        (task) =>
          task.catId === cat.id &&
          task.status === 'pending' &&
          isUnassignedSupplyRequest(task),
      ) ?? null
    );
  }, [cat, supplyTaskId, teamTasks]);

  useEffect(() => {
    if (!cat) return;
    setIdealAdopterDraft(
      getIdealAdopterDescription(cat.id) ?? cat.idealAdopterDescription ?? '',
    );
    setIdealAdopterSaved(false);
    setHealthDraft(cat.health);
    setPlacementDraft(cat.placement);
    setPipelineDraft(cat.adoptionPipeline);
    setProfileFieldsSaved(false);
  }, [cat?.id, cat?.health, cat?.placement, cat?.adoptionPipeline]);

  useEffect(() => {
    const unsubscribe = subscribeCatCareUpdates(() => {
      setCareUpdateVersion((value) => value + 1);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeIncidentReports(() => {
      setIncidentVersion((value) => value + 1);
    });
    return unsubscribe;
  }, []);

  const timelineEntries = useMemo(() => {
    void careUpdateVersion;
    return cat ? buildTimelineEntries(cat) : [];
  }, [cat, careUpdateVersion]);
  const medicalEntries = useMemo(() => (cat ? buildMedicalEntries(cat) : []), [cat]);
  const adoptionEntries = useMemo(() => (cat ? buildAdoptionEntries(cat) : []), [cat]);

  const fosterCaregiverId = cat ? getFosterCaregiverIdForCat(cat) : null;
  const fosterCaregiver = fosterCaregiverId ? getCaregiverById(fosterCaregiverId) : null;

  if (!cat) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Cat not found.</p>
        <PageBackLink to="/admin/cats" className="mb-0 mt-4">
          Back to cats
        </PageBackLink>
      </div>
    );
  }

  const adoption = getAdoptionPipelineDisplay(cat);
  const health = healthConfig[cat.health];
  const days = shelterDays(cat.intakeDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="-mx-4 -mb-4 flex min-h-0 flex-1 flex-col bg-muted/35 px-6 pb-5 pt-0 sm:-mx-6 lg:-mx-8"
    >
      <PageBackLink to="/admin/cats">Back to cats</PageBackLink>

      {incident && incident.status === 'new' && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Emergency report — needs acknowledgment</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Reported by {incident.reporterName}: {incident.description.trim() || 'Photo evidence attached'}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => acknowledgeIncidentReport(incident.id)}
          >
            Acknowledge
          </Button>
        </div>
      )}

      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="admin-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-6">
            <div className="mb-4 border-b border-border/60 pb-4">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{cat.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-sm text-muted-foreground">
                  {catRefId(cat.id)} · {cat.age} · {cat.breed}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={adoption.variant}>{adoption.label}</Badge>
                  <Badge variant={health.variant}>{health.label}</Badge>
                </div>
              </div>
            </div>

            {(activeAdoption || (fosterCaregiverId && fosterCaregiver)) && (
              <div className="mb-4 space-y-3">
                {activeAdoption && (
                  <div className="rounded-lg border border-sky/20 bg-sky/5 px-4 py-3 text-sm">
                    <p className="font-medium text-foreground">
                      Active adoption application — {activeAdoption.applicantName}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Stage: {activeAdoption.stage} · submitted {formatDate(activeAdoption.submittedDate)}
                    </p>
                    <Link
                      to={`/admin/adoption/${activeAdoption.id}`}
                      className="mt-2 inline-flex text-sm font-medium text-primary hover:underline"
                    >
                      View adoption application
                    </Link>
                  </div>
                )}
                {fosterCaregiverId && fosterCaregiver && (
                  <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
                    <p className="font-medium text-foreground">
                      In foster care with {fosterCaregiver.name}
                    </p>
                    <Link
                      to={`/admin/caregivers/${fosterCaregiverId}`}
                      className="mt-2 inline-flex text-sm font-medium text-primary hover:underline"
                    >
                      View foster caregiver profile
                    </Link>
                  </div>
                )}
              </div>
            )}

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ProfileTab)}>
              <TabsList className="h-9 w-full">
                <TabsTrigger value="profile" className="flex-1 text-xs">
                  Profile
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex-1 text-xs">
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="medical" className="flex-1 text-xs">
                  Medical
                </TabsTrigger>
                <TabsTrigger value="adoption" className="flex-1 text-xs">
                  Adoption
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="mt-4 space-y-6">
                {pendingSupplyTask && (
                  <AssignSupplyRequestPanel task={pendingSupplyTask} />
                )}

                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <CatPhotoGallery cat={cat} className="mx-auto shrink-0 sm:mx-0" />

                  <div className="min-w-0 flex-1 space-y-6">
                    <dl className="divide-y divide-border/60">
                      <InfoRow label="ID" value={catRefId(cat.id)} />
                      <InfoRow label="Age estimate" value={cat.age} />
                      <InfoRow
                        label="Placement"
                        value={`${getPlacementLabel(cat)} · ${days} days in shelter`}
                        valueClassName={days >= 90 ? 'text-destructive' : undefined}
                      />
                    </dl>

                    <section className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-sm font-semibold text-foreground">Status overrides</h2>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Demo edits saved locally for this browser session.
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {profileFieldsSaved && (
                            <span className="text-xs font-medium text-sage-dark">Saved</span>
                          )}
                          <Button
                            size="sm"
                            onClick={() => {
                              saveCatProfileFields(cat.id, {
                                health: healthDraft,
                                placement: placementDraft,
                                adoptionPipeline: pipelineDraft,
                              });
                              setProfileFieldsSaved(true);
                            }}
                          >
                            Save status
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground" htmlFor="cat-health">
                            Health
                          </label>
                          <select
                            id="cat-health"
                            value={healthDraft}
                            onChange={(event) => {
                              setHealthDraft(event.target.value as HealthStatus);
                              setProfileFieldsSaved(false);
                            }}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            {HEALTH_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground" htmlFor="cat-placement">
                            Placement
                          </label>
                          <select
                            id="cat-placement"
                            value={placementDraft}
                            onChange={(event) => {
                              setPlacementDraft(event.target.value as CatPlacement);
                              setProfileFieldsSaved(false);
                            }}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            {Object.entries(placementConfig).map(([value, config]) => (
                              <option key={value} value={value}>
                                {config.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground" htmlFor="cat-pipeline">
                            Adoption pipeline
                          </label>
                          <select
                            id="cat-pipeline"
                            value={pipelineDraft}
                            onChange={(event) => {
                              setPipelineDraft(event.target.value as AdoptionPipelineStatus);
                              setProfileFieldsSaved(false);
                            }}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            {ADOPTION_PIPELINE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Personality
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {cat.personality.map((trait) => (
                          <Badge key={trait} variant="outline" className="rounded-full px-3 py-1">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>

                {catSupporters.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Supporters
                    </h2>
                    <div className="divide-y divide-border/60 rounded-lg border border-border bg-muted/20">
                      {catSupporters.map(({ donor, catTotal }) => (
                        <Link
                          key={donor.id}
                          to={`/admin/donors/${donor.id}`}
                          className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{donor.name}</p>
                            <p className="text-xs text-muted-foreground">{donor.email}</p>
                          </div>
                          <p className="shrink-0 text-sm font-medium text-foreground">
                            {formatCurrency(catTotal)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {fosterCaregiverId && fosterCaregiver && (
                  <section className="rounded-lg border border-border bg-muted/20 p-4">
                    <OpenTasksSummary assigneeId={fosterCaregiverId} />
                  </section>
                )}
              </TabsContent>

              <TabsContent value="timeline" className="mt-4">
                <LogEntriesList entries={timelineEntries} />
              </TabsContent>

              <TabsContent value="medical" className="mt-4 space-y-4">
                {fosterCaregiverId && (
                  <section className="rounded-lg border border-border bg-muted/20 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-semibold text-foreground">Foster care tasks</h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Assign medical or daily care to {fosterCaregiver?.name ?? 'foster parent'}.
                        </p>
                      </div>
                      {!careTaskFormOpen && (
                        <Button size="sm" variant="outline" onClick={() => setCareTaskFormOpen(true)}>
                          Assign care task
                        </Button>
                      )}
                    </div>
                    {careTaskFormOpen && (
                      <AssignTaskForm
                        assigneeId={fosterCaregiverId}
                        catId={cat.id}
                        catName={cat.name}
                        defaultType="medication"
                        onAssigned={() => setCareTaskFormOpen(false)}
                        onCancel={() => setCareTaskFormOpen(false)}
                      />
                    )}
                  </section>
                )}
                <LogEntriesList entries={medicalEntries} />
              </TabsContent>

              <TabsContent value="adoption" className="mt-4 space-y-4">
                <section className="rounded-lg border border-border bg-muted/20 p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h2 className="text-sm font-semibold text-foreground">Ideal adopter profile</h2>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {idealAdopterSaved && (
                        <span className="text-xs font-medium text-sage-dark">Saved</span>
                      )}
                      <Button
                        size="sm"
                        disabled={!idealAdopterDraft.trim()}
                        onClick={() => {
                          saveIdealAdopterDescription(cat.id, idealAdopterDraft);
                          setIdealAdopterSaved(true);
                        }}
                      >
                        Save profile
                      </Button>
                    </div>
                  </div>
                  <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                    Describe who this cat is best suited for. This guides AI matching when reviewing new adoptions.
                  </p>
                  <textarea
                    value={idealAdopterDraft}
                    onChange={(event) => {
                      setIdealAdopterDraft(event.target.value);
                      setIdealAdopterSaved(false);
                    }}
                    rows={4}
                    placeholder="e.g. A calm adult-only home with patience for a shy cat..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </section>
                <LogEntriesList entries={adoptionEntries} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
