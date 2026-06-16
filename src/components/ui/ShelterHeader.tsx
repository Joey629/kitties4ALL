import { motion } from 'framer-motion';

interface ShelterHeaderProps {
  onExit: () => void;
}

export function ShelterHeader({ onExit }: ShelterHeaderProps) {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-5 pointer-events-none">
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={onExit}
        className="pointer-events-auto text-sm text-charcoal/50 hover:text-warm-brown transition-colors"
      >
        ← Leave shelter
      </motion.button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="pointer-events-none text-center"
      >
        <p className="font-display text-warm-brown/80 text-sm font-medium">Kitties 4 All</p>
      </motion.div>

      <div className="w-20" />
    </header>
  );
}

interface WelcomeHintProps {
  visible: boolean;
}

export function WelcomeHint({ visible }: WelcomeHintProps) {
  if (!visible) return null;

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: 1.5, duration: 1.5 }}
      className="absolute top-20 left-1/2 -translate-x-1/2 z-20 text-sm text-charcoal/40 text-center pointer-events-none"
    >
      Walk through the shelter — each cat has a story
    </motion.p>
  );
}
