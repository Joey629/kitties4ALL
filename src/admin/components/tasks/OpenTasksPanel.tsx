import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { Badge } from '@/admin/components/ui/badge';
import { Button } from '@/admin/components/ui/button';
import { AssignTaskForm } from '@/admin/components/tasks/AssignTaskForm';
import {
  getTaskAssigneeName,
  getTaskSourceLabel,
  getTaskStatusLabel,
} from '@/shared/taskAdmin';
import type { TeamTask } from '@/shared/teamTasks';
import { useTeamTasks } from '@/hooks/useTeamTasks';
import { useState } from 'react';

interface OpenTasksPanelProps {
  assigneeId: string;
  catId?: string | null;
  catName?: string;
  showAssignForm?: boolean;
  includeRelatedSupplyRequests?: boolean;
}

function taskMatchesCaregiver(
  task: TeamTask,
  assigneeId: string,
  includeRelatedSupplyRequests: boolean,
) {
  if (task.assigneeId === assigneeId) return true;
  if (!includeRelatedSupplyRequests) return false;
  return task.supplyRequest?.requestedById === assigneeId;
}

function TaskRow({ task }: { task: TeamTask }) {
  const href = task.applicationId
    ? `/admin/adoption/${task.applicationId}`
    : task.catId
      ? `/admin/cats/${task.catId}`
      : `#`;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 px-3 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/8 text-sm">
        {task.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{task.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {getTaskAssigneeName(task)} · Due {task.dueTime} · {getTaskSourceLabel(task)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <Badge variant="secondary" className="text-[10px]">
          {getTaskStatusLabel(task)}
        </Badge>
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" asChild>
          <Link to={href}>View</Link>
        </Button>
      </div>
    </div>
  );
}

export function OpenTasksPanel({
  assigneeId,
  catId,
  catName,
  showAssignForm = true,
  includeRelatedSupplyRequests = false,
}: OpenTasksPanelProps) {
  const tasks = useTeamTasks();
  const [formOpen, setFormOpen] = useState(false);
  const pending = tasks.filter(
    (task) =>
      task.status === 'pending' &&
      taskMatchesCaregiver(task, assigneeId, includeRelatedSupplyRequests) &&
      (catId ? task.catId === catId : true),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Open tasks</h2>
          <Badge variant="secondary" className="tabular-nums">
            {pending.length}
          </Badge>
        </div>
        {showAssignForm && !formOpen && (
          <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}>
            Assign task
          </Button>
        )}
      </div>

      {formOpen && (
        <AssignTaskForm
          assigneeId={assigneeId}
          catId={catId}
          catName={catName}
          onAssigned={() => setFormOpen(false)}
          onCancel={() => setFormOpen(false)}
        />
      )}

      {pending.length === 0 ? (
        <p className="rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          No pending tasks for this caregiver.
        </p>
      ) : (
        <div className="space-y-2">
          {pending.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

export function OpenTasksSummary({ assigneeId }: { assigneeId: string }) {
  const tasks = useTeamTasks();
  const pending = tasks.filter(
    (task) => task.assigneeId === assigneeId && task.status === 'pending',
  );
  if (pending.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-foreground">Foster care tasks</h2>
      <div className="space-y-2">
        {pending.slice(0, 3).map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </div>
    </section>
  );
}
