import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/admin/components/ui/button';
import { cn } from '@/admin/lib/utils';

interface MultiSelectFilterProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (selected: T[]) => void;
}

export function MultiSelectFilter<T extends string>({
  label,
  options,
  selected,
  onChange,
}: MultiSelectFilterProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const toggleValue = (value: T) => {
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  };

  const triggerLabel =
    selected.length === 0
      ? `All ${label.toLowerCase()}`
      : selected.length === 1
        ? options.find((option) => option.value === selected[0])?.label ?? label
        : `${label} (${selected.length})`;

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-w-[9.5rem] justify-between gap-2"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </Button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          aria-label={`${label} filters`}
          className="absolute left-0 top-full z-30 mt-2 min-w-[12rem] rounded-xl border border-border bg-card p-2 shadow-lg"
        >
          <div className="mb-1 flex items-center justify-between px-2 py-1">
            <p className="text-xs font-semibold text-foreground">{label}</p>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
          <ul className="space-y-0.5">
            {options.map((option) => {
              const checked = selected.includes(option.value);
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggleValue(option.value)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/60',
                      checked && 'bg-muted/40',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background',
                      )}
                    >
                      {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span className="truncate text-foreground">{option.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
