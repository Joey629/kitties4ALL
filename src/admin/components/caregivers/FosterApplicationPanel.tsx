import { useEffect, useState } from 'react';
import { FosterApplicationReviewBody } from '@/admin/components/caregivers/FosterApplicationReviewBody';
import {
  getFosterApplicationForCaregiver,
  subscribeFosterWorkflow,
} from '@/shared/fosterWorkflow';

interface FosterApplicationPanelProps {
  caregiverId: string;
  caregiverName: string;
}

export function FosterApplicationPanel({
  caregiverId,
  caregiverName,
}: FosterApplicationPanelProps) {
  const [hasApplication, setHasApplication] = useState(() =>
    Boolean(getFosterApplicationForCaregiver(caregiverId)),
  );

  useEffect(() => {
    const refresh = () => {
      setHasApplication(Boolean(getFosterApplicationForCaregiver(caregiverId)));
    };
    refresh();
    return subscribeFosterWorkflow(refresh);
  }, [caregiverId]);

  if (!hasApplication) return null;

  return (
    <section className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Foster application
      </h2>
      <FosterApplicationReviewBody
        caregiverId={caregiverId}
        caregiverName={caregiverName}
        markUnderReviewOnOpen
      />
    </section>
  );
}
