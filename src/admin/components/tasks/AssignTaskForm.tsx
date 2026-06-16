import { useState } from 'react';
import type { TaskType } from '@/companion/types';
import { Button } from '@/admin/components/ui/button';
import { Input } from '@/admin/components/ui/input';
import { addManualCareTask } from '@/shared/teamTasks';
import { CARE_TASK_TYPE_OPTIONS } from '@/shared/taskAdmin';
import { cn } from '@/admin/lib/utils';

interface AssignTaskFormProps {
  assigneeId: string;
  catId?: string | null;
  catName?: string;
  defaultType?: TaskType;
  className?: string;
  onAssigned?: () => void;
  onCancel?: () => void;
}

export function AssignTaskForm({
  assigneeId,
  catId,
  catName,
  defaultType = 'feeding',
  className,
  onAssigned,
  onCancel,
}: AssignTaskFormProps) {
  const [type, setType] = useState<TaskType>(defaultType);
  const [dueTime, setDueTime] = useState('Today');
  const [instructions, setInstructions] = useState('');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    addManualCareTask({
      assigneeId,
      type,
      catId,
      catName,
      dueTime,
      instructions,
    });
    onAssigned?.();
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-3', className)}>
      <p className="text-sm font-medium text-foreground">Assign task</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Task type</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as TaskType)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            {CARE_TASK_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Due</span>
          <Input value={dueTime} onChange={(event) => setDueTime(event.target.value)} />
        </label>
      </div>
      {catName && (
        <p className="text-xs text-muted-foreground">
          For <span className="font-medium text-foreground">{catName}</span>
        </p>
      )}
      <label className="block space-y-1.5 text-sm">
        <span className="text-xs font-medium text-muted-foreground">Instructions</span>
        <textarea
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
          rows={2}
          placeholder="What should the caregiver do?"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Assign task
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
