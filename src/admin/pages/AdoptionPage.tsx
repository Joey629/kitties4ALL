import { useMemo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Cat,
  Calendar,
  X,
  Columns3,
  Eye,
  EyeOff,
  Maximize2,
} from 'lucide-react';
import { PageHeader } from '@/admin/components/shared/PageHeader';
import { PageToolbar } from '@/admin/components/shared/PageToolbar';
import { Input } from '@/admin/components/ui/input';
import { Button } from '@/admin/components/ui/button';
import { useAdoptionApplications } from '@/hooks/useAdoptionApplications';
import {
  assignAdoptionReviewerWithTask,
  advanceAdoptionWorkflowWithTask,
  rejectAdoptionWithTask,
  reconcileAllAdoptionTeamTasks,
  unassignAdoptionReviewerWithTask,
} from '@/shared/adoptionAssignment';
import {
  getReviewSubstageLabel,
  normalizeReviewSubstage,
} from '@/shared/adoptionWorkflow';
import { AdoptionApplicationDetail } from '@/admin/components/adoption/AdoptionApplicationDetail';
import {
  ADOPTION_STAGES,
  getAssignableCaregiversList,
  applicantInitials,
  issueKey,
} from '@/admin/components/adoption/constants';
import { formatDate, cn } from '@/admin/lib/utils';
import {
  loadAdoptionBoardColumnPrefs,
  resetAdoptionBoardColumnPrefs,
  saveAdoptionBoardColumnPrefs,
  setColumnVisible,
  type AdoptionBoardColumnPrefs,
} from '@/shared/adoptionBoardColumns';
import type { AdoptionApplication, AdoptionStage } from '@/admin/types';

function daysSince(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return '1d ago';
  return `${diff}d ago`;
}

export function AdoptionPage() {
  const { applications } = useAdoptionApplications();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectPrompt, setRejectPrompt] = useState<{ appId: string } | null>(null);
  const [columnPrefs, setColumnPrefs] = useState<AdoptionBoardColumnPrefs>(() =>
    loadAdoptionBoardColumnPrefs(),
  );
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    reconcileAllAdoptionTeamTasks();
  }, []);

  const visibleStages = useMemo(
    () => ADOPTION_STAGES.filter((stage) => columnPrefs[stage.key].visible),
    [columnPrefs],
  );

  useEffect(() => {
    if (!showColumnMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
        setShowColumnMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumnMenu]);

  const updateColumnPrefs = (next: AdoptionBoardColumnPrefs) => {
    setColumnPrefs(next);
    saveAdoptionBoardColumnPrefs(next);
  };

  const toggleColumnVisible = (stage: AdoptionStage) => {
    updateColumnPrefs(setColumnVisible(columnPrefs, stage, !columnPrefs[stage].visible));
  };

  const selected = useMemo(
    () => applications.find((a) => a.id === selectedId) ?? null,
    [applications, selectedId],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return applications;
    const q = search.toLowerCase();
    return applications.filter((app) =>
      app.applicantName.toLowerCase().includes(q) ||
      app.catName.toLowerCase().includes(q) ||
      app.email.toLowerCase().includes(q) ||
      app.notes.toLowerCase().includes(q) ||
      issueKey(app.id).toLowerCase().includes(q)
    );
  }, [applications, search]);

  const handleAssign = (
    appId: string,
    caregiverId: string,
    options?: { moveToReviewing?: boolean },
  ) => {
    const caregiver = getAssignableCaregiversList().find((c) => c.id === caregiverId);
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

  const handleReject = (appId: string, reason: string) => {
    const updated = rejectAdoptionWithTask(appId, reason);
    if (!updated) return;
    setRejectPrompt(null);
    if (selectedId === appId && updated.stage === 'rejected') {
      setSelectedId(appId);
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
        title="Adoption"
        description="Track adoptions from first inquiry to forever home"
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        <PageToolbar className="shrink-0">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search adoptions, cats, emails..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="relative shrink-0" ref={columnMenuRef}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowColumnMenu((open) => !open)}
              aria-expanded={showColumnMenu}
              aria-haspopup="true"
            >
              <Columns3 className="h-4 w-4" />
              Columns
            </Button>

            {showColumnMenu && (
              <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-border bg-card p-3 shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Column management
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Show or hide board columns.
                </p>
                <ul className="mt-3 space-y-1">
                  {ADOPTION_STAGES.map((stage) => {
                    const pref = columnPrefs[stage.key];
                    const count = filtered.filter((app) => app.stage === stage.key).length;
                    return (
                      <li key={stage.key}>
                        <button
                          type="button"
                          onClick={() => toggleColumnVisible(stage.key)}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted/50"
                          aria-pressed={pref.visible}
                        >
                          {pref.visible ? (
                            <Eye className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          )}
                          <span className={cn('truncate', !pref.visible && 'text-muted-foreground')}>
                            {stage.label}
                          </span>
                          <span className="ml-auto text-xs text-muted-foreground">{count}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <button
                  type="button"
                  onClick={() => updateColumnPrefs(resetAdoptionBoardColumnPrefs())}
                  className="mt-3 w-full text-left text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Reset to default
                </button>
              </div>
            )}
          </div>
        </PageToolbar>

        <div className="min-h-0 flex-1">
        {visibleStages.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <div>
              <p className="text-sm font-medium text-foreground">No columns visible</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Open column management to show at least one stage.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setShowColumnMenu(true)}
              >
                Manage columns
              </Button>
            </div>
          </div>
        ) : (
        <div className="flex h-full w-full gap-3 overflow-x-auto">
            {visibleStages.map((stage) => {
              const cards = filtered.filter((a) => a.stage === stage.key);

              return (
                <div
                  key={stage.key}
                  className="flex min-h-0 min-w-[220px] flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card"
                >
                  <div className={cn('flex items-center gap-2 px-3 py-2.5 border-b border-border/60 shrink-0', stage.headerBg)}>
                    <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', stage.dot)} />
                    <h3 className="text-sm font-semibold flex-1 truncate">{stage.label}</h3>
                    <span className="text-xs font-medium text-muted-foreground bg-background/80 rounded-md px-2 py-0.5 min-w-[1.5rem] text-center">
                      {cards.length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]">
                    {cards.map((app) => (
                      <BoardCard
                        key={app.id}
                        app={app}
                        stage={stage}
                        isSelected={selected?.id === app.id}
                        onSelect={() => setSelectedId(selected?.id === app.id ? null : app.id)}
                      />
                    ))}
                    {cards.length === 0 && (
                      <div className="rounded-lg border border-dashed border-border/80 bg-background/50 p-4 text-center">
                        <p className="text-xs text-muted-foreground">No items</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
        )}
        </div>

        {/* Desktop floating drawer — aligned with toolbar top */}
        <AnimatePresence>
          {selected && (
            <motion.aside
              key={selected.id}
              layout={false}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="pointer-events-auto absolute inset-y-0 right-0 z-50 hidden w-[min(32rem,35%)] min-w-[18rem] flex-col overflow-hidden border-l border-border bg-card shadow-[-16px_0_40px_rgba(0,0,0,0.12)] will-change-transform lg:flex"
            >
              <DetailDrawer
                app={selected}
                onClose={() => setSelectedId(null)}
                onAssign={handleAssign}
                onUnassign={handleUnassign}
                onAdvance={handleAdvance}
                onReject={(appId) => setRejectPrompt({ appId })}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile detail drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/40"
            onClick={() => setSelectedId(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="absolute bottom-0 left-0 right-0 flex max-h-[85dvh] flex-col overflow-hidden rounded-t-2xl border border-border bg-card"
              onClick={(e) => e.stopPropagation()}
            >
              <DetailDrawer
                app={selected}
                onClose={() => setSelectedId(null)}
                onAssign={handleAssign}
                onUnassign={handleUnassign}
                onAdvance={handleAdvance}
                onReject={(appId) => setRejectPrompt({ appId })}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <RejectReasonDialog
        app={rejectPrompt ? applications.find((item) => item.id === rejectPrompt.appId) ?? null : null}
        onCancel={() => setRejectPrompt(null)}
        onConfirm={(reason) => rejectPrompt && handleReject(rejectPrompt.appId, reason)}
      />
    </motion.div>
  );
}

function BoardCard({
  app,
  stage,
  isSelected,
  onSelect,
}: {
  app: AdoptionApplication;
  stage: (typeof ADOPTION_STAGES)[number];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const assignee = app.interviewer ?? 'Unassigned';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-lg border p-3 transition-all',
        stage.cardBg,
        'hover:shadow-sm',
        isSelected
          ? cn('ring-2 shadow-sm', stage.cardBorderSelected)
          : stage.cardBorder,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[11px] font-medium text-muted-foreground">{issueKey(app.id)}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">{daysSince(app.submittedDate)}</span>
          </div>
        </div>

        <p className="text-sm font-semibold leading-snug truncate">{app.applicantName}</p>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {app.stage === 'reviewing' && (
              <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {getReviewSubstageLabel(normalizeReviewSubstage(app))}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded bg-primary/8 text-primary px-1.5 py-0.5 text-[10px] font-medium">
              <Cat className="h-3 w-3" />
              {app.catName}
            </span>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/5">
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDate(app.submittedDate)}
            </span>
            {app.stage !== 'new' && (
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold',
                  app.interviewer ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                )}
                title={assignee}
              >
                {app.interviewer ? applicantInitials(app.interviewer) : '?'}
              </span>
            )}
          </div>
      </div>
    </button>
  );
}

function DetailDrawer({
  app,
  onClose,
  onAssign,
  onUnassign,
  onAdvance,
  onReject,
}: {
  app: AdoptionApplication;
  onClose: () => void;
  onAssign: (
    appId: string,
    caregiverId: string,
    options?: { moveToReviewing?: boolean },
  ) => AdoptionApplication | null;
  onUnassign: (appId: string) => void;
  onAdvance: (appId: string) => void;
  onReject: (appId: string) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border px-4 pb-3 pt-7">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground">{issueKey(app.id)}</p>
            <Button variant="ghost" size="sm" className="h-6 shrink-0 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground" asChild>
              <Link to={`/admin/adoption/${app.id}`}>
                <Maximize2 className="h-3.5 w-3.5" />
                View full details
              </Link>
            </Button>
          </div>
          <h2 className="mt-0.5 truncate text-base font-semibold leading-snug">{app.applicantName}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AdoptionApplicationDetail
          app={app}
          onAssign={onAssign}
          onUnassign={onUnassign}
          onReject={onReject}
          onAdvance={onAdvance}
          layout="drawer"
        />
      </div>
    </div>
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
