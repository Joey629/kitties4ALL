import { Building2, Home } from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { cn } from '@/admin/lib/utils';
import type { WorkRole } from '../types';

const roles: { key: WorkRole; label: string; icon: typeof Building2 }[] = [
  { key: 'volunteer', label: 'Volunteer', icon: Building2 },
  { key: 'foster_parent', label: 'Foster', icon: Home },
];

export function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const { workRole, setWorkRole, workEnvironment } = useCompanion();

  return (
    <div className={compact ? '' : 'rounded-xl border border-border bg-card p-4'}>
      <div className="inline-flex w-full rounded-lg border border-border bg-muted p-1">
        {roles.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setWorkRole(key)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-all',
              workRole === key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
      <p className={`text-[11px] text-muted-foreground ${compact ? 'mt-2' : 'mt-3'}`}>
        {workEnvironment.description}
      </p>
    </div>
  );
}
