import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Package, X } from 'lucide-react';
import { Button } from '@/admin/components/ui/button';
import { getResupplyLineItems } from '@/shared/catSupplies';
import { cn } from '@/admin/lib/utils';

interface ResupplySheetProps {
  open: boolean;
  catId: string;
  catName: string;
  onClose: () => void;
  onSubmit: (itemIds: string[]) => void;
}

export function ResupplySheet({ open, catId, catName, onClose, onSubmit }: ResupplySheetProps) {
  const lineItems = useMemo(() => getResupplyLineItems(catId), [catId]);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => lineItems.map((item) => item.id));
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedIds(lineItems.map((item) => item.id));
    setSubmitted(false);
  }, [open, lineItems]);

  function toggleItem(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id],
    );
  }

  function handleSubmit() {
    if (selectedIds.length === 0) return;
    onSubmit(selectedIds);
    setSubmitted(true);
    window.setTimeout(() => {
      onClose();
    }, 1400);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[70] flex min-h-0 flex-col bg-background"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 pb-3 pt-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Supply request
              </p>
              <h1 className="text-lg font-semibold text-foreground">{catName}</h1>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-5">
            {submitted ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sage/20 text-sage-dark">
                  <Check className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Request sent</h2>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  Your manager will assign a volunteer to deliver these supplies.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
                  <Package className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Pre-selected for {catName}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      These items match this cat&apos;s care plan. Adjust if needed, then submit.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {lineItems.map((item) => {
                    const checked = selectedIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                          checked
                            ? 'border-primary/30 bg-primary/5'
                            : 'border-border bg-card hover:bg-muted/40',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                            checked
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background',
                          )}
                        >
                          {checked && <Check className="h-3.5 w-3.5" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            × {item.quantity} {item.unit}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {!submitted && (
            <div className="shrink-0 border-t border-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button
                type="button"
                className="h-12 w-full rounded-xl text-base"
                disabled={selectedIds.length === 0}
                onClick={handleSubmit}
              >
                Submit supply request
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
