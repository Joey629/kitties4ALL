import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, HandHeart } from 'lucide-react';
import type { Cat } from '../../types/cat';
import { getStatusLabel, getAdoptionStatusNote } from '../data/sceneCats';
import { Button } from '../../components/ui/Button';
import { CatPhoto } from '../../components/ui/CatPhoto';
import { CatShelterFacts } from '../../components/ui/CatShelterFacts';
import { drawerTransition, overlayTransition } from '../motion';
import { formatDate } from '@/admin/lib/utils';
import {
  eventDotClass,
  formatEventType,
  getCatShelterProfile,
} from '@/shared/catShelterRecords';
import { isCatOpenForAdoption } from '@/shared/adoptionStatus';
import { getAdoptionPickerNote } from '@/shared/adoptableCats';

interface StoryCardProps {
  cat: Cat | null;
  onClose: () => void;
  onAdopt: () => void;
  onSupport: () => void;
}

export function StoryCard({ cat, onClose, onAdopt, onSupport }: StoryCardProps) {
  const [showFullStory, setShowFullStory] = useState(false);
  const shelterProfile = cat ? getCatShelterProfile(cat.id) : null;
  const canAdopt = cat ? isCatOpenForAdoption(cat) : false;
  const pickerNote = cat ? getAdoptionPickerNote(cat) : null;
  const statusNote = cat && !canAdopt ? getAdoptionStatusNote(cat) : null;

  useEffect(() => {
    if (!cat) {
      setShowFullStory(false);
      return;
    }

    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [cat]);

  return (
    <AnimatePresence onExitComplete={() => setShowFullStory(false)}>
      {cat && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
            className="fixed inset-0 bg-warm-brown/20 z-[100] touch-none"
            onClick={onClose}
          />
          <motion.aside
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={drawerTransition}
            className="fixed inset-y-0 right-0 z-[110] flex h-dvh w-full max-w-md flex-col overflow-hidden border-l border-warm-brown/10 bg-[#FDF6EC] shadow-2xl pointer-events-auto"
            role="dialog"
            aria-label={`Profile of ${cat.name}`}
          >
            <div className="relative flex min-h-0 flex-1 flex-col">
              <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-6 md:p-8 [-webkit-overflow-scrolling:touch]">
                <button
                  onClick={onClose}
                  className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-white hover:bg-white border-2 border-warm-brown/10 flex items-center justify-center text-warm-brown/60 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col items-center text-center mb-6 pt-4">
                  <motion.div
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-4"
                  >
                    <CatPhoto
                      catId={cat.id}
                      name={cat.name}
                      image={cat.image}
                      accentColor={cat.appearance.accentColor}
                      frameClassName="h-40 w-32 rounded-3xl shadow-lg"
                    />
                  </motion.div>
                  <h2 className="font-display text-3xl font-bold text-warm-brown">{cat.name}</h2>
                  <p className="text-sm text-charcoal/50 mt-1">{cat.age} · {cat.breed}</p>
                  <span
                    className={`mt-3 inline-block px-4 py-1.5 rounded-full text-xs font-semibold border ${
                      cat.adoptionStatus === 'pending'
                        ? 'bg-soft-orange/15 text-soft-orange border-soft-orange/20'
                        : cat.adoptionStatus === 'adopted'
                          ? 'bg-lavender/15 text-lavender border-lavender/20'
                          : 'bg-sage/15 text-sage-dark border-sage/20'
                    }`}
                  >
                    {getStatusLabel(cat)}
                  </span>
                </div>

                <p className="mb-4 text-center text-sm leading-relaxed text-charcoal/70">{cat.tagline}</p>

                <div className="flex flex-wrap justify-center gap-2 mb-5">
                  {cat.personality.map((trait) => (
                    <span
                      key={trait}
                      className="px-3 py-1.5 rounded-full bg-cream-dark text-sm text-warm-brown border border-warm-brown/10 font-medium"
                    >
                      {trait}
                    </span>
                  ))}
                </div>

                <div className="mb-5 rounded-2xl border border-warm-brown/10 bg-white/80 p-4 text-left">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-charcoal/45">
                    About {cat.name}
                  </p>
                  <p className="text-sm leading-relaxed text-charcoal/75">{cat.story}</p>
                </div>

                <div className="mb-5 rounded-2xl border border-warm-brown/10 bg-white/80 p-4 text-left">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-charcoal/45">
                    Shelter details
                  </p>
                  <CatShelterFacts catId={cat.id} />
                </div>

                <AnimatePresence>
                  {showFullStory && shelterProfile && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-4"
                    >
                      <div className="rounded-2xl border border-warm-brown/10 bg-white/80 p-4">
                        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-charcoal/45">
                          Full shelter record
                        </p>
                        <div className="relative space-y-5 pl-5">
                          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-warm-brown/15" />
                          {shelterProfile.timeline.map((event) => (
                            <div key={event.id} className="relative text-left">
                              <span
                                className={`absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full ${eventDotClass(event.type)}`}
                              />
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-warm-brown">{event.title}</p>
                                <span className="rounded-full bg-cream-dark px-2 py-0.5 text-[10px] font-medium text-warm-brown/70">
                                  {formatEventType(event.type)}
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-charcoal/45">{formatDate(event.date)}</p>
                              <p className="mt-1 text-sm leading-relaxed text-charcoal/70">{event.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {shelterProfile && (
                  <button
                    onClick={() => setShowFullStory((value) => !value)}
                    className="w-full text-center text-sm text-sage-dark font-semibold hover:text-sage mb-6 transition-colors"
                  >
                    {showFullStory ? 'Show less' : `View ${cat.name}'s full story`}
                  </button>
                )}

                <div className="space-y-3 pt-4 border-t border-warm-brown/10">
                  {canAdopt && (
                    <Button variant="coral" onClick={onAdopt} className="w-full">
                      <Heart className="w-4 h-4" />
                      Adopt {cat.name}
                    </Button>
                  )}
                  {pickerNote && canAdopt && (
                    <p className="rounded-xl border border-warm-brown/12 bg-white/70 px-4 py-3 text-center text-sm text-charcoal/65">
                      {pickerNote}
                    </p>
                  )}
                  {statusNote && !canAdopt && (
                    <p className="rounded-xl border border-warm-brown/12 bg-white/70 px-4 py-3 text-center text-sm leading-relaxed text-charcoal/65">
                      {statusNote}
                    </p>
                  )}
                  <Button variant="secondary" onClick={onSupport} className="w-full">
                    <HandHeart className="w-4 h-4" />
                    Support {cat.name}
                  </Button>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
