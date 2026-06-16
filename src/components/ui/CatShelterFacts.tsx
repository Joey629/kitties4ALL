import {
  daysInShelter,
  formatHealthStatus,
  getCatShelterProfile,
} from '@/shared/catShelterRecords';
import { formatDate } from '@/admin/lib/utils';

interface CatShelterFactsProps {
  catId: string;
  showRecentRecords?: boolean;
}

export function CatShelterFacts({ catId, showRecentRecords = false }: CatShelterFactsProps) {
  const shelterProfile = getCatShelterProfile(catId);
  if (!shelterProfile) return null;

  return (
    <div className="space-y-4">
      <dl className="grid gap-2 text-sm text-charcoal/75">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/45">
            In shelter
          </dt>
          <dd>
            Since {formatDate(shelterProfile.intakeDate)} · {daysInShelter(shelterProfile.intakeDate)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/45">
            Current spot
          </dt>
          <dd>{shelterProfile.location}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/45">
            Health
          </dt>
          <dd>{formatHealthStatus(shelterProfile.health)}</dd>
        </div>
      </dl>

      {showRecentRecords && shelterProfile.timeline.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-charcoal/45">
            Recent shelter records
          </p>
          <ul className="space-y-2">
            {shelterProfile.timeline.slice(-2).map((event) => (
              <li
                key={event.id}
                className="rounded-lg border border-warm-brown/10 bg-muted/25 px-3 py-2 text-left"
              >
                <p className="text-sm font-medium text-warm-brown">{event.title}</p>
                <p className="text-xs text-charcoal/45">{formatDate(event.date)}</p>
                <p className="mt-1 text-xs leading-relaxed text-charcoal/65">{event.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
