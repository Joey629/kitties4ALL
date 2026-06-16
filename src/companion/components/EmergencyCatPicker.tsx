import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Input } from '@/admin/components/ui/input';
import { cn } from '@/admin/lib/utils';
import { CatAvatar } from './MobileShell';
import type { CompanionCat } from '../types';

interface EmergencyCatPickerProps {
  cats: CompanionCat[];
  catId: string;
  onSelect: (id: string) => void;
  variant: 'list' | 'search';
}

export function EmergencyCatPicker({ cats, catId, onSelect, variant }: EmergencyCatPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedCat = cats.find((cat) => cat.id === catId);

  const filteredCats = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return cats;
    return cats.filter(
      (cat) =>
        cat.name.toLowerCase().includes(normalized) ||
        cat.healthStatus.toLowerCase().includes(normalized),
    );
  }, [cats, query]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  if (cats.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
        No cats available for your role.
      </p>
    );
  }

  if (variant === 'list') {
    return (
      <div className="space-y-2">
        {cats.map((cat) => {
          const selected = cat.id === catId;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                selected
                  ? 'border-coral/40 bg-coral/5'
                  : 'border-border bg-card hover:bg-muted/40',
              )}
            >
              <CatAvatar photo={cat.photo} name={cat.name} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{cat.healthStatus}</p>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
          open ? 'border-coral/40 bg-coral/5' : 'border-border bg-card hover:bg-muted/40',
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {selectedCat ? (
          <>
            <CatAvatar photo={selectedCat.photo} name={selectedCat.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{selectedCat.name}</p>
              <p className="text-xs text-muted-foreground">{selectedCat.healthStatus}</p>
            </div>
          </>
        ) : (
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">Select a cat</p>
          </div>
        )}
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name…"
                className="h-9 pl-8"
                autoFocus
              />
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto overscroll-y-contain py-1" role="listbox">
            {filteredCats.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">No cats match your search.</li>
            ) : (
              filteredCats.map((cat) => {
                const selected = cat.id === catId;
                return (
                  <li key={cat.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onSelect(cat.id);
                        setOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                        selected ? 'bg-coral/8' : 'hover:bg-muted/50',
                      )}
                    >
                      <CatAvatar photo={cat.photo} name={cat.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                        <p className="text-xs text-muted-foreground">{cat.healthStatus}</p>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
