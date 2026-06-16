import { AlertTriangle } from 'lucide-react';
import { Button } from '@/admin/components/ui/button';

interface EmergencyReportButtonProps {
  onActivate: () => void;
}

export function EmergencyReportButton({ onActivate }: EmergencyReportButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 shrink-0 gap-1.5 border-coral/30 bg-coral/8 px-2.5 text-coral hover:bg-coral/12 hover:text-coral"
      onClick={onActivate}
      aria-label="Submit emergency report"
    >
      <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.25} />
      <span className="text-[11px] font-semibold">Emergency</span>
    </Button>
  );
}
