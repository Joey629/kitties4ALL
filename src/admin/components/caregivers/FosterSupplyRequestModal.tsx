import { Package, X } from 'lucide-react';
import { Button } from '@/admin/components/ui/button';
import { Badge } from '@/admin/components/ui/badge';
import { AssignSupplyRequestPanel } from '@/admin/components/tasks/AssignSupplyRequestPanel';
import { isUnassignedSupplyRequest, type TeamTask } from '@/shared/teamTasks';

interface FosterSupplyRequestModalProps {
  open: boolean;
  task: TeamTask | null;
  onClose: () => void;
  onAssigned?: () => void;
}

export function FosterSupplyRequestModal({
  open,
  task,
  onClose,
  onAssigned,
}: FosterSupplyRequestModalProps) {
  if (!open || !task) return null;

  const items = task.supplyRequest?.items ?? [];
  const unassigned = isUnassignedSupplyRequest(task);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close supply request"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-800">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Supply request</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {task.catName} · requested by {task.supplyRequest?.requestedByName ?? 'foster parent'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={unassigned ? 'warning' : 'secondary'}>
              {unassigned ? 'Awaiting assignment' : 'Delivery assigned'}
            </Badge>
            <span className="text-xs text-muted-foreground">Due {task.dueTime}</span>
          </div>

          {items.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Requested items
              </p>
              <ul className="space-y-1 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm">
                {items.map((item) => (
                  <li key={item.id}>
                    {item.name} × {item.quantity}
                    {item.unit ? ` ${item.unit}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {task.supplyRequest?.notes && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notes
              </p>
              <p className="text-sm text-foreground">{task.supplyRequest.notes}</p>
            </div>
          )}

          {task.instructions && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Instructions
              </p>
              <p className="text-sm text-muted-foreground">{task.instructions}</p>
            </div>
          )}

          {unassigned ? (
            <AssignSupplyRequestPanel
              task={task}
              className="border-none bg-transparent p-0"
              onAssigned={() => {
                onAssigned?.();
                onClose();
              }}
            />
          ) : (
            <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              A volunteer has been assigned to deliver these supplies.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
