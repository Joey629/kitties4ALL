import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WorldCat } from '../../types/cat';
import { Button } from './Button';
import { drawerTransition } from '../../experience/motion';
import { isCatOpenForAdoption } from '@/shared/adoptionStatus';
import { getStatusLabel, getAdoptionStatusNote } from '@/experience/data/sceneCats';

const STATUS_STYLES = {
  available: 'text-sage-dark',
  pending: 'text-soft-orange',
  adopted: 'text-lavender',
} as const;

interface CatProfileCardProps {
  cat: WorldCat;
  showFullStory: boolean;
  onToggleStory: () => void;
}

export function CatProfileCard({ cat, showFullStory, onToggleStory }: CatProfileCardProps) {
  const statusLabel = getStatusLabel(cat);
  const statusColor = STATUS_STYLES[cat.adoptionStatus] ?? STATUS_STYLES.available;

  return (
    <div>
      <div className="flex items-start gap-4 mb-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-sm"
          style={{ backgroundColor: cat.appearance.accentColor + '44' }}
        >
          🐱
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-warm-brown">{cat.name}</h2>
          <p className="text-sm text-charcoal/60">{cat.age} · {cat.breed}</p>
          <p className={`text-xs font-medium mt-1 ${statusColor}`}>{statusLabel}</p>
        </div>
      </div>

      <blockquote className="border-l-2 border-sage/40 pl-4 mb-5">
        <p className="text-charcoal/80 italic leading-relaxed text-base">
          &ldquo;{cat.tagline}&rdquo;
        </p>
      </blockquote>

      <div className="flex flex-wrap gap-2 mb-5">
        {cat.personality.map((trait) => (
          <span
            key={trait}
            className="px-3 py-1 rounded-full bg-cream-dark/80 text-sm text-warm-brown"
          >
            {trait}
          </span>
        ))}
      </div>

      <p className="text-xs text-charcoal/45 mb-3">{cat.preferredSpot}</p>

      <AnimatePresence>
        {showFullStory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="text-charcoal/75 leading-relaxed text-sm pb-4">
              {cat.story}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={onToggleStory}
        className="text-sm text-sage-dark font-medium hover:text-sage transition-colors"
      >
        {showFullStory ? 'Show less' : `Meet ${cat.name}`}
      </button>
    </div>
  );
}

interface StoryPanelProps {
  cat: WorldCat | null;
  onClose: () => void;
  onAdopt: () => void;
  onSupport: () => void;
}

function StoryPanelContent({
  cat,
  showFullStory,
  onToggleStory,
  onClose,
  onAdopt,
  onSupport,
}: {
  cat: WorldCat;
  showFullStory: boolean;
  onToggleStory: () => void;
  onClose: () => void;
  onAdopt: () => void;
  onSupport: () => void;
}) {
  const canAdopt = isCatOpenForAdoption(cat);
  const statusNote = !canAdopt ? getAdoptionStatusNote(cat) : null;

  return (
    <motion.aside
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={drawerTransition}
      className="fixed bottom-0 left-0 right-0 z-40 pointer-events-auto"
      role="dialog"
      aria-label={`Story for ${cat.name}`}
    >
      <div className="mx-auto max-w-lg px-4 pb-6">
        <div className="story-card relative rounded-3xl p-6 md:p-8 shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-warm-brown/8 hover:bg-warm-brown/15 flex items-center justify-center text-warm-brown/60 transition-colors text-sm"
            aria-label="Close"
          >
            ✕
          </button>

          <CatProfileCard
            cat={cat}
            showFullStory={showFullStory}
            onToggleStory={onToggleStory}
          />

          <div className="flex flex-col gap-2.5 mt-6 pt-5 border-t border-warm-brown/10">
            {canAdopt && (
              <Button variant="coral" onClick={onAdopt} className="w-full">
                Start adoption
              </Button>
            )}
            {statusNote && !canAdopt && (
              <p className="rounded-xl border border-warm-brown/12 bg-cream-dark/50 px-4 py-3 text-center text-sm leading-relaxed text-charcoal/65">
                {statusNote}
              </p>
            )}
            <Button variant="secondary" onClick={onSupport} className="w-full">
              Support {cat.name}
            </Button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

export function StoryPanel({ cat, onClose, onAdopt, onSupport }: StoryPanelProps) {
  const [showFullStory, setShowFullStory] = useState(false);

  return (
    <AnimatePresence
      onExitComplete={() => setShowFullStory(false)}
    >
      {cat && (
        <StoryPanelContent
          cat={cat}
          showFullStory={showFullStory}
          onToggleStory={() => setShowFullStory((s) => !s)}
          onClose={() => {
            setShowFullStory(false);
            onClose();
          }}
          onAdopt={onAdopt}
          onSupport={onSupport}
        />
      )}
    </AnimatePresence>
  );
}
