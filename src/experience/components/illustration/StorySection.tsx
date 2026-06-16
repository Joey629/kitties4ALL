import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface StorySectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  illustration?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

export function StorySection({
  title,
  subtitle,
  children,
  illustration,
  align = 'left',
  className = '',
}: StorySectionProps) {
  const centered = align === 'center';

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-3xl border border-warm-brown/10 bg-white/70 backdrop-blur-sm shadow-sm ${className}`}
    >
      {illustration && (
        <div className="absolute inset-0 pointer-events-none opacity-90">{illustration}</div>
      )}
      <div className={`relative z-10 p-6 md:p-8 ${centered ? 'text-center' : ''}`}>
        <h3 className="font-display text-xl md:text-2xl font-semibold text-warm-brown">{title}</h3>
        {subtitle && (
          <p className={`mt-2 text-sm text-charcoal/60 leading-relaxed ${centered ? 'mx-auto max-w-md' : 'max-w-lg'}`}>
            {subtitle}
          </p>
        )}
        <div className={`mt-4 ${centered ? 'flex flex-col items-center' : ''}`}>{children}</div>
      </div>
    </motion.section>
  );
}
