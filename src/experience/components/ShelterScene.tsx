import { motion } from 'framer-motion';

export function ShelterScene() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <img
        src="/shelter/living-shelter-bg.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        draggable={false}
      />

      {/* Window light shimmer */}
      <motion.div
        className="absolute top-[8%] left-[2%] h-[42%] w-[22%] pointer-events-none"
        style={{
          background: 'linear-gradient(120deg, rgba(255,248,220,0.22) 0%, transparent 72%)',
        }}
        animate={{ opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
