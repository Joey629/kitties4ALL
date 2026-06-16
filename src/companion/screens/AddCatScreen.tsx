import { useRef, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, CheckCircle2 } from 'lucide-react';
import { Button } from '@/admin/components/ui/button';
import { Input } from '@/admin/components/ui/input';
import { cn } from '@/admin/lib/utils';
import { useCompanion } from '../context/CompanionContext';
import type { QuickIntakeCat } from '../types';

const SOURCE_OPTIONS = [
  { value: 'street_rescue', label: 'Street rescue' },
  { value: 'owner_surrender', label: 'Owner surrender' },
  { value: 'other_shelter', label: 'Other institution' },
] as const;

const HEALTH_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'injury', label: 'Injury' },
  { value: 'emaciated', label: 'Emaciated' },
  { value: 'pregnant', label: 'Pregnancy' },
] as const;

type Source = (typeof SOURCE_OPTIONS)[number]['value'];
type HealthTag = (typeof HEALTH_OPTIONS)[number]['value'];

export function AddCatScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromTaskId = searchParams.get('fromTask');
  const locationHint = searchParams.get('location');
  const { registerCat, workRole } = useCompanion();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [source, setSource] = useState<Source | null>(null);
  const [healthTags, setHealthTags] = useState<HealthTag[]>([]);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (locationHint && !notes) {
      setNotes(`Found at ${locationHint}`);
      setSource('street_rescue');
    }
  }, [locationHint, notes]);

  const isFoster = workRole === 'foster_parent';
  const canSubmit = name.trim() && source && healthTags.length > 0;

  function handleBack() {
    if (fromTaskId) {
      navigate(-1);
      return;
    }
    navigate(isFoster ? '/companion/my-cats' : '/companion');
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
  }

  function toggleHealth(tag: HealthTag) {
    setHealthTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !source) return;
    const intake: QuickIntakeCat = {
      name: name.trim(),
      source,
      healthTags,
      notes: notes.trim() || undefined,
      photoPreview,
    };
    registerCat(intake, fromTaskId ? { linkedTaskId: fromTaskId } : undefined);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-full flex-col items-center justify-center px-6 py-12 text-center"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Cat registered</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {name} is logged for intake.{fromTaskId ? ' Return to the pickup task to complete it.' : ' The shelter team can review details in admin.'}
        </p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-2">
          {fromTaskId ? (
            <Button onClick={() => navigate(`/companion/tasks/${fromTaskId}`)}>Back to pickup task</Button>
          ) : isFoster ? (
            <Button onClick={() => navigate('/companion/my-cats')}>View my cats</Button>
          ) : null}
          <Button variant="outline" onClick={() => navigate('/companion')}>Back to today</Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-5 pt-4 pb-8"
    >
      <div className="mb-5 flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-ml-2 shrink-0"
          aria-label="Back"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Quick cat intake</h1>
          <p className="text-xs text-muted-foreground">
            {fromTaskId ? 'Register the rescued cat for this pickup' : 'Register a cat in the field'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border transition-colors',
            'hover:border-primary/40 hover:bg-muted/40',
            photoPreview && 'overflow-hidden border-solid p-0',
          )}
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Intake photo" className="h-full w-full object-cover" />
          ) : (
            <>
              <Camera className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-sm text-muted-foreground">Take intake photo</span>
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoChange}
        />

        <fieldset className="space-y-2">
          <label className="text-sm font-medium">
            Temporary name <span className="text-destructive">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Pepper"
            required
          />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            Source <span className="text-destructive">*</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {SOURCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSource(opt.value)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  source === opt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-foreground hover:bg-muted',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            Health at intake <span className="text-destructive">*</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {HEALTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleHealth(opt.value)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  healthTags.includes(opt.value)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-foreground hover:bg-muted',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <label className="text-sm font-medium">Field notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Location found, behavior, injuries..."
            rows={3}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </fieldset>

        <Button type="submit" className="w-full" disabled={!canSubmit}>
          Register cat
        </Button>
      </form>
    </motion.div>
  );
}
