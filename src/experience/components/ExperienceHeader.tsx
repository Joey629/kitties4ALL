import { motion } from 'framer-motion';
import { ArrowLeft, ClipboardCheck } from 'lucide-react';

interface ExperienceHeaderProps {
  onExit: () => void;
  onTrackApplication: () => void;
}

export function ExperienceHeader({ onExit, onTrackApplication }: ExperienceHeaderProps) {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between gap-3 px-5 py-4 md:px-8 md:py-5">
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onExit}
        className="flex items-center gap-2 rounded-full border border-warm-brown/12 bg-white/90 px-4 py-2.5 text-sm font-medium text-warm-brown/75 shadow-[0_4px_20px_-12px_rgba(139,111,71,0.35)] transition-colors hover:text-warm-brown"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Leave shelter
      </motion.button>

      <motion.button
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        type="button"
        onClick={onTrackApplication}
        className="inline-flex items-center gap-1.5 rounded-full border border-warm-brown/12 bg-white/82 px-3.5 py-2 text-sm font-semibold text-sage-dark shadow-[0_4px_16px_-10px_rgba(139,111,71,0.35)] transition-colors hover:bg-white hover:text-sage sm:px-4"
      >
        <ClipboardCheck className="h-4 w-4 shrink-0" />
        <span className="hidden min-[420px]:inline">Track your adoption</span>
        <span className="min-[420px]:hidden">Track</span>
      </motion.button>
    </header>
  );
}
