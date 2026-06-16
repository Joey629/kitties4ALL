import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Camera, Send, X } from 'lucide-react';
import { Button } from '@/admin/components/ui/button';
import { useCompanion } from '../context/CompanionContext';
import { getMyCatsForRole } from '../data/mock';
import { EmergencyCatPicker } from './EmergencyCatPicker';

interface EmergencyReportSheetProps {
  open: boolean;
  onClose: () => void;
  presetCatId?: string;
}

export function EmergencyReportSheet({ open, onClose, presetCatId }: EmergencyReportSheetProps) {
  const { cats, workRole, registeredCatIds, removedCatIds, submitEmergencyReport } = useCompanion();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [catId, setCatId] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const availableCats = useMemo(() => {
    if (workRole === 'foster_parent') {
      const assignedIds = new Set([
        ...getMyCatsForRole(workRole).map((cat) => cat.id),
        ...registeredCatIds,
      ]);
      return cats
        .filter((cat) => assignedIds.has(cat.id) && !removedCatIds.includes(cat.id))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    return cats
      .filter((cat) => !removedCatIds.includes(cat.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [cats, workRole, registeredCatIds, removedCatIds]);

  useEffect(() => {
    if (!open) return;
    const preferred =
      presetCatId && availableCats.some((cat) => cat.id === presetCatId)
        ? presetCatId
        : availableCats[0]?.id ?? '';
    setCatId(preferred);
    setPhotoPreview(null);
    setDescription('');
    setSubmitting(false);
    setSubmitted(false);
  }, [open, availableCats, presetCatId]);

  useEffect(() => {
    if (catId && !availableCats.some((cat) => cat.id === catId)) {
      setCatId(availableCats[0]?.id ?? '');
    }
  }, [availableCats, catId]);

  const selectedCat = availableCats.find((cat) => cat.id === catId);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    event.target.value = '';
  };

  const canSubmit = Boolean(catId && (photoPreview || description.trim()));

  const handleSubmit = () => {
    if (!canSubmit || !selectedCat || submitting) return;
    setSubmitting(true);
    submitEmergencyReport({
      catId: selectedCat.id,
      catName: selectedCat.name,
      description: description.trim(),
      photoUrl: photoPreview ?? undefined,
    });
    setSubmitted(true);
    window.setTimeout(onClose, 1400);
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[70] flex flex-col bg-background"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 pb-3 pt-8">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral/15 text-coral">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-foreground">Emergency report</h1>
                <p className="text-xs text-muted-foreground">Alert the shelter team immediately</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {submitted ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <p className="text-5xl mb-4">🚨</p>
              <h2 className="text-lg font-semibold text-foreground">Report sent</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The shelter team has been notified about {selectedCat?.name}.
              </p>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 pb-28">
              <section className="mb-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Which cat?
                </p>
                <EmergencyCatPicker
                  cats={availableCats}
                  catId={catId}
                  onSelect={setCatId}
                  variant={workRole === 'foster_parent' ? 'list' : 'search'}
                />
              </section>

              <section className="mb-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Photo evidence
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                {photoPreview ? (
                  <div className="relative overflow-hidden rounded-xl border border-border">
                    <img src={photoPreview} alt="Incident" className="aspect-[4/3] w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-muted-foreground shadow-sm"
                      aria-label="Remove photo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 active:scale-[0.99]"
                  >
                    <Camera className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Take a photo</span>
                  </button>
                )}
              </section>

              <section className="mb-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  What happened?
                </p>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-coral/25"
                />
              </section>
            </div>
          )}

          {!submitted && (
            <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-card px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button
                className="h-12 w-full rounded-xl bg-coral text-white hover:bg-coral/90"
                disabled={!canSubmit || submitting}
                onClick={handleSubmit}
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Sending…' : 'Submit emergency report'}
              </Button>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                Photo or written note required
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
