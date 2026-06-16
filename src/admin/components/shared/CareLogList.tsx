import { cn } from '@/admin/lib/utils';
import type { FosterLogCategory, FosterLogEntry } from '@/admin/lib/fosterCaregiverDisplay';

const LOG_TAG_STYLES: Record<FosterLogCategory, string> = {
  medical: 'bg-sky/15 text-sky border-sky/20',
  daily: 'bg-muted text-muted-foreground border-border',
  adoption: 'bg-soft-orange/15 text-foreground border-soft-orange/20',
};

const LOG_TAG_LABELS: Record<FosterLogCategory, string> = {
  medical: 'Medical',
  daily: 'Daily',
  adoption: 'Adoption',
};

function formatLogDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function CareLogList({ entries }: { entries: FosterLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No records in this section yet.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border/60">
      {entries.map((entry) => (
        <article key={entry.id} className="py-3">
          <div className="flex flex-wrap items-center gap-2">
            <time className="text-sm text-foreground">{formatLogDate(entry.date)}</time>
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 text-[11px] font-medium',
                LOG_TAG_STYLES[entry.category],
              )}
            >
              {LOG_TAG_LABELS[entry.category]}
            </span>
          </div>
          <h4 className="mt-1.5 text-sm font-medium text-foreground">{entry.title}</h4>
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{entry.description}</p>
          {entry.photoUrl && (
            <img
              src={entry.photoUrl}
              alt=""
              className="mt-2 h-24 w-24 rounded-lg border border-border object-cover"
            />
          )}
        </article>
      ))}
    </div>
  );
}
