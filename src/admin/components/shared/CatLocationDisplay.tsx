import { Link } from 'react-router-dom';
import { getActiveFosterParent, placementConfig } from '@/admin/lib/catDisplay';
import { cn } from '@/admin/lib/utils';
import { getCaregiverByName } from '@/shared/caregivers';
import type { AdminCat } from '@/admin/types';

const placementPillClass =
  'inline-flex rounded-md px-1.5 py-0.5 text-xs font-medium text-foreground';

interface CatLocationDisplayProps {
  cat: AdminCat;
  className?: string;
}

export function CatLocationDisplay({ cat, className }: CatLocationDisplayProps) {
  const fosterParent = getActiveFosterParent(cat);
  const fosterCaregiver = fosterParent ? getCaregiverByName(fosterParent) : undefined;
  const label = placementConfig[cat.placement].label;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn(placementPillClass, 'bg-muted/60')}>
        {label}
      </span>
      {fosterParent && fosterCaregiver ? (
        <Link
          to={`/admin/caregivers/${fosterCaregiver.id}`}
          onClick={(event) => event.stopPropagation()}
          className={cn(
            placementPillClass,
            'border border-border bg-muted text-[11px] font-normal transition-colors hover:border-primary/40 hover:text-primary',
          )}
        >
          {fosterParent}
        </Link>
      ) : fosterParent ? (
        <span className={cn(placementPillClass, 'border border-border bg-muted text-[11px] font-normal')}>
          {fosterParent}
        </span>
      ) : null}
    </div>
  );
}
