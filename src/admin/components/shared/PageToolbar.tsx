import type { ReactNode } from 'react';
import { cn } from '@/admin/lib/utils';

interface PageToolbarProps {
  children: ReactNode;
  className?: string;
}

/** Consistent spacing between page header and main content across admin list pages */
export function PageToolbar({ children, className }: PageToolbarProps) {
  return (
    <div
      className={cn(
        'mb-3 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center',
        className,
      )}
    >
      {children}
    </div>
  );
}
