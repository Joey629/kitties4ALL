import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Check,
  ChevronRight,
  ClipboardCheck,
  UserRound,
} from 'lucide-react';
import { Button } from '@/admin/components/ui/button';
import { PageBackLink } from '@/admin/components/shared/PageBackLink';
import { Input } from '@/admin/components/ui/input';
import { cn, formatDate } from '@/admin/lib/utils';
import { WEEKDAY_OPTIONS } from '@/admin/lib/caregiverDisplay';
import { addCaregiver, caregiverAvatar } from '@/shared/caregivers';
import type { CaregiverRole } from '@/admin/types';

const STEPS = [
  { id: 1, label: 'Profile', short: 'Profile' },
  { id: 2, label: 'Role & schedule', short: 'Schedule' },
  { id: 3, label: 'Review', short: 'Review' },
] as const;

const ROLE_OPTIONS = [
  {
    value: 'volunteer' as const,
    label: 'Volunteer',
    hint: 'On-site shelter shifts, cleaning, and cat care',
  },
  {
    value: 'foster_parent' as const,
    label: 'Foster parent',
    hint: 'In-home care for cats awaiting adoption',
  },
];

const SKILL_OPTIONS = [
  'Cat care',
  'Cleaning',
  'Intake',
  'Foster care',
  'Socialization',
] as const;

type StepId = (typeof STEPS)[number]['id'];
type VolunteerRole = Exclude<CaregiverRole, 'staff'>;

function StepIndicator({ current }: { current: StepId }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {STEPS.map((step, index) => {
        const done = step.id < current;
        const active = step.id === current;
        return (
          <li key={step.id} className="flex items-center gap-2 sm:gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                  done && 'border-primary bg-primary text-primary-foreground',
                  active && 'border-primary bg-primary/10 text-primary',
                  !done && !active && 'border-border bg-white text-muted-foreground',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : step.id}
              </span>
              <span
                className={cn(
                  'hidden truncate text-sm font-medium sm:block',
                  active ? 'text-neutral-900' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-px w-6 shrink-0 sm:w-10',
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
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </p>
      {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function AddCaregiverPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepId>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<VolunteerRole | null>(null);
  const [availabilityDays, setAvailabilityDays] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [availabilityNotes, setAvailabilityNotes] = useState('');
  const submitLockRef = useRef(false);

  const canContinueStep1 = Boolean(name.trim() && email.trim());
  const canContinueStep2 = Boolean(role && availabilityDays.length > 0 && skills.length > 0);
  const canSubmit = canContinueStep1 && canContinueStep2;

  function toggleDay(day: string) {
    setAvailabilityDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  }

  function toggleSkill(skill: string) {
    setSkills((current) =>
      current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill],
    );
  }

  function handleNext() {
    if (step === 1 && canContinueStep1) setStep(2);
    else if (step === 2 && canContinueStep2) setStep(3);
  }

  function handleBack() {
    if (step > 1) setStep((current) => (current - 1) as StepId);
    else navigate('/admin/caregivers');
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || !role || submitLockRef.current) return;
    submitLockRef.current = true;

    const created = addCaregiver({
      name,
      email,
      phone,
      role,
      availabilityDays,
      skills,
      availability: availabilityNotes,
    });

    navigate(`/admin/caregivers/${created.id}`);
  }

  const roleLabel = ROLE_OPTIONS.find((option) => option.value === role)?.label;

  return (
    <div className="-mx-4 -mb-4 flex min-h-full flex-col bg-white sm:-mx-6 sm:-mb-4 lg:-mx-8 lg:-mb-4">
      <div className="border-b border-border px-4 pb-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <PageBackLink to="/admin/caregivers">Back to caregivers</PageBackLink>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="truncate font-display text-xl font-semibold text-neutral-900">
                New caregiver
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Add a volunteer or foster parent to your shelter team.
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
                  <div className="mb-5 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-neutral-900">Basic profile</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Contact details used for scheduling and team messages.
                      </p>
                    </div>
                  </div>

                  <div className="mb-5 flex items-center gap-4 rounded-xl border border-border bg-muted/20 px-4 py-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {caregiverAvatar(name || 'Caregiver')}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Avatar initials are generated from the caregiver&apos;s name.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <FieldLabel required>Full name</FieldLabel>
                      <Input
                        placeholder="e.g. Marcus Webb"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel required hint="Used for shift reminders and team chat.">
                        Email
                      </FieldLabel>
                      <Input
                        type="email"
                        placeholder="e.g. marcus@kitties4all.org"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel hint="Optional, but helpful for urgent shift coverage.">
                        Phone
                      </FieldLabel>
                      <Input
                        type="tel"
                        placeholder="e.g. (555) 201-4402"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        className="bg-white"
                      />
                    </div>
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
                <section className="space-y-4 rounded-xl border border-border bg-white p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky/15 text-sky">
                      <ClipboardCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-neutral-900">Role</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Choose how this person supports the shelter.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {ROLE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRole(option.value)}
                        className={cn(
                          'rounded-xl border px-4 py-3 text-left transition-colors',
                          role === option.value
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                            : 'border-border bg-white hover:bg-muted/30',
                        )}
                      >
                        <p className="text-sm font-semibold text-neutral-900">{option.label}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {option.hint}
                        </p>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-4 rounded-xl border border-border bg-white p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-neutral-900">Availability</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Select the days they can cover volunteer shifts.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {WEEKDAY_OPTIONS.map((day) => {
                      const active = availabilityDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={cn(
                            'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                            active
                              ? 'border-sky/30 bg-sky/10 text-sky'
                              : 'border-border bg-white text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    <FieldLabel hint="Preferred times, shift limits, or foster home notes.">
                      Schedule notes
                    </FieldLabel>
                    <textarea
                      placeholder="e.g. Tue, Thu, Sat mornings"
                      value={availabilityNotes}
                      onChange={(event) => setAvailabilityNotes(event.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-input bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                  </div>
                </section>

                <section className="space-y-4 rounded-xl border border-border bg-white p-5 sm:p-6">
                  <FieldLabel required hint="Used for scheduling and task assignment.">
                    Skills & focus areas
                  </FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_OPTIONS.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={cn(
                          'rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
                          skills.includes(skill)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-white text-foreground hover:bg-muted/40',
                        )}
                      >
                        {skill}
                      </button>
                    ))}
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
                <section className="space-y-4 rounded-xl border border-border bg-white p-5 sm:p-6">
                  <div>
                    <h2 className="text-base font-semibold text-neutral-900">Review caregiver profile</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Confirm details before adding {name.trim() || 'this caregiver'} to your team.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/20 p-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
                      {caregiverAvatar(name)}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-neutral-900">{name.trim()}</p>
                      <p className="text-sm text-muted-foreground">{email.trim()}</p>
                    </div>
                  </div>

                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Role
                      </dt>
                      <dd className="mt-1 font-medium text-neutral-900">{roleLabel}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Join date
                      </dt>
                      <dd className="mt-1 font-medium text-neutral-900">
                        {formatDate(new Date().toISOString().slice(0, 10))}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Phone
                      </dt>
                      <dd className="mt-1 font-medium text-neutral-900">
                        {phone.trim() || 'Not provided'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Availability
                      </dt>
                      <dd className="mt-1 font-medium text-neutral-900">
                        {availabilityNotes.trim() || availabilityDays.join(', ')}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Available days
                      </dt>
                      <dd className="mt-1.5 flex flex-wrap gap-1.5">
                        {availabilityDays.map((day) => (
                          <span
                            key={day}
                            className="rounded-full border border-sky/20 bg-sky/10 px-2.5 py-0.5 text-xs font-medium text-sky"
                          >
                            {day}
                          </span>
                        ))}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Skills
                      </dt>
                      <dd className="mt-1.5 flex flex-wrap gap-1.5">
                        {skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full border border-primary/20 bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary"
                          >
                            {skill}
                          </span>
                        ))}
                      </dd>
                    </div>
                  </dl>
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
                Add caregiver
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
