import type { LucideIcon } from 'lucide-react';
import { cn } from '@/admin/lib/utils';
import { Card, CardContent } from '@/admin/components/ui/card';

interface StatCardProps {
  title: string;
  value?: string | number;
  valueLines?: string[];
  subtitle?: string;
  metric?: string;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

const VALUE_LINES_CLASS =
  'text-base font-semibold leading-snug tracking-tight tabular-nums text-foreground';
const VALUE_CLASS =
  'text-xl font-semibold leading-snug tracking-tight tabular-nums text-foreground sm:text-2xl';

export function StatCard({
  title,
  value,
  valueLines,
  subtitle,
  metric,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  const footerMetric = metric?.trim() ? metric : undefined;
  const footer = footerMetric ?? subtitle;
  const showBothFooters = Boolean(footerMetric && subtitle);

  return (
    <Card className={cn('group h-full admin-card hover:border-border hover:shadow-md transition-all duration-200', className)}>
      <CardContent className="flex h-full min-h-[8.5rem] flex-col p-5">
        <div className="flex flex-1 items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
            {valueLines ? (
              <div className="space-y-0.5">
                {valueLines.map((line) => (
                  <p key={line} className={VALUE_LINES_CLASS}>
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <p className={VALUE_CLASS}>{value}</p>
            )}
            {trend && (
              <p className="pt-0.5 text-xs font-medium text-sage-dark">{trend}</p>
            )}
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary transition-colors group-hover:bg-primary/12">
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
          </div>
        </div>
        {showBothFooters ? (
          <div className="shrink-0 space-y-1 pt-3">
            <p className="text-xs font-medium text-muted-foreground">{footerMetric}</p>
            <p className="text-xs font-medium text-muted-foreground">{subtitle}</p>
          </div>
        ) : (
          footer && (
            <p className="shrink-0 pt-3 text-xs font-medium text-muted-foreground">{footer}</p>
          )
        )}
      </CardContent>
    </Card>
  );
}
