import { ClipboardList, X } from 'lucide-react';
import { Button } from '@/admin/components/ui/button';
import { FosterApplicationReviewBody } from '@/admin/components/caregivers/FosterApplicationReviewBody';

interface FosterApplicationReviewModalProps {
  open: boolean;
  caregiverId: string | null;
  caregiverName: string;
  onClose: () => void;
  onReviewed?: () => void;
}

export function FosterApplicationReviewModal({
  open,
  caregiverId,
  caregiverName,
  onClose,
  onReviewed,
}: FosterApplicationReviewModalProps) {
  if (!open || !caregiverId) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close foster application review"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Foster application</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Review and approve or reject this application.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <FosterApplicationReviewBody
            caregiverId={caregiverId}
            caregiverName={caregiverName}
            markUnderReviewOnOpen
            onReviewed={onReviewed}
          />
        </div>
      </div>
    </div>
  );
}
