import { UserRound } from 'lucide-react';
import { Badge } from '@/admin/components/ui/badge';
import { useAdminChat } from '@/admin/context/AdminChatContext';
import { cn } from '@/admin/lib/utils';
import type { AdoptionApplication } from '@/admin/types';
import {
  getLinkedTaskForApplication,
  getTaskSourceLabel,
  getTaskStatusLabel,
  getVolunteerFieldWorkSummary,
  volunteerFieldWorkHeadline,
} from '@/shared/taskAdmin';

interface VolunteerFieldWorkSectionProps {
  app: AdoptionApplication;
  embedded?: boolean;
}

export function VolunteerFieldWorkSection({ app, embedded = false }: VolunteerFieldWorkSectionProps) {
  const summary = getVolunteerFieldWorkSummary(app);
  if (!summary) return null;

  const task = getLinkedTaskForApplication(app.id);

  const content = (
    <>
      <div className={cn('flex items-center justify-between gap-2', !embedded && 'mb-0')}>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Volunteer field work
        </h3>
        {app.interviewerId && (
          <MessageButton caregiverId={app.interviewerId} label="Message" />
        )}
      </div>
      <div className="flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky/10 text-sky">
          <UserRound className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm leading-relaxed text-foreground">{volunteerFieldWorkHeadline(app)}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-[10px]">
              {summary.assigneeName}
            </Badge>
            {task && (
              <>
                <Badge variant="secondary" className="text-[10px]">
                  {getTaskStatusLabel(task)}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {getTaskSourceLabel(task)}
                </Badge>
              </>
            )}
          </div>
          {summary.blockReason && app.stage === 'reviewing' && (
            <p className="text-xs leading-relaxed text-muted-foreground">{summary.blockReason}</p>
          )}
        </div>
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="space-y-3 border-t border-border/60 pt-4">
        {content}
      </div>
    );
  }

  return (
    <section className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
      {content}
    </section>
  );
}

function MessageButton({ caregiverId, label }: { caregiverId: string; label: string }) {
  const { openChat } = useAdminChat();

  return (
    <button
      type="button"
      onClick={() => openChat(caregiverId)}
      className="text-xs font-medium text-primary hover:underline"
    >
      {label}
    </button>
  );
}
