import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/admin/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/10 text-primary',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        success: 'border-transparent bg-sage/15 text-foreground',
        warning: 'border-transparent bg-soft-orange/20 text-foreground',
        danger: 'border-transparent bg-coral/15 text-coral',
        outline: 'text-foreground border-border',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
