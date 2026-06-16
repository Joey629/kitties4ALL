import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { FosterApplicationCard } from '../components/FosterWorkflowCards';
import { Button } from '@/admin/components/ui/button';
import { cn } from '@/admin/lib/utils';

export function FosterApplyScreen() {
  const navigate = useNavigate();
  const { user, fosterApplication, submitFosterApplication, withdrawFosterApplication } = useCompanion();
  const [householdType, setHouseholdType] = useState<'house' | 'apartment'>('house');
  const [hasOtherPets, setHasOtherPets] = useState(false);
  const [experience, setExperience] = useState('');
  const [availability, setAvailability] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = experience.trim().length > 0 && availability.trim().length > 0;
  const blockingApplication =
    fosterApplication &&
    fosterApplication.status !== 'rejected' &&
    !submitted;

  const handleSubmit = () => {
    if (!canSubmit) return;
    submitFosterApplication({
      householdType,
      hasOtherPets,
      experience,
      availability,
      notes,
    });
    setSubmitted(true);
    window.setTimeout(() => navigate('/companion/my-cats'), 1200);
  };

  if (blockingApplication) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-4 pb-6">
        <Link
          to="/companion/my-cats"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Cats
        </Link>
        <FosterApplicationCard
          application={fosterApplication}
          onWithdraw={withdrawFosterApplication}
        />
      </motion.div>
    );
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex min-h-[60vh] flex-col items-center justify-center px-8 text-center"
      >
        <p className="text-5xl mb-4">📋</p>
        <h1 className="text-xl font-semibold text-foreground">Application submitted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The shelter team will review your foster application and notify you in Messages.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-4 pb-8">
      <Link
        to="/companion/my-cats"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <h1 className="text-xl font-semibold text-foreground">Foster application</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell the shelter about your home. After approval, you&apos;ll receive foster cat matches to review.
      </p>

      <div className="mt-6 space-y-5">
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">Home type</p>
          <div className="flex gap-2">
            {(['house', 'apartment'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setHouseholdType(type)}
                className={cn(
                  'flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium capitalize transition-colors',
                  householdType === type
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground',
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">Other pets at home?</p>
          <div className="flex gap-2">
            {[false, true].map((value) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => setHasOtherPets(value)}
                className={cn(
                  'flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                  hasOtherPets === value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground',
                )}
              >
                {value ? 'Yes' : 'No'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="experience" className="mb-2 block text-sm font-semibold text-foreground">
            Cat experience
          </label>
          <textarea
            id="experience"
            value={experience}
            onChange={(event) => setExperience(event.target.value)}
            rows={3}
            placeholder="Tell us about your experience caring for cats..."
            className="w-full resize-none rounded-xl border border-input bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <div>
          <label htmlFor="availability" className="mb-2 block text-sm font-semibold text-foreground">
            Availability
          </label>
          <textarea
            id="availability"
            value={availability}
            onChange={(event) => setAvailability(event.target.value)}
            rows={2}
            placeholder="When can you start? How long can you foster?"
            className="w-full resize-none rounded-xl border border-input bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <div>
          <label htmlFor="notes" className="mb-2 block text-sm font-semibold text-foreground">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            placeholder="Anything else the shelter should know..."
            className="w-full resize-none rounded-xl border border-input bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="mt-6 h-12 w-full rounded-xl text-base"
      >
        <Send className="h-4 w-4" />
        Submit application
      </Button>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Applying as {user.name}
      </p>
    </motion.div>
  );
}
