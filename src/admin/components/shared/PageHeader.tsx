import type { ReactNode } from 'react';
import { cn } from '@/admin/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  descriptionClassName?: string;
  actions?: ReactNode;
  /** `page` = full-width top bar; `section` = inline heading inside a page */
  variant?: 'page' | 'section';
  className?: string;
}

export function PageHeader({
  title,
  description,
  descriptionClassName,
  actions,
  variant = 'page',
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between shrink-0',
        variant === 'page' &&
          '-mx-4 -mt-4 mb-6 border-b border-border bg-card px-4 pb-4 pt-4 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pb-5 sm:pt-5 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pb-5 lg:pt-6',
        variant === 'section' && 'mb-6 border-b border-border/60 pb-4',
        className,
      )}
    >
      <div>
        <h1 className="text-2xl md:text-[1.75rem] font-semibold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p
            className={cn(
              'mt-1.5 max-w-[60ch] text-sm leading-relaxed text-muted-foreground',
              descriptionClassName,
            )}
          >
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
