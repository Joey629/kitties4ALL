import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Check,
  ChevronRight,
  ClipboardCheck,
  Shuffle,
  Stethoscope,
} from 'lucide-react';
import { Button } from '@/admin/components/ui/button';
import { PageBackLink } from '@/admin/components/shared/PageBackLink';
import { Input } from '@/admin/components/ui/input';
import { cn, formatDate } from '@/admin/lib/utils';
import { registerCompanionIntakeCat } from '@/shared/companionIntakeCats';

const RANDOM_NAMES = [
  'Mittens', 'Whiskers', 'Pepper', 'Sage', 'Miso', 'Biscuit',
  'Maple', 'Shadow', 'Ginger', 'Pearl', 'Willow', 'Luna',
];

const STEPS = [
  { id: 1, label: 'Photo & name', short: 'Photo' },
  { id: 2, label: 'Intake details', short: 'Details' },
  { id: 3, label: 'Review', short: 'Review' },
] as const;

const SOURCE_OPTIONS = [
  { value: 'street_rescue', label: 'Street rescue', hint: 'Found stray or community pickup' },
  { value: 'owner_surrender', label: 'Owner surrender', hint: 'Relinquished by previous owner' },
  { value: 'other_shelter', label: 'Other institution', hint: 'Transfer from another shelter or clinic' },
] as const;

const HEALTH_OPTIONS = [
  { value: 'normal', label: 'Normal appearance' },
  { value: 'injury', label: 'External injury' },
  { value: 'emaciated', label: 'Emaciated' },
  { value: 'pregnant', label: 'Suspected pregnancy' },
] as const;

type Source = (typeof SOURCE_OPTIONS)[number]['value'];
type HealthTag = (typeof HEALTH_OPTIONS)[number]['value'];
type StepId = (typeof STEPS)[number]['id'];

function StepIndicator({ current }: { current: StepId }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {STEPS.map((step, index) => {
        const done = step.id < current;
        const active = step.id === current;
        return (
          <li key={step.id} className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold border transition-colors',
                  done && 'border-primary bg-primary text-primary-foreground',
                  active && 'border-primary bg-primary/10 text-primary',
                  !done && !active && 'border-border bg-white text-muted-foreground',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : step.id}
              </span>
              <span
                className={cn(
                  'hidden sm:block text-sm font-medium truncate',
                  active ? 'text-neutral-900' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-px w-6 sm:w-10 shrink-0',
                  step.id < current ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function FieldLabel({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-neutral-900">
        {children}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </p>
      {hint && <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>}
    </div>
  );
}

export function AddCatPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<StepId>(1);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [source, setSource] = useState<Source | null>(null);
  const [healthTags, setHealthTags] = useState<HealthTag[]>([]);
  const [intakeNotes, setIntakeNotes] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');

  const canContinueStep1 = Boolean(name.trim());
  const canContinueStep2 = Boolean(source && healthTags.length > 0);
  const canSubmit = canContinueStep1 && canContinueStep2;

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
  }

  function randomizeName() {
    const pick = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    setName(pick);
  }

  function toggleHealth(tag: HealthTag) {
    setHealthTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  }

  function handleNext() {
    if (step === 1 && canContinueStep1) setStep(2);
    else if (step === 2 && canContinueStep2) setStep(3);
  }

  function handleBack() {
    if (step > 1) setStep((current) => (current - 1) as StepId);
    else navigate('/admin/cats');
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || !source) return;

    const id = `intake-${Date.now()}`;
    const storyParts = [
      `Intake source: ${sourceLabel}.`,
      healthLabels.length > 0 ? `Initial observations: ${healthLabels.join(', ')}.` : '',
      intakeNotes.trim(),
    ].filter(Boolean);

    registerCompanionIntakeCat({
      id,
      name: name.trim(),
      photo: photoPreview ?? '🐱',
      healthStatus: healthLabels.join(', '),
      story: storyParts.join(' ') || 'Recently registered via admin intake.',
      source,
      registeredById: 'admin',
      registeredByName: 'Shelter admin',
      breed: breed.trim() || undefined,
      age: age.trim() || undefined,
    });

    navigate(`/admin/cats/${id}`);
  }

  const sourceLabel = SOURCE_OPTIONS.find((item) => item.value === source)?.label;
  const healthLabels = HEALTH_OPTIONS.filter((item) => healthTags.includes(item.value)).map(
    (item) => item.label,
  );

  return (
    <div className="-mx-4 -mb-4 flex min-h-full flex-col bg-white sm:-mx-6 sm:-mb-4 lg:-mx-8 lg:-mb-4">
      <div className="border-b border-border px-4 pb-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <PageBackLink to="/admin/cats">Back to cats</PageBackLink>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="truncate font-display text-xl font-semibold text-neutral-900">
                New cat intake
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Record arrival, then send the cat to the exam queue.
              </p>
            </div>
            <StepIndicator current={step} />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <section className="rounded-xl border border-border bg-white p-5 sm:p-6">
                  <div className="flex items-start gap-3 mb-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Camera className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-neutral-900">Cover photo</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Take a clear intake photo for the cat&apos;s profile and shelter records.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'w-full aspect-[5/4] max-h-72 rounded-xl border-2 border-dashed border-border',
                      'flex flex-col items-center justify-center gap-2 transition-colors bg-muted/20',
                      'hover:border-primary/40 hover:bg-muted/40',
                      photoPreview && 'border-solid border-border p-0 overflow-hidden bg-white',
                    )}
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Intake cover preview" className="h-full w-full object-cover" />
                    ) : (
                      <>
                        <Camera className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-foreground">Take or upload photo</span>
                        <span className="text-xs text-muted-foreground">Optional — can add during exam</span>
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
                </section>

                <section className="rounded-xl border border-border bg-white p-5 sm:p-6 space-y-3">
                  <FieldLabel required hint="Used until a permanent name is chosen after exam.">
                    Temporary name
                  </FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Luna, Pepper, or tap shuffle"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="flex-1 bg-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={randomizeName}
                      aria-label="Random name"
                    >
                      <Shuffle className="h-4 w-4" />
                    </Button>
                  </div>
                </section>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <section className="rounded-xl border border-border bg-white p-5 sm:p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky/15 text-sky">
                      <ClipboardCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-neutral-900">How did they arrive?</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Select the intake source. This is logged on the cat&apos;s shelter timeline.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    {SOURCE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSource(option.value)}
                        className={cn(
                          'rounded-xl border px-4 py-3 text-left transition-colors',
                          source === option.value
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                            : 'border-border bg-white hover:bg-muted/30',
                        )}
                      >
                        <p className="text-sm font-semibold text-neutral-900">{option.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{option.hint}</p>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-border bg-white p-5 sm:p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-coral/12 text-coral">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-neutral-900">Initial health check</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Select everything observed on arrival. A vet exam will follow in the queue.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {HEALTH_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleHealth(option.value)}
                        className={cn(
                          'px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors',
                          healthTags.includes(option.value)
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-white border-border text-foreground hover:bg-muted/40',
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2 pt-1">
                    <FieldLabel hint="Circumstances, behavior on intake, visible concerns, or pickup location.">
                      Arrival notes
                    </FieldLabel>
                    <textarea
                      placeholder="e.g. Found near Oak Street, calm but thin, limping on left paw..."
                      value={intakeNotes}
                      onChange={(event) => setIntakeNotes(event.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-input bg-white px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                  </div>
                </section>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <section className="rounded-xl border border-border bg-white p-5 sm:p-6 space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-neutral-900">Review intake record</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Confirm details before sending {name.trim() || 'this cat'} to the exam queue.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                    <div className="aspect-square rounded-xl border border-border bg-muted/20 overflow-hidden flex items-center justify-center">
                      {photoPreview ? (
                        <img src={photoPreview} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Camera className="h-8 w-8 text-muted-foreground/50" />
                      )}
                    </div>
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</dt>
                        <dd className="mt-1 font-medium text-neutral-900">{name.trim()}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Intake date</dt>
                        <dd className="mt-1 font-medium text-neutral-900">{formatDate(new Date().toISOString().slice(0, 10))}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source</dt>
                        <dd className="mt-1 font-medium text-neutral-900">{sourceLabel}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Health flags</dt>
                        <dd className="mt-1.5 flex flex-wrap gap-1.5">
                          {healthLabels.map((label) => (
                            <span
                              key={label}
                              className="rounded-full border border-primary/20 bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary"
                            >
                              {label}
                            </span>
                          ))}
                        </dd>
                      </div>
                      {intakeNotes.trim() && (
                        <div className="sm:col-span-2">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Arrival notes</dt>
                          <dd className="mt-1 text-foreground leading-relaxed">{intakeNotes.trim()}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </section>

                <section className="rounded-xl border border-dashed border-border bg-white p-5 sm:p-6 space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-neutral-900">Optional profile details</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add now or complete after the veterinary exam.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel>Breed</FieldLabel>
                      <Input
                        placeholder="e.g. Domestic Shorthair"
                        value={breed}
                        onChange={(event) => setBreed(event.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Age estimate</FieldLabel>
                      <Input
                        placeholder="e.g. 2 years, kitten"
                        value={age}
                        onChange={(event) => setAge(event.target.value)}
                        className="bg-white"
                      />
                    </div>
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="sticky bottom-0 border-t border-border bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={handleBack}>
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>

            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={step === 1 ? !canContinueStep1 : !canContinueStep2}
                className="gap-1.5"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={!canSubmit} className="gap-1.5">
                Save and enter exam queue
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
