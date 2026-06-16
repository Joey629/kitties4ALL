import { ClipboardList, Package } from 'lucide-react';
import { Button } from '@/admin/components/ui/button';
import {
  isPendingFosterApplication,
  type FosterApplication,
} from '@/shared/fosterWorkflow';
import type { TeamTask } from '@/shared/teamTasks';

interface FosterOperationalAlertsCellProps {
  fosterApplication?: FosterApplication;
  supplyRequests: TeamTask[];
  onOpenApplication: () => void;
  onOpenSupply: (task: TeamTask) => void;
}

export function FosterOperationalAlertsCell({
  fosterApplication,
  supplyRequests,
  onOpenApplication,
  onOpenSupply,
}: FosterOperationalAlertsCellProps) {
  const applicationPending = isPendingFosterApplication(fosterApplication);
  const hasAlerts = applicationPending || supplyRequests.length > 0;

  if (!hasAlerts) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {applicationPending && fosterApplication && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 border-amber-300 bg-amber-50/80 px-2.5 text-xs text-amber-900 hover:bg-amber-100"
          onClick={(event) => {
            event.stopPropagation();
            onOpenApplication();
          }}
        >
          <ClipboardList className="h-3.5 w-3.5" />
          Application
        </Button>
      )}
      {supplyRequests.map((task) => (
        <Button
          key={task.id}
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 border-orange-300 bg-orange-50/80 px-2.5 text-xs text-orange-900 hover:bg-orange-100"
          onClick={(event) => {
            event.stopPropagation();
            onOpenSupply(task);
          }}
        >
          <Package className="h-3.5 w-3.5" />
          Supply · {task.catName}
        </Button>
      ))}
    </div>
  );
}
