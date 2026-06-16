import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronLeft, Cat as CatIcon, PencilLine, X } from 'lucide-react';
import type { Cat } from '../../types/cat';
import { Button } from './Button';
import { ModalCompletion } from './ModalCompletion';
import { CatPhoto } from './CatPhoto';
import { AdoptionCatSnapshot } from './AdoptionCatSnapshot';
import { AdoptionMatchQuiz } from './AdoptionMatchQuiz';
import { modalTransition, overlayTransition } from '../../experience/motion';
import { getAdoptionPickerCats, canSubmitAdoptionApplication, getAdoptionPickerNote } from '@/shared/adoptableCats';
import { submitAdoptionApplication, subscribeAdoptionApplications, type SubmitApplicationError } from '@/shared/adoptionApplications';
import { hasBlockingApplicationForApplicant, getCatAdoptionUnavailableMessage } from '@/shared/adoptionStatus';
import { cats as baseCats } from '@/data/cats';
import { rankCatsForLifestyle, type CatMatchResult, type LifestyleAnswers } from '@/shared/adoptionMatch';
import { loadLifestyleAnswers, saveLifestyleAnswers } from '@/shared/adopterLifestyle';

function isListedForAdoption(cat: Cat) {
  const base = baseCats.find((item) => item.id === cat.id) ?? cat;
  return (
    base.fosterStatus === 'in_shelter' &&
    base.adoptionStatus === 'available' &&
    base.healthStatus === 'healthy'
  );
}
import { cn } from '@/admin/lib/utils';
import { useLiveCats } from '@/hooks/useLiveCats';

interface AdoptionModalProps {
  cat: Cat | null;
  isOpen: boolean;
  onClose: () => void;
  onReturnHome: () => void;
  onMeetMoreCats: () => void;
  onTrackApplication: (name: string, email: string) => void;
}

type Step = 'match' | 'pick' | 'form' | 'done';

const inputClass =
  'w-full px-4 py-3 rounded-xl border-2 border-warm-brown/15 bg-white/70 focus:outline-none focus:ring-2 focus:ring-sage';

const labelClass = 'mb-1 block text-xs font-semibold text-charcoal/55';

const SUBMIT_ERROR_MESSAGES: Record<SubmitApplicationError, string> = {
  duplicate: 'You already submitted an adoption request for this cat.',
  cat_unavailable: 'This cat is not currently accepting new adoptions. Please choose another cat.',
};

export function AdoptionModal({
  cat,
  isOpen,
  onClose,
  onReturnHome: _onReturnHome,
  onMeetMoreCats,
  onTrackApplication,
}: AdoptionModalProps) {
  const liveCats = useLiveCats();
  const adoptableCats = useMemo(() => getAdoptionPickerCats(liveCats), [liveCats]);
  const resolvedCat = cat ? liveCats.find((item) => item.id === cat.id) ?? cat : null;

  const [step, setStep] = useState<Step>('match');
  const [pickedCat, setPickedCat] = useState<Cat | null>(null);
  const [lifestyleAnswers, setLifestyleAnswers] = useState<LifestyleAnswers | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState<SubmitApplicationError | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);
  const [matchResults, setMatchResults] = useState<CatMatchResult[] | null>(null);
  const matchByCatId = useMemo(
    () => new Map((matchResults ?? []).map((result) => [result.cat.id, result])),
    [matchResults],
  );

  const displayCats = useMemo(() => {
    if (!matchResults) return adoptableCats;
    const order = new Map(matchResults.map((result, index) => [result.cat.id, index]));
    return [...adoptableCats].sort(
      (a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99),
    );
  }, [adoptableCats, matchResults]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setNotes('');
    setSubmitError(null);
  };

  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      if (wasOpenRef.current) {
        setStep('match');
        setPickedCat(null);
        setLifestyleAnswers(null);
        resetForm();
        setSubmittedEmail('');
        setExpandedCatId(null);
        setMatchResults(null);
      }
      wasOpenRef.current = false;
      return;
    }

    const opening = !wasOpenRef.current;
    wasOpenRef.current = true;

    const stored = loadLifestyleAnswers();
    const hasPreselectedCat = !!(resolvedCat && isListedForAdoption(resolvedCat));

    if (opening) {
      if (hasPreselectedCat) {
        setPickedCat(resolvedCat);
      } else {
        setPickedCat(null);
      }

      if (stored) {
        setLifestyleAnswers(stored);
        setMatchResults(rankCatsForLifestyle(adoptableCats, stored));
        setStep(hasPreselectedCat ? 'form' : 'pick');
      } else {
        setLifestyleAnswers(null);
        setMatchResults(null);
        setStep('match');
      }
    } else if (stored) {
      setLifestyleAnswers(stored);
      setMatchResults(rankCatsForLifestyle(adoptableCats, stored));
    }
  }, [isOpen, resolvedCat?.id, resolvedCat?.adoptionStatus, resolvedCat?.healthStatus, adoptableCats]);

  const activeCat = pickedCat
    ? liveCats.find((item) => item.id === pickedCat.id) ?? pickedCat
    : null;

  useEffect(() => {
    if (!isOpen || step !== 'form' || !activeCat || submitError !== 'duplicate') return;
    if (!name.trim() || !email.trim()) return;

    const unsubscribe = subscribeAdoptionApplications(() => {
      if (!hasBlockingApplicationForApplicant(name.trim(), email.trim(), activeCat.id)) {
        setSubmitError(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, step, activeCat, name, email, submitError]);

  useEffect(() => {
    if (submitError !== 'duplicate' || !activeCat || !name.trim() || !email.trim()) return;
    if (!hasBlockingApplicationForApplicant(name.trim(), email.trim(), activeCat.id)) {
      setSubmitError(null);
    }
  }, [name, email, activeCat, submitError]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeCat || !lifestyleAnswers) {
      setStep('match');
      return;
    }
    const result = submitAdoptionApplication({
      applicantName: name,
      email,
      phone: phone.trim() || undefined,
      catId: activeCat.id,
      catName: activeCat.name,
      notes: notes.trim() || undefined,
      lifestyleProfile: lifestyleAnswers,
    });

    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }

    setSubmitError(null);
    setSubmittedEmail(email.trim());
    setStep('done');
  };

  const handleSelectCat = (item: Cat) => {
    if (!canSubmitAdoptionApplication(item.id)) return;
    setPickedCat(item);
    setStep('form');
    setSubmitError(null);
  };

  const handleMatchComplete = (answers: LifestyleAnswers) => {
    saveLifestyleAnswers(answers);
    setLifestyleAnswers(answers);
    setMatchResults(rankCatsForLifestyle(adoptableCats, answers));
    const preselected =
      pickedCat ?? (resolvedCat && isListedForAdoption(resolvedCat) ? resolvedCat : null);
    if (preselected) {
      setPickedCat(preselected);
      setStep('form');
    } else {
      setStep('pick');
    }
  };

  const handleClose = () => onClose();

  const handleTrackApplication = () => {
    onTrackApplication(name.trim(), email.trim());
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
            className="fixed inset-0 bg-warm-brown/25 backdrop-blur-sm z-[200]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={modalTransition}
            className="fixed inset-0 z-[210] flex items-center justify-center p-6 pointer-events-none"
            role="dialog"
            aria-label="Adoption"
          >
            <div
              className="experience-story-panel rounded-3xl p-8 max-w-xl w-full max-h-[90dvh] overflow-y-auto shadow-2xl pointer-events-auto relative border border-warm-brown/10"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleClose}
                className="absolute top-5 right-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border-2 border-warm-brown/10 bg-white text-warm-brown/60 transition-colors hover:bg-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <AnimatePresence mode="wait">
                {step === 'done' && activeCat ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ModalCompletion
                      title="Adoption request sent!"
                      message={`Thanks! We'll review your adoption request for ${activeCat.name} and email you at ${submittedEmail}.`}
                      particles={['💛', '✨', '🐾', '💛']}
                      primaryAction={{ label: 'Meet more cats', onClick: onMeetMoreCats }}
                      linkAction={{
                        hint: 'You can check your status anytime with',
                        label: 'Track your adoption',
                        onClick: handleTrackApplication,
                      }}
                    />
                  </motion.div>
                ) : step === 'match' ? (
                  <motion.div
                    key="match"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mb-4 pr-10">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl leading-none" aria-hidden>
                          💛
                        </span>
                        <h2 className="font-display text-2xl font-bold text-warm-brown">Adopt a cat</h2>
                      </div>
                    </div>
                    <AdoptionMatchQuiz variant="step" onComplete={handleMatchComplete} />
                  </motion.div>
                ) : step === 'pick' ? (
                  <motion.div
                    key="pick"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mb-3 pr-10">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl leading-none" aria-hidden>
                          💛
                        </span>
                        <h2 className="font-display text-2xl font-bold text-warm-brown">Adopt a cat</h2>
                      </div>
                      <div className="mt-3">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-warm-brown">
                          <CatIcon className="h-4 w-4 text-sage-dark" />
                          Step 2 · Cats matched to your lifestyle — best fit first.
                        </p>
                        {lifestyleAnswers && (
                          <button
                            type="button"
                            onClick={() => setStep('match')}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-sage/35 bg-sage/8 px-3 py-1.5 text-xs font-semibold text-sage-dark transition-colors hover:border-sage/50 hover:bg-sage/12"
                          >
                            <PencilLine className="h-3.5 w-3.5" />
                            Update my answers
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="mb-3 text-sm leading-relaxed text-charcoal">
                      {matchResults
                        ? 'Available for adoption, ranked by how well each cat fits your home.'
                        : 'Available for adoption'}
                    </p>

                    <div className="space-y-2 max-h-[min(360px,50dvh)] overflow-y-auto pr-1">
                        {displayCats.map((item) => {
                          const isExpanded = expandedCatId === item.id;
                          const pickerNote = getAdoptionPickerNote(item);
                          const canApply = canSubmitAdoptionApplication(item.id);
                          const match = matchByCatId.get(item.id);

                          return (
                            <div
                              key={item.id}
                              className={cn(
                                'rounded-xl border-2 transition-colors',
                                isExpanded
                                  ? 'border-sage/30 bg-white'
                                  : 'border-warm-brown/12 bg-white/70',
                              )}
                            >
                              <div className="flex items-center gap-3 p-3">
                                <CatPhoto
                                  catId={item.id}
                                  name={item.name}
                                  image={item.image}
                                  accentColor={item.appearance.accentColor}
                                  frameClassName="h-16 w-14"
                                />
                                <button
                                  type="button"
                                  onClick={() => setExpandedCatId(isExpanded ? null : item.id)}
                                  className="min-w-0 flex-1 text-left"
                                >
                                  <p className="font-semibold text-warm-brown">{item.name}</p>
                                  <p className="text-sm text-charcoal/60 truncate">
                                    {item.age} · {item.breed}
                                  </p>
                                  {match && (
                                    <p className="mt-1 text-xs font-semibold text-sage-dark">
                                      {match.score}% match · {match.reasons[0]}
                                    </p>
                                  )}
                                  <p className="mt-1 text-xs text-sage-dark">
                                    {isExpanded ? 'Hide details' : 'View more'}
                                  </p>
                                </button>
                                <button
                                  type="button"
                                  aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                                  onClick={() => setExpandedCatId(isExpanded ? null : item.id)}
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-warm-brown/12 text-warm-brown/70 transition-colors hover:bg-muted/40"
                                >
                                  <ChevronDown
                                    className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')}
                                  />
                                </button>
                              </div>

                              <AnimatePresence initial={false}>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="space-y-3 border-t border-warm-brown/10 bg-white px-3 pb-3 pt-3">
                                      <AdoptionCatSnapshot cat={item} compact />

                                      {pickerNote && (
                                        <p className="rounded-lg border border-warm-brown/10 bg-cream/50 px-3 py-2 text-xs leading-relaxed text-charcoal/65">
                                          {pickerNote}
                                        </p>
                                      )}

                                      <Button
                                        variant="coral"
                                        className="w-full"
                                        disabled={!canApply}
                                        onClick={() => handleSelectCat(item)}
                                      >
                                        Apply for {item.name}
                                      </Button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                    </div>
                  </motion.div>
                ) : activeCat ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setStep('pick');
                        setSubmitError(null);
                      }}
                      className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-sage-dark hover:text-sage"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Choose a different cat
                    </button>

                    <div className="mb-4 flex items-start gap-3 pr-10">
                      <CatPhoto
                        catId={activeCat.id}
                        name={activeCat.name}
                        image={activeCat.image}
                        accentColor={activeCat.appearance.accentColor}
                        frameClassName="h-20 w-16"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl leading-none" aria-hidden>
                            💛
                          </span>
                          <h2 className="font-display text-xl font-bold text-warm-brown">
                            Adopt {activeCat.name}
                          </h2>
                        </div>
                        <p className="mt-1 text-sm text-charcoal/70 leading-relaxed">
                          Step 3 · Contact details to finish your adoption.
                        </p>
                        {matchByCatId.get(activeCat.id) && (
                          <p className="mt-1 text-xs font-semibold text-sage-dark">
                            {matchByCatId.get(activeCat.id)!.score}% lifestyle match
                          </p>
                        )}
                      </div>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                      <div>
                        <label htmlFor="adopt-name" className={labelClass}>
                          Full name
                        </label>
                        <input
                          id="adopt-name"
                          type="text"
                          required
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="adopt-email" className={labelClass}>
                          Email
                        </label>
                        <input
                          id="adopt-email"
                          type="email"
                          required
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="adopt-phone" className={labelClass}>
                          Phone <span className="font-normal text-charcoal/40">(optional)</span>
                        </label>
                        <input
                          id="adopt-phone"
                          type="tel"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="adopt-notes" className={labelClass}>
                          Message <span className="font-normal text-charcoal/40">(optional)</span>
                        </label>
                        <textarea
                          id="adopt-notes"
                          rows={3}
                          placeholder="Anything you'd like us to know?"
                          value={notes}
                          onChange={(event) => setNotes(event.target.value)}
                          className={cn(inputClass, 'resize-none')}
                        />
                      </div>

                      {submitError && (
                        <p className="rounded-xl border border-coral/20 bg-coral/5 px-3 py-2 text-sm leading-relaxed text-coral">
                          {submitError === 'duplicate' ? (
                            <>
                              You already submitted an adoption request for this cat.{' '}
                              <button
                                type="button"
                                onClick={handleTrackApplication}
                                className="font-semibold text-sage-dark underline underline-offset-2 transition-colors hover:text-sage"
                              >
                                Track your adoption
                              </button>
                            </>
                          ) : (
                            getCatAdoptionUnavailableMessage(activeCat?.id ?? '') ||
                              SUBMIT_ERROR_MESSAGES[submitError]
                          )}
                        </p>
                      )}

                      <div className="pt-2">
                        <Button type="submit" variant="coral" className="w-full">
                          Submit adoption request
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
