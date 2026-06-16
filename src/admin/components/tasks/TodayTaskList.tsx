import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Badge } from '@/admin/components/ui/badge';
import { TaskFeedActionsMenu } from '@/admin/components/tasks/TaskFeedActionsMenu';
import { cn } from '@/admin/lib/utils';
import type { TasksAndAlertsRow, TodayTaskCategory } from '@/shared/taskAdmin';

const INSET_DIVIDER =
  'after:absolute after:bottom-0 after:left-6 after:right-6 after:border-b after:border-neutral-300';

export function categoryBadgeVariant(
  category: TodayTaskCategory,
): 'danger' | 'warning' | 'secondary' | 'default' {
  if (category === 'emergency') return 'danger';
  if (category === 'health') return 'warning';
  if (category === 'supply') return 'default';
  return 'secondary';
}

function statusBadgeVariant(status: string): 'danger' | 'success' | 'secondary' {
  if (status === 'Urgent') return 'danger';
  if (status === 'Completed') return 'success';
  return 'secondary';
}

function TaskMetaLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
      <span className="font-medium text-foreground/80">{label}: </span>
      {value}
    </p>
  );
}

export function TodayTaskRow({
  row,
  compact = false,
  highlighted = false,
}: {
  row: TasksAndAlertsRow;
  compact?: boolean;
  highlighted?: boolean;
}) {
  const primaryAction = row.actions[0];
  const rowRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (highlighted && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlighted]);

  return (
    <article
      ref={rowRef}
      id={`task-${row.id}`}
      className={cn(
        'min-w-0 rounded-lg transition-colors',
        highlighted && 'ring-2 ring-primary/40 bg-primary/5 -mx-2 px-2 py-1',
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={categoryBadgeVariant(row.category)} className="text-[10px]">
              {row.categoryLabel}
            </Badge>
            <Badge variant={statusBadgeVariant(row.status)} className="text-[10px]">
              {row.status}
            </Badge>
          </div>

          <h3 className="text-sm font-semibold leading-snug text-foreground">{row.title}</h3>

          <div className="space-y-1">
            <TaskMetaLine label="Subject" value={row.objectDetail} />
            <TaskMetaLine label="From" value={row.reporterDetail} />
            <TaskMetaLine label="When" value={row.timeDetail} />
          </div>

          {row.description && (
            <p
              className={cn(
                'text-sm leading-relaxed text-foreground/90 break-words whitespace-pre-wrap',
                compact && 'line-clamp-3',
              )}
            >
              {row.description}
            </p>
          )}

          {compact && row.description && row.description.length > 120 && (
            <Link
              to={`/admin/tasks?highlight=${encodeURIComponent(row.id)}`}
              className="inline-flex text-xs font-medium text-primary hover:underline"
            >
              Read full details
            </Link>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
          {primaryAction && (
            <TaskFeedActionsMenu
              actions={row.actions}
              className={compact ? undefined : 'sm:mt-1'}
            />
          )}
        </div>
      </div>
    </article>
  );
}

export function TodayTaskList({
  items,
  compact = false,
  className,
  highlightId,
}: {
  items: TasksAndAlertsRow[];
  compact?: boolean;
  className?: string;
  highlightId?: string | null;
}) {
  if (items.length === 0) {
    return (
      <p className="px-5 py-6 text-center text-sm text-muted-foreground">
        No tasks right now.
      </p>
    );
  }

  return (
    <div className={className}>
      {items.map((row, index) => (
        <div
          key={row.id}
          className={cn(
            'relative px-5 py-4',
            index < items.length - 1 && INSET_DIVIDER,
          )}
        >
          <TodayTaskRow
            row={row}
            compact={compact}
            highlighted={highlightId === row.id}
          />
        </div>
      ))}
    </div>
  );
}
