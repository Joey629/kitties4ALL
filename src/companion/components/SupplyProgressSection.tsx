import { useEffect, useMemo, useState } from 'react';
import { Package, AlertTriangle } from 'lucide-react';
import { Button } from '@/admin/components/ui/button';
import { Card, CardContent } from '@/admin/components/ui/card';
import {
  getCatSupplyStatuses,
  hasLowSupplies,
  subscribeCatSupplyBundles,
  type CatSupplyStatus,
} from '@/shared/catSupplies';
import { cn } from '@/admin/lib/utils';

function SupplyProgressBar({ item }: { item: CatSupplyStatus }) {
  const barColor =
    item.remainingPercent <= 20
      ? 'bg-destructive'
      : item.remainingPercent <= 40
        ? 'bg-soft-orange'
        : 'bg-sage-dark';

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{item.name}</p>
          <p className="text-xs text-muted-foreground">
            ~{item.daysRemaining} day{item.daysRemaining === 1 ? '' : 's'} left at current use
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 text-sm font-semibold tabular-nums',
            item.isLow ? 'text-destructive' : 'text-foreground',
          )}
        >
          {item.remainingPercent}%
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${Math.max(item.remainingPercent, 4)}%` }}
        />
      </div>
    </div>
  );
}

interface SupplyProgressSectionProps {
  catId: string;
  catName: string;
  onResupply: () => void;
}

export function SupplyProgressSection({ catId, catName, onResupply }: SupplyProgressSectionProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeCatSupplyBundles(() => setTick((value) => value + 1));
    return unsubscribe;
  }, []);

  const supplies = useMemo(() => getCatSupplyStatuses(catId), [catId, setTick]);
  const showResupply = hasLowSupplies(catId);

  if (supplies.length === 0) return null;

  return (
    <Card className={cn(showResupply && 'border-destructive/30 bg-destructive/5')}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Supply levels
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Estimated from daily feeding — updates automatically
            </p>
          </div>
          {showResupply && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
              <AlertTriangle className="h-3 w-3" />
              Low
            </span>
          )}
        </div>

        <div className="space-y-4">
          {supplies.map((item) => (
            <SupplyProgressBar key={item.id} item={item} />
          ))}
        </div>

        <Button
          type="button"
          variant={showResupply ? 'default' : 'outline'}
          className="h-11 w-full rounded-xl text-base"
          onClick={onResupply}
        >
          {showResupply ? `One-tap resupply for ${catName}` : `Request resupply for ${catName}`}
        </Button>
      </CardContent>
    </Card>
  );
}
