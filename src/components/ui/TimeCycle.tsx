import { motion } from 'framer-motion';

interface TimeCycleProps {
  ambient: string;
  label: string;
}

export function TimeCycle({ ambient, label }: TimeCycleProps) {
  return (
    <motion.div
      key={label}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center"
    >
      <p className="text-sm text-charcoal/50 font-medium tracking-wide">
        {ambient}
      </p>
    </motion.div>
  );
}
