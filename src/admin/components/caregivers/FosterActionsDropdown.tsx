import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/admin/components/ui/button';
import { FOSTER_CAREGIVER_ACTIONS } from '@/admin/lib/fosterCaregiverActions';
import { cn } from '@/admin/lib/utils';
import type { Caregiver } from '@/admin/types';

interface FosterActionsDropdownProps {
  caregiver: Caregiver;
  className?: string;
  onAction?: () => void;
}

export function FosterActionsDropdown({
  caregiver,
  className,
  onAction,
}: FosterActionsDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={rootRef} className={cn('relative inline-block text-left', className)}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0 gap-1.5"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        Actions
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-[12.5rem] rounded-lg border border-border bg-card py-1 shadow-lg"
        >
          {FOSTER_CAREGIVER_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted/60"
              onClick={() => {
                action.run(caregiver);
                setOpen(false);
                onAction?.();
              }}
            >
              <action.icon className="h-4 w-4 shrink-0 text-primary" />
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
