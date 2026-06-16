import type { Cat } from '@/types/cat';
import { getAdoptionCatSnapshot } from '@/shared/adoptionMatch';

interface AdoptionCatSnapshotProps {
  cat: Cat;
  compact?: boolean;
}

export function AdoptionCatSnapshot({ cat, compact = false }: AdoptionCatSnapshotProps) {
  const snapshot = getAdoptionCatSnapshot(cat);

  return (
    <div className={compact ? 'space-y-2.5' : 'space-y-3'}>
      <p className="text-sm leading-relaxed text-charcoal/70">{snapshot.tagline}</p>

      <dl className="grid gap-2 text-sm">
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wide text-charcoal/45">Health</dt>
          <dd className="text-charcoal/75">{snapshot.health}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wide text-charcoal/45">Personality</dt>
          <dd className="flex flex-wrap gap-1">
            {snapshot.personality.map((trait) => (
              <span
                key={trait}
                className="rounded-full border border-warm-brown/12 bg-white px-2 py-0.5 text-xs font-medium text-warm-brown"
              >
                {trait}
              </span>
            ))}
          </dd>
        </div>
      </dl>
    </div>
  );
}
