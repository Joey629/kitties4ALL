import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Shuffle } from 'lucide-react';
import { Button } from '@/admin/components/ui/button';
import { Input } from '@/admin/components/ui/input';
import { PageBackLink } from '@/admin/components/shared/PageBackLink';
import { PageHeader } from '@/admin/components/shared/PageHeader';
import { cn } from '@/admin/lib/utils';
import { registerCompanionIntakeCat } from '@/shared/companionIntakeCats';

const RANDOM_NAMES = [
  'Mittens', 'Whiskers', 'Pepper', 'Sage', 'Miso', 'Biscuit',
  'Maple', 'Shadow', 'Ginger', 'Pearl', 'Willow', 'Luna',
];

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

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h2>
  );
}

function PhotoUploadButton({
  photoPreview,
  onClick,
}: {
  photoPreview: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-28 w-28 shrink-0 rounded-xl border-2 border-dashed border-border bg-muted/20 sm:h-32 sm:w-32',
        'flex flex-col items-center justify-center gap-1 transition-colors',
        'hover:border-primary/40 hover:bg-muted/40',
        photoPreview && 'border-solid border-border p-0 overflow-hidden bg-white',
      )}
    >
      {photoPreview ? (
        <img src={photoPreview} alt="Intake photo preview" className="h-full w-full object-cover" />
      ) : (
        <>
          <Camera className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          <span className="px-1 text-center text-[10px] font-medium leading-tight text-muted-foreground">
            Add photo
          </span>
        </>
      )}
    </button>
  );
}

export function AddCatPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [source, setSource] = useState<Source | null>(null);
  const [healthTags, setHealthTags] = useState<HealthTag[]>([]);
  const [intakeNotes, setIntakeNotes] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');

  const canSubmit = Boolean(name.trim() && source && healthTags.length > 0);

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

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || !source) return;

    const healthLabels = HEALTH_OPTIONS.filter((item) => healthTags.includes(item.value)).map(
      (item) => item.label,
    );
    const sourceLabel = SOURCE_OPTIONS.find((item) => item.value === source)?.label;
    const storyParts = [
      `Intake source: ${sourceLabel}.`,
      healthLabels.length > 0 ? `Initial observations: ${healthLabels.join(', ')}.` : '',
      intakeNotes.trim(),
    ].filter(Boolean);

    const id = `intake-${Date.now()}`;
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="-mx-4 -mb-4 flex min-h-0 flex-1 flex-col bg-muted/35 px-6 pb-5 pt-0 sm:-mx-6 lg:-mx-8"
    >
      <PageBackLink to="/admin/cats">Back to cats</PageBackLink>

      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="admin-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-6">
              <div className="mb-4 border-b border-border/60 pb-4">
                <PageHeader
                  variant="section"
                  className="mb-0 gap-3 border-0 pb-0 sm:items-center"
                  title="New cat intake"
                  description="Record arrival, then send the cat to the exam queue."
                  actions={
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="submit" size="sm" disabled={!canSubmit}>
                        Save and enter exam queue
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/admin/cats')}
                      >
                        Cancel
                      </Button>
                    </div>
                  }
                />
              </div>

              <div className="space-y-6">
                <section className="space-y-3">
                  <SectionHeading>Identify the cat</SectionHeading>
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                      <div className="flex items-start gap-4 sm:flex-col sm:gap-2">
                        <PhotoUploadButton
                          photoPreview={photoPreview}
                          onClick={() => fileInputRef.current?.click()}
                        />
                        <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground sm:max-w-[8rem]">
                          Optional — can add during exam
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handlePhotoChange}
                        />
                      </div>

                      <div className="min-w-0 flex-1 space-y-2">
                        <label className="text-sm font-medium text-foreground" htmlFor="intake-name">
                          Temporary name <span className="text-destructive">*</span>
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Used until a permanent name is chosen after exam.
                        </p>
                        <div className="flex gap-2">
                          <Input
                            id="intake-name"
                            placeholder="e.g. Luna, Pepper, or tap shuffle"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className="flex-1 bg-background"
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
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <SectionHeading>Intake details</SectionHeading>
                  <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-5">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">How did they arrive?</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Logged on the cat&apos;s shelter timeline.
                        </p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {SOURCE_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setSource(option.value)}
                            className={cn(
                              'rounded-lg border px-3 py-2.5 text-left transition-colors',
                              source === option.value
                                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                : 'border-border bg-background hover:bg-muted/30',
                            )}
                          >
                            <p className="text-sm font-semibold text-foreground">{option.label}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{option.hint}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 border-t border-border/60 pt-5">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Initial health check</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Select all that apply. A vet exam follows in the queue.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {HEALTH_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => toggleHealth(option.value)}
                            className={cn(
                              'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                              healthTags.includes(option.value)
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-background text-foreground hover:bg-muted/40',
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-border/60 pt-5">
                      <label className="text-sm font-semibold text-foreground" htmlFor="intake-notes">
                        Arrival notes
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Circumstances, behavior, visible concerns, or pickup location.
                      </p>
                      <textarea
                        id="intake-notes"
                        placeholder="e.g. Found near Oak Street, calm but thin, limping on left paw..."
                        value={intakeNotes}
                        onChange={(event) => setIntakeNotes(event.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/30"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <SectionHeading>Optional profile details</SectionHeading>
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <p className="mb-4 text-xs text-muted-foreground">
                      Add now or complete after the veterinary exam.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground" htmlFor="intake-breed">
                          Breed
                        </label>
                        <Input
                          id="intake-breed"
                          placeholder="e.g. Domestic Shorthair"
                          value={breed}
                          onChange={(event) => setBreed(event.target.value)}
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground" htmlFor="intake-age">
                          Age estimate
                        </label>
                        <Input
                          id="intake-age"
                          placeholder="e.g. 2 years, kitten"
                          value={age}
                          onChange={(event) => setAge(event.target.value)}
                          className="bg-background"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
