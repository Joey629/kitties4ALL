import { MapPin } from 'lucide-react';
import { Badge } from '@/admin/components/ui/badge';
import { CatPortrait } from '@/admin/components/shared/CatPortrait';
import { CatLocationDisplay } from '@/admin/components/shared/CatLocationDisplay';
import {
  getAdoptionPipelineDisplay,
  healthConfig,
} from '@/admin/lib/catDisplay';
import type { AdminCat } from '@/admin/types';
import { cn } from '@/admin/lib/utils';

interface CatCardProps {
  cat: AdminCat;
  onClick: () => void;
  className?: string;
}

export function CatCard({ cat, onClick, className }: CatCardProps) {
  const adoption = getAdoptionPipelineDisplay(cat);
  const health = healthConfig[cat.health];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'admin-card flex h-full w-full cursor-pointer flex-col rounded-xl border bg-card p-4 text-left transition-all hover:border-sage/35 hover:shadow-md',
        className,
      )}
    >
      <div className="flex gap-3">
        <CatPortrait catId={cat.id} photo={cat.photo} size={72} className="!rounded-xl" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground leading-tight">{cat.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{cat.breed}</p>
          <p className="mt-1 text-xs text-muted-foreground">{cat.age}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant={adoption.variant}>{adoption.label}</Badge>
            <Badge variant={health.variant}>{health.label}</Badge>
          </div>
        </div>
      </div>

      <div className="mt-3 border-t border-border/60 pt-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <CatLocationDisplay cat={cat} className="min-w-0" />
        </div>
      </div>

      {cat.tagline && (
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{cat.tagline}</p>
      )}
    </div>
  );
}
