import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/admin/components/shared/PageHeader';
import { DataTableShell } from '@/admin/components/shared/DataTableShell';
import { Badge } from '@/admin/components/ui/badge';
import {
  TodayTaskList,
  categoryBadgeVariant,
} from '@/admin/components/tasks/TodayTaskList';
import { useTodayTasksFeed } from '@/hooks/useTodayTasksFeed';
import { cn } from '@/admin/lib/utils';
import {
  TODAY_TASK_CATEGORY_ORDER,
  type TodayTaskCategory,
  type TasksAndAlertsRow,
} from '@/shared/taskAdmin';

const TAB_OPTIONS = ['all', ...TODAY_TASK_CATEGORY_ORDER] as const;
type TaskTab = (typeof TAB_OPTIONS)[number];

const TAB_LABELS: Record<TodayTaskCategory, string> = {
  emergency: 'Emergency',
  health: 'Health',
  supply: 'Supply',
  approval: 'Approvals',
};

function parseTaskTab(value: string | null): TaskTab {
  if (value && TAB_OPTIONS.includes(value as TaskTab)) {
    return value as TaskTab;
  }
  return 'all';
}

function filterTasks(tab: TaskTab, items: TasksAndAlertsRow[]) {
  if (tab === 'all') return items;
  return items.filter((item) => item.category === tab);
}

function countByCategory(items: TasksAndAlertsRow[], category: TodayTaskCategory) {
  return items.filter((item) => item.category === category).length;
}

export function TodayTasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseTaskTab(searchParams.get('tab'));
  const highlightId = searchParams.get('highlight');
  const tasks = useTodayTasksFeed();
  const filteredTasks = filterTasks(activeTab, tasks);

  useEffect(() => {
    if (!highlightId) return;
    const match = tasks.find((item) => item.id === highlightId);
    if (!match) return;
    if (activeTab !== 'all' && activeTab !== match.category) {
      setSearchParams({ tab: match.category, highlight: highlightId });
    }
  }, [activeTab, highlightId, setSearchParams, tasks]);

  const handleCategoryClick = (category: TodayTaskCategory) => {
    if (activeTab === category) {
      if (highlightId) {
        setSearchParams({ highlight: highlightId });
      } else {
        setSearchParams({});
      }
      return;
    }
    if (highlightId) {
      setSearchParams({ tab: category, highlight: highlightId });
    } else {
      setSearchParams({ tab: category });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Today's tasks"
        description="Operational queue sorted by urgency — emergency, health, supply, and approvals"
        descriptionClassName="max-w-none whitespace-nowrap"
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {TODAY_TASK_CATEGORY_ORDER.map((category) => {
          const count = countByCategory(tasks, category);
          const isActive = activeTab === category;

          return (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryClick(category)}
              className={cn(
                'rounded-xl border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/30',
                isActive
                  ? 'border-2 border-blue-600 shadow-sm'
                  : 'border border-border',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant={categoryBadgeVariant(category)} className="text-[10px]">
                  {TAB_LABELS[category]}
                </Badge>
                <span className="text-lg font-semibold tabular-nums text-foreground">{count}</span>
              </div>
            </button>
          );
        })}
      </div>

      <DataTableShell className="mb-0">
        <TodayTaskList items={filteredTasks} highlightId={highlightId} />
      </DataTableShell>
    </motion.div>
  );
}
