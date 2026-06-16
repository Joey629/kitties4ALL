import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FosterApplicationPanel } from '@/admin/components/caregivers/FosterApplicationPanel';
import { CatPortrait } from '@/admin/components/shared/CatPortrait';
import { Badge } from '@/admin/components/ui/badge';
import {
  fosterCatSummary,
  getFosterAssignedCats,
} from '@/admin/lib/fosterCaregiverDisplay';
import { getPlacementLabel, healthConfig } from '@/admin/lib/catDisplay';
import { getFosterApplicationForCaregiver, isPendingFosterApplication } from '@/shared/fosterWorkflow';
import { formatDate } from '@/admin/lib/utils';
import type { Caregiver } from '@/admin/types';

interface FosterAssignmentsTabProps {
  caregiver: Caregiver;
}

export function FosterAssignmentsTab({ caregiver }: FosterAssignmentsTabProps) {
  const fosterApplication = getFosterApplicationForCaregiver(caregiver.id);
  const showApplication = isPendingFosterApplication(fosterApplication);
  const assignedCats = useMemo(
    () => getFosterAssignedCats(caregiver.id),
    [caregiver.id],
  );

  if (!showApplication && assignedCats.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        No cats assigned to this foster home yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {showApplication && (
        <FosterApplicationPanel caregiverId={caregiver.id} caregiverName={caregiver.name} />
      )}

      {assignedCats.length > 0 && (
        <div className="space-y-3">
          {assignedCats.map((cat) => {
            const health = healthConfig[cat.health];
            const activeFoster = cat.fosterHistory.find((record) => record.status === 'active');

            return (
              <article
                key={cat.id}
                className="rounded-xl border border-border bg-muted/15 px-4 py-4 sm:px-5"
              >
                <div className="flex items-start gap-4">
                  <CatPortrait catId={cat.id} photo={cat.photo} size={72} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/admin/cats/${cat.id}`}
                        className="text-base font-semibold text-foreground transition-colors hover:text-primary"
                      >
                        {cat.name}
                      </Link>
                      <Badge variant="outline" className="text-[10px]">
                        {getPlacementLabel(cat)}
                      </Badge>
                      <Badge variant={health.variant} className="text-[10px]">
                        {health.label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {cat.age} · {cat.breed}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                      {fosterCatSummary(cat, caregiver)}
                    </p>
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      {activeFoster && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Foster since
                          </dt>
                          <dd className="mt-0.5 text-foreground">
                            {formatDate(activeFoster.startDate)}
                          </dd>
                        </div>
                      )}
                      {cat.lastFosterUpdate && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Last update
                          </dt>
                          <dd className="mt-0.5 text-foreground">
                            {formatDate(cat.lastFosterUpdate)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
