import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/admin/components/ui/button';
import { cn } from '@/admin/lib/utils';

interface PageBackLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
}

/** Matches adoption full-details back navigation: ghost sm + muted label + arrow. */
export function PageBackLink({ to, children, className }: PageBackLinkProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className={cn('-ml-2 mb-2 w-fit self-start text-muted-foreground hover:text-foreground', className)}
    >
      <Link to={to}>
        <ArrowLeft className="h-4 w-4" />
        {children}
      </Link>
    </Button>
  );
}
