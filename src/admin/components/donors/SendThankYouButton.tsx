import { useEffect, useRef, useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/admin/components/ui/button';
import { Input } from '@/admin/components/ui/input';
import { isDonationAcknowledged, sendThankYouForDonation } from '@/shared/donors';
import { cn } from '@/admin/lib/utils';
import type { Donor } from '@/admin/types';

interface SendThankYouButtonProps {
  donor: Donor;
  className?: string;
  onSent?: () => void;
}

export function SendThankYouButton({ donor, className, onSent }: SendThankYouButtonProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const pendingThankYous = donor.donations.filter((gift) => !isDonationAcknowledged(gift)).length;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleSend = () => {
    sendThankYouForDonation(donor.id, undefined, {
      subject: subject.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setSubject('');
    setNotes('');
    setOpen(false);
    onSent?.();
  };

  return (
    <div ref={rootRef} className={cn('relative inline-block text-left', className)}>
      <Button
        type="button"
        size="sm"
        className="shrink-0 gap-1.5"
        onClick={() => setOpen((current) => !current)}
      >
        <Mail className="h-3.5 w-3.5" />
        Send thank-you
        {pendingThankYous > 0 && (
          <span className="ml-0.5 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
            {pendingThankYous}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-4 shadow-lg">
          <p className="text-sm font-semibold text-foreground">Send thank-you</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Mark pending gifts as acknowledged and log this outreach. Demo only — no email is sent.
          </p>
          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="thank-you-subject">
                Subject
              </label>
              <Input
                id="thank-you-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Thank you for supporting our shelter"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="thank-you-notes">
                Notes
              </label>
              <textarea
                id="thank-you-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="What you shared with the donor…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleSend}>
                Log thank-you locally
              </Button>
              <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
