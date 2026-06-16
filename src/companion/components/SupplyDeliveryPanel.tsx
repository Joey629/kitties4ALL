import { useMemo } from 'react';
import { MapPin, Package, User } from 'lucide-react';
import { Card, CardContent } from '@/admin/components/ui/card';
import { cn } from '@/admin/lib/utils';
import { getCaregiverById } from '@/shared/caregivers';
import type { CareTask } from '../types';

interface SupplyDeliveryPanelProps {
  task: CareTask;
  checked: Record<string, boolean>;
  onToggle: (itemId: string) => void;
  deliveryNote: string;
  onDeliveryNoteChange: (value: string) => void;
}

export function SupplyDeliveryPanel({
  task,
  checked,
  onToggle,
  deliveryNote,
  onDeliveryNoteChange,
}: SupplyDeliveryPanelProps) {
  const items = task.supplyRequest?.items ?? [];

  const foster = useMemo(() => {
    const requesterId = task.supplyRequest?.requestedById;
    return requesterId ? getCaregiverById(requesterId) : null;
  }, [task.supplyRequest?.requestedById]);

  const allChecked = items.length > 0 && items.every((item) => checked[item.id]);

  return (
    <Card className="mb-4 border-primary/20">
      <CardContent className="space-y-4 p-5">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Supply delivery
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick up items from the shelter and deliver to the foster home. Check off each item before completing.
          </p>
          {task.supplyRequest?.source === 'foster_resupply' && (
            <p className="mt-1 text-xs font-medium text-primary">Foster resupply request</p>
          )}
        </div>

        {foster && (
          <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
            <p className="flex items-center gap-2 font-medium text-foreground">
              <User className="h-4 w-4 text-muted-foreground" />
              Deliver to {foster.name}
            </p>
            <p className="mt-1 flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Foster home · {task.catName}&apos;s placement</span>
            </p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Delivery checklist
          </p>
          {items.map((item) => {
            const isChecked = Boolean(checked[item.id]);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggle(item.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors',
                  isChecked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-xs',
                    isChecked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40',
                  )}
                >
                  {isChecked ? '✓' : ''}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    Qty {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="delivery-note"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Delivery note (optional)
          </label>
          <textarea
            id="delivery-note"
            value={deliveryNote}
            onChange={(event) => onDeliveryNoteChange(event.target.value)}
            rows={2}
            placeholder="Left at front door, handed to foster parent, etc."
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {!allChecked && (
          <p className="text-xs text-muted-foreground">
            Check all {items.length} items before marking this delivery complete.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function isSupplyDeliveryComplete(task: CareTask, checked: Record<string, boolean>) {
  const items = task.supplyRequest?.items ?? [];
  return items.length > 0 && items.every((item) => checked[item.id]);
}
