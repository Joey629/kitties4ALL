import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus, LayoutList, LayoutGrid, ChevronDown } from 'lucide-react';
import { PageHeader } from '@/admin/components/shared/PageHeader';
import { PageToolbar } from '@/admin/components/shared/PageToolbar';
import { MultiSelectFilter } from '@/admin/components/shared/MultiSelectFilter';
import { Button } from '@/admin/components/ui/button';
import { Input } from '@/admin/components/ui/input';
import { Badge } from '@/admin/components/ui/badge';
import { CatPortrait } from '@/admin/components/shared/CatPortrait';
import { CatCard } from '@/admin/components/shared/CatCard';
import { CatLocationDisplay } from '@/admin/components/shared/CatLocationDisplay';
import { DataTableShell } from '@/admin/components/shared/DataTableShell';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/admin/components/ui/table';
import { getAllCats } from '@/admin/data/mock';
import { subscribeCompanionIntakeCats } from '@/shared/companionIntakeCats';
import { daysSince } from '@/admin/lib/dashboardData';
import {
  ADOPTION_PIPELINE_OPTIONS,
  HEALTH_OPTIONS,
  getAdoptionPipelineDisplay,
  getEffectiveAdoptionPipeline,
  healthConfig,
} from '@/admin/lib/catDisplay';
import { cn, formatDate } from '@/admin/lib/utils';
import type { AdoptionPipelineStatus, HealthStatus } from '@/admin/types';

type ViewMode = 'table' | 'card';

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (mode: ViewMode) => void }) {
  return (
    <div className="inline-flex shrink-0 items-center rounded-lg border border-border bg-muted p-1">
      <button
        type="button"
        aria-label="Table view"
        aria-pressed={value === 'table'}
        onClick={() => onChange('table')}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-md transition-all',
          value === 'table' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <LayoutList className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Card view"
        aria-pressed={value === 'card'}
        onClick={() => onChange('card')}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-md transition-all',
          value === 'card' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
    </div>
  );
}

export function CatsPage() {
  const navigate = useNavigate();
  const [adoptionFilters, setAdoptionFilters] = useState<AdoptionPipelineStatus[]>([]);
  const [healthFilters, setHealthFilters] = useState<HealthStatus[]>([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [cats, setCats] = useState(() => getAllCats());
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeCompanionIntakeCats(() => setCats(getAllCats()));
    return unsubscribe;
  }, []);

  const filtered = cats.filter((cat) => {
    const effectivePipeline = getEffectiveAdoptionPipeline(cat);
    const matchesAdoption =
      adoptionFilters.length === 0 || adoptionFilters.includes(effectivePipeline);
    const matchesHealth = healthFilters.length === 0 || healthFilters.includes(cat.health);
    const matchesSearch =
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.breed.toLowerCase().includes(search.toLowerCase());
    return matchesAdoption && matchesHealth && matchesSearch;
  });

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((cat) => selectedIds.has(cat.id));
  const someFilteredSelected =
    filtered.some((cat) => selectedIds.has(cat.id)) && !allFilteredSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someFilteredSelected;
    }
  }, [someFilteredSelected]);

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach((cat) => next.delete(cat.id));
      } else {
        filtered.forEach((cat) => next.add(cat.id));
      }
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCat = (id: string) => navigate(`/admin/cats/${id}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex h-full min-h-0 flex-col"
    >
      <PageHeader
        title="Cats"
        description="Every cat has a story. Manage their journey from intake to adoption."
        actions={
          <Button size="sm" onClick={() => navigate('/admin/cats/new')}>
            <Plus className="h-4 w-4" />
            Intake cats
          </Button>
        }
      />

      <PageToolbar className="lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full min-w-[12rem] max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or breed..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <MultiSelectFilter
            label="Adoption"
            options={ADOPTION_PIPELINE_OPTIONS}
            selected={adoptionFilters}
            onChange={setAdoptionFilters}
          />
          <MultiSelectFilter
            label="Health"
            options={HEALTH_OPTIONS}
            selected={healthFilters}
            onChange={setHealthFilters}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={selectedIds.size === 0}
            className="min-w-[9.5rem] justify-between gap-2"
          >
            Actions
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </div>
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </PageToolbar>

      {viewMode === 'table' ? (
        <DataTableShell className="mb-0 flex min-h-0 flex-1 flex-col">
          <Table containerClassName="min-h-0 flex-1 overflow-y-auto">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <div className="group relative inline-flex">
                    <label className="cursor-pointer">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-border accent-primary"
                        aria-label="Select all"
                      />
                    </label>
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden w-max -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-[10px] font-medium text-background shadow-sm group-hover:block"
                    >
                      Select all
                    </span>
                  </div>
                </TableHead>
                <TableHead className="w-12" />
                <TableHead>Name</TableHead>
                <TableHead>Intake</TableHead>
                <TableHead>Adoption</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>In shelter</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cat) => {
                const adoption = getAdoptionPipelineDisplay(cat);
                const health = healthConfig[cat.health];
                const shelterDays = daysSince(cat.intakeDate);
                const isSelected = selectedIds.has(cat.id);
                return (
                  <TableRow
                    key={cat.id}
                    className={cn(isSelected && 'bg-primary/5')}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(cat.id)}
                        className="h-4 w-4 rounded border-border accent-primary"
                        aria-label={`Select ${cat.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="h-8 w-8 overflow-hidden rounded-lg">
                        <CatPortrait catId={cat.id} photo={cat.photo} size={32} className="!rounded-lg !border-0 !shadow-none" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        <Link
                          to={`/admin/cats/${cat.id}`}
                          className="text-primary underline underline-offset-2 transition-colors hover:text-primary/80"
                        >
                          {cat.name}
                        </Link>
                        <span className="font-normal text-muted-foreground"> · {cat.age} · {cat.breed}</span>
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(cat.intakeDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={adoption.variant}>{adoption.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={health.variant}>{health.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'text-sm tabular-nums',
                          shelterDays >= 90 ? 'font-semibold text-destructive' : 'text-muted-foreground',
                        )}
                      >
                        {shelterDays}d
                      </span>
                    </TableCell>
                    <TableCell>
                      <CatLocationDisplay cat={cat} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DataTableShell>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto pb-1">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((cat) => (
              <CatCard key={cat.id} cat={cat} onClick={() => openCat(cat.id)} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
              No cats match your search.
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
