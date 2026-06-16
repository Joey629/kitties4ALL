import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

type AnimationVariant = 'float' | 'sway' | 'breathe' | 'drift' | 'pulse';

const variants: Record<AnimationVariant, HTMLMotionProps<'div'>['animate']> = {
  float: { y: [0, -6, 0] },
  sway: { rotate: [-2, 2, -2] },
  breathe: { scale: [1, 1.03, 1] },
  drift: { x: [0, 4, 0], y: [0, -3, 0] },
  pulse: { opacity: [0.7, 1, 0.7] },
};

const transitions: Record<AnimationVariant, HTMLMotionProps<'div'>['transition']> = {
  float: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  sway: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
  breathe: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
  drift: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
  pulse: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
};

interface AnimatedIllustrationProps {
  children: ReactNode;
  variant?: AnimationVariant;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function AnimatedIllustration({
  children,
  variant = 'float',
  delay = 0,
  className = '',
  style,
}: AnimatedIllustrationProps) {
  return (
    <motion.div
      className={className}
      style={style}
      animate={variants[variant]}
      transition={{ ...transitions[variant], delay } as object}
    >
      {children}
    </motion.div>
  );
}
