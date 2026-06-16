import type { ReactNode } from 'react';
import { cn } from '@/admin/lib/utils';

export const dataTableScrollClass = 'max-h-[calc(100dvh-18rem)] overflow-y-auto';

export function DataTableShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-foreground bg-card text-card-foreground admin-card',
        className,
      )}
    >
      {children}
    </div>
  );
}
