import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/admin/components/ui/button';
import { Input } from '@/admin/components/ui/input';
import { PageBackLink } from '@/admin/components/shared/PageBackLink';
import { PageHeader } from '@/admin/components/shared/PageHeader';
import { cn } from '@/admin/lib/utils';
import { WEEKDAY_OPTIONS } from '@/admin/lib/caregiverDisplay';
import { addCaregiver, caregiverAvatar } from '@/shared/caregivers';
import type { CaregiverRole } from '@/admin/types';

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

type VolunteerRole = Exclude<CaregiverRole, 'staff'>;

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h2>
  );
}

export function AddCaregiverPage() {
  const navigate = useNavigate();
  const submitLockRef = useRef(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<VolunteerRole | null>(null);
  const [availabilityDays, setAvailabilityDays] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [availabilityNotes, setAvailabilityNotes] = useState('');

  const canSubmit = Boolean(
    name.trim() && email.trim() && role && availabilityDays.length > 0 && skills.length > 0,
  );

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="-mx-4 -mb-4 flex min-h-0 flex-1 flex-col bg-muted/35 px-6 pb-5 pt-0 sm:-mx-6 lg:-mx-8"
    >
      <PageBackLink to="/admin/caregivers">Back to caregivers</PageBackLink>

      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="admin-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-6">
              <div className="mb-4 border-b border-border/60 pb-4">
                <PageHeader
                  variant="section"
                  className="mb-0 gap-3 border-0 pb-0 sm:items-center"
                  title="New caregiver"
                  description="Add a volunteer or foster parent to your shelter team."
                  actions={
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="submit" size="sm" disabled={!canSubmit}>
                        Add caregiver
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/admin/caregivers')}
                      >
                        Cancel
                      </Button>
                    </div>
                  }
                />
              </div>

              <div className="space-y-6">
                <section className="space-y-3">
                  <SectionHeading>Basic profile</SectionHeading>
                  <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
                    <div className="flex items-center gap-4 rounded-lg border border-border bg-background px-4 py-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {caregiverAvatar(name || 'Caregiver')}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Avatar initials are generated from the caregiver&apos;s name.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground" htmlFor="caregiver-name">
                        Full name <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="caregiver-name"
                        placeholder="e.g. Marcus Webb"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="bg-background"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground" htmlFor="caregiver-email">
                          Email <span className="text-destructive">*</span>
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Used for shift reminders and team chat.
                        </p>
                        <Input
                          id="caregiver-email"
                          type="email"
                          placeholder="e.g. marcus@kitties4all.org"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground" htmlFor="caregiver-phone">
                          Phone
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Optional, but helpful for urgent shift coverage.
                        </p>
                        <Input
                          id="caregiver-phone"
                          type="tel"
                          placeholder="e.g. (555) 201-4402"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          className="bg-background"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <SectionHeading>Role & schedule</SectionHeading>
                  <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-5">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Role</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Choose how this person supports the shelter.
                        </p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {ROLE_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setRole(option.value)}
                            className={cn(
                              'rounded-lg border px-3 py-2.5 text-left transition-colors',
                              role === option.value
                                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                : 'border-border bg-background hover:bg-muted/30',
                            )}
                          >
                            <p className="text-sm font-semibold text-foreground">{option.label}</p>
                            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                              {option.hint}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 border-t border-border/60 pt-5">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Available days <span className="text-destructive">*</span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Select the days they can cover volunteer shifts.
                        </p>
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
                                  : 'border-border bg-background text-muted-foreground hover:text-foreground',
                              )}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-border/60 pt-5">
                      <label className="text-sm font-semibold text-foreground" htmlFor="caregiver-schedule">
                        Schedule notes
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Preferred times, shift limits, or foster home notes.
                      </p>
                      <textarea
                        id="caregiver-schedule"
                        placeholder="e.g. Tue, Thu, Sat mornings"
                        value={availabilityNotes}
                        onChange={(event) => setAvailabilityNotes(event.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                      />
                    </div>

                    <div className="space-y-3 border-t border-border/60 pt-5">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Skills & focus areas <span className="text-destructive">*</span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Used for scheduling and task assignment.
                        </p>
                      </div>
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
                                : 'border-border bg-background text-foreground hover:bg-muted/40',
                            )}
                          >
                            {skill}
                          </button>
                        ))}
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
