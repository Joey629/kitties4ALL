import { useState } from 'react';
import { Package } from 'lucide-react';
import { Button } from '@/admin/components/ui/button';
import { getAssignableCaregivers } from '@/shared/caregivers';
import { assignSupplyDelivery } from '@/shared/supplyRequests';
import type { TeamTask } from '@/shared/teamTasks';
import { cn } from '@/admin/lib/utils';

interface AssignSupplyRequestPanelProps {
  task: TeamTask;
  className?: string;
  onAssigned?: () => void;
}

export function AssignSupplyRequestPanel({
  task,
  className,
  onAssigned,
}: AssignSupplyRequestPanelProps) {
  const volunteers = getAssignableCaregivers().filter(
    (caregiver) => caregiver.role === 'volunteer',
  );
  const [assigneeId, setAssigneeId] = useState(volunteers[0]?.id ?? '');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!assigneeId) return;
    assignSupplyDelivery(task.id, assigneeId);
    onAssigned?.();
  }

  const items = task.supplyRequest?.items ?? [];

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('space-y-3 rounded-lg border border-soft-orange/30 bg-soft-orange/10 p-4', className)}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-soft-orange/20 text-soft-orange">
          <Package className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Supply request — assign delivery</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Requested by {task.supplyRequest?.requestedByName ?? 'foster parent'}
          </p>
        </div>
      </div>

      {items.length > 0 && (
        <ul className="space-y-1 rounded-md border border-border/60 bg-card px-3 py-2 text-xs text-foreground">
          {items.map((item) => (
            <li key={item.id}>
              {item.name} × {item.quantity}
              {item.unit ? ` ${item.unit}` : ''}
            </li>
          ))}
        </ul>
      )}

      <label className="block space-y-1.5 text-sm">
        <span className="text-xs font-medium text-muted-foreground">Assign volunteer</span>
        <select
          value={assigneeId}
          onChange={(event) => setAssigneeId(event.target.value)}
          className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
        >
          {volunteers.map((volunteer) => (
            <option key={volunteer.id} value={volunteer.id}>
              {volunteer.name}
            </option>
          ))}
        </select>
      </label>

      <Button type="submit" size="sm" disabled={!assigneeId}>
        Assign & notify volunteer
      </Button>
    </form>
  );
}
