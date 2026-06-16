import { useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/admin/lib/utils';
import type { LifestyleAnswers } from '@/shared/adoptionMatch';

interface AdoptionMatchQuizProps {
  onComplete: (answers: LifestyleAnswers) => void;
  onClose?: () => void;
  variant?: 'inline' | 'step';
}

type QuizStep = 'housing' | 'household' | 'lifestyle' | 'experience';

const steps: QuizStep[] = ['housing', 'household', 'lifestyle', 'experience'];

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-colors',
        selected
          ? 'border-sage bg-sage/10 text-warm-brown font-medium'
          : 'border-warm-brown/12 bg-white/70 text-charcoal/70 hover:border-sage/30',
      )}
    >
      {children}
    </button>
  );
}

export function AdoptionMatchQuiz({
  onComplete,
  onClose,
  variant = 'inline',
}: AdoptionMatchQuizProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [housing, setHousing] = useState<LifestyleAnswers['housing'] | null>(null);
  const [hasChildren, setHasChildren] = useState<boolean | null>(null);
  const [hasOtherPets, setHasOtherPets] = useState<boolean | null>(null);
  const [homeTime, setHomeTime] = useState<LifestyleAnswers['homeTime'] | null>(null);
  const [experience, setExperience] = useState<LifestyleAnswers['experience'] | null>(null);

  const step = steps[stepIndex];
  const isStep = variant === 'step';

  const canNext =
    step === 'housing'
      ? housing !== null
      : step === 'household'
        ? hasChildren !== null && hasOtherPets !== null
        : step === 'lifestyle'
          ? homeTime !== null
          : experience !== null;

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((value) => value + 1);
      return;
    }
    if (housing && hasChildren !== null && hasOtherPets !== null && homeTime && experience) {
      onComplete({ housing, hasChildren, hasOtherPets, homeTime, experience });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        isStep
          ? 'space-y-4'
          : 'mb-4 rounded-2xl border border-sage/25 bg-gradient-to-br from-sage/8 to-white/80 p-4',
      )}
    >
      <div className={cn('flex items-start justify-between gap-2', isStep && 'pr-10')}>
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-warm-brown">
            <Sparkles className="h-4 w-4 text-sage-dark" />
            {isStep ? 'Step 1 · Your home & lifestyle' : 'AI Find my match'}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-charcoal/60">
            Tell us about your home so we can suggest cats that fit your lifestyle.
          </p>
        </div>
        {!isStep && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-charcoal/45 hover:bg-white/80"
            aria-label="Close match quiz"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex gap-1">
        {steps.map((item, index) => (
          <span
            key={item}
            className={cn(
              'h-1 flex-1 rounded-full',
              index <= stepIndex ? 'bg-sage' : 'bg-warm-brown/15',
            )}
          />
        ))}
      </div>

      {step === 'housing' && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-warm-brown">Where do you live?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <ChoiceButton selected={housing === 'apartment'} onClick={() => setHousing('apartment')}>
              Apartment or condo
            </ChoiceButton>
            <ChoiceButton selected={housing === 'house'} onClick={() => setHousing('house')}>
              House or townhouse
            </ChoiceButton>
          </div>
        </div>
      )}

      {step === 'household' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium text-warm-brown">Children at home?</p>
            <div className="grid grid-cols-2 gap-2">
              <ChoiceButton selected={hasChildren === true} onClick={() => setHasChildren(true)}>Yes</ChoiceButton>
              <ChoiceButton selected={hasChildren === false} onClick={() => setHasChildren(false)}>No</ChoiceButton>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-warm-brown">Other pets?</p>
            <div className="grid grid-cols-2 gap-2">
              <ChoiceButton selected={hasOtherPets === true} onClick={() => setHasOtherPets(true)}>Yes</ChoiceButton>
              <ChoiceButton selected={hasOtherPets === false} onClick={() => setHasOtherPets(false)}>No</ChoiceButton>
            </div>
          </div>
        </div>
      )}

      {step === 'lifestyle' && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-warm-brown">How much time are you usually home?</p>
          <div className="grid gap-2">
            <ChoiceButton selected={homeTime === 'often'} onClick={() => setHomeTime('often')}>
              Most of the day — someone is usually home
            </ChoiceButton>
            <ChoiceButton selected={homeTime === 'part_time'} onClick={() => setHomeTime('part_time')}>
              Part of the day — regular routine
            </ChoiceButton>
            <ChoiceButton selected={homeTime === 'away'} onClick={() => setHomeTime('away')}>
              Mostly out — home mornings and evenings
            </ChoiceButton>
          </div>
        </div>
      )}

      {step === 'experience' && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-warm-brown">Your cat experience</p>
          <div className="grid gap-2">
            <ChoiceButton selected={experience === 'first_time'} onClick={() => setExperience('first_time')}>
              First-time cat parent
            </ChoiceButton>
            <ChoiceButton selected={experience === 'some'} onClick={() => setExperience('some')}>
              Some experience with cats
            </ChoiceButton>
            <ChoiceButton selected={experience === 'experienced'} onClick={() => setExperience('experienced')}>
              Very experienced with cats
            </ChoiceButton>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {stepIndex > 0 && (
          <Button type="button" variant="secondary" size="sm" onClick={() => setStepIndex((value) => value - 1)}>
            Back
          </Button>
        )}
        <Button type="button" variant="coral" size="sm" className="flex-1" disabled={!canNext} onClick={handleNext}>
          {stepIndex === steps.length - 1 ? 'See my matches' : 'Continue'}
        </Button>
      </div>
    </motion.div>
  );
}
