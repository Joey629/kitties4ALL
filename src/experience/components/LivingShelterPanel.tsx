import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const stats = [
  { value: '7', label: 'Cats in our care' },
  { value: '100%', label: 'No-kill policy' },
  { value: '24/7', label: 'Volunteer coverage' },
];

export function LivingShelterPanel() {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="absolute top-20 right-4 md:right-8 z-20 w-[min(100%,280px)] rounded-2xl border border-warm-brown/12 bg-[rgba(255,252,246,0.82)] backdrop-blur-sm shadow-[0_12px_32px_rgba(92,74,54,0.1)] p-4 md:p-5 pointer-events-none"
    >
      <div className="flex items-center gap-2 text-sage-dark mb-3">
        <Sparkles className="h-4 w-4" strokeWidth={2} />
        <span className="text-xs font-semibold tracking-wide uppercase">Living shelter</span>
      </div>
      <p className="text-xs text-charcoal/65 leading-relaxed mb-4">
        Explore an illustrated space where every cat has a name, a story, and a spot in the room.
        Hover to greet them. Click to learn more.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-white/80 border border-warm-brown/8 px-2 py-3 text-center"
          >
            <p className="font-display text-base font-semibold text-warm-brown">{stat.value}</p>
            <p className="text-[10px] text-charcoal/55 mt-0.5 leading-snug">{stat.label}</p>
          </div>
        ))}
      </div>
    </motion.aside>
  );
}
