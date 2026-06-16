import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/admin/components/ui/button';
import { cn } from '@/admin/lib/utils';
import type { TaskFeedAction } from '@/shared/taskAdmin';

interface TaskFeedActionsMenuProps {
  actions: TaskFeedAction[];
  className?: string;
}

export function TaskFeedActionsMenu({ actions, className }: TaskFeedActionsMenuProps) {
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

  if (actions.length === 0) return null;

  if (actions.length === 1) {
    return (
      <Button size="sm" variant="outline" className={cn('h-7 px-2 text-xs', className)} asChild>
        <Link to={actions[0].href}>{actions[0].label}</Link>
      </Button>
    );
  }

  return (
    <div ref={rootRef} className={cn('relative inline-block text-left', className)}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 gap-1 px-2 text-xs"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        Actions
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-[11rem] rounded-lg border border-border bg-card py-1 shadow-lg"
        >
          {actions.map((action) => (
            <Link
              key={`${action.label}-${action.href}`}
              role="menuitem"
              to={action.href}
              className="block px-3 py-2 text-xs text-foreground transition-colors hover:bg-muted/60"
              onClick={() => setOpen(false)}
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
