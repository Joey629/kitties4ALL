import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Cat } from '../../types/cat';
import { Button } from './Button';
import { ModalCompletion } from './ModalCompletion';
import { cn } from '@/admin/lib/utils';
import { modalTransition, overlayTransition } from '../../experience/motion';
import { recordDonation } from '@/shared/donors';

interface SupportModalProps {
  cat: Cat | null;
  isOpen: boolean;
  onClose: () => void;
  onReturnHome: () => void;
  onMeetMoreCats: () => void;
}

const SUPPORT_OPTIONS = [
  { amount: '$10', label: 'A week of treats' },
  { amount: '$25', label: 'Vet checkup contribution' },
  { amount: '$50', label: 'One month of care' },
  { amount: '$100', label: 'Full sponsorship' },
];

const inputClass =
  'w-full px-4 py-3 rounded-xl border-2 border-warm-brown/15 bg-white/70 focus:outline-none focus:ring-2 focus:ring-sage';

export function SupportModal({ cat, isOpen, onClose, onReturnHome: _onReturnHome, onMeetMoreCats }: SupportModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [completed, setCompleted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedAmount(null);
      setName('');
      setEmail('');
      setCompleted(false);
      setSubmittedEmail('');
    }
  }, [isOpen]);

  const handleDonate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAmount || !name.trim() || !email.trim()) return;

    recordDonation({
      name: name.trim(),
      email: email.trim(),
      amount: selectedAmount,
      catId: cat?.id,
      catName: cat?.name,
    });

    setSubmittedEmail(email.trim());
    setCompleted(true);
  };

  const handleClose = () => {
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
            aria-label={cat ? 'Support this cat' : 'Support our shelter'}
          >
            <div
              className="experience-story-panel rounded-3xl p-8 max-w-lg w-full max-h-[90dvh] overflow-y-auto shadow-2xl pointer-events-auto relative border border-warm-brown/10"
              onClick={(e) => e.stopPropagation()}
            >
              {completed && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="absolute top-5 right-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border-2 border-warm-brown/10 bg-white text-warm-brown/60 transition-colors hover:bg-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              <AnimatePresence mode="wait">
                {completed ? (
                  <motion.div
                    key="completed"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ModalCompletion
                      title="Thank you!"
                      message={
                        cat
                          ? `Your ${selectedAmount} gift for ${cat.name} makes a real difference. We'll send a confirmation to ${submittedEmail}.`
                          : `Your ${selectedAmount} gift helps every cat in our care. We'll send a confirmation to ${submittedEmail}.`
                      }
                      particles={['🐾', '✨', '💛', '🐾']}
                      primaryAction={{ label: 'Meet more cats', onClick: onMeetMoreCats }}
                    />
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                    onSubmit={handleDonate}
                  >
                    <div className="text-center">
                      <span className="text-4xl mb-3 block">🐾</span>
                      <h2 className="font-display text-2xl font-bold text-warm-brown">
                        {cat ? `Support ${cat.name}` : 'Support our shelter'}
                      </h2>
                      <p className="text-charcoal/70 mt-2 leading-relaxed">
                        {cat
                          ? 'Your donation helps cover food, medical care, and shelter for cats waiting for their forever homes.'
                          : 'Your gift helps cover food, medical care, and daily comfort for every cat in our care.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {SUPPORT_OPTIONS.map((option) => {
                        const isSelected = selectedAmount === option.amount;
                        return (
                          <button
                            key={option.amount}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => setSelectedAmount(option.amount)}
                            className={cn(
                              'rounded-xl border-2 p-4 text-left transition-colors',
                              isSelected
                                ? 'border-sage bg-sage/15 ring-2 ring-sage/25'
                                : 'border-warm-brown/12 bg-white/60 hover:border-sage/30 hover:bg-sage/10',
                            )}
                          >
                            <span className="font-display text-xl font-bold text-warm-brown">
                              {option.amount}
                            </span>
                            <p className="mt-1 text-xs text-charcoal/60">{option.label}</p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Your name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputClass}
                      />
                      <input
                        type="email"
                        placeholder="Email address"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        variant="primary"
                        className="flex-1"
                        disabled={!selectedAmount || !name.trim() || !email.trim()}
                      >
                        Donate {selectedAmount ?? 'now'}
                      </Button>
                      <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                      </Button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
