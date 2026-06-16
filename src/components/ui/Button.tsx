import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'coral';

interface ButtonProps {
  variant?: Variant;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-sage text-white hover:bg-sage-dark shadow-[0_8px_24px_-12px_rgba(92,122,101,0.55)] hover:shadow-[0_12px_28px_-10px_rgba(92,122,101,0.5)]',
  secondary:
    'bg-cream-dark text-warm-brown hover:bg-soft-orange/30 border border-warm-brown/20',
  ghost:
    'bg-transparent text-warm-brown hover:bg-warm-brown/10',
  coral:
    'bg-coral text-white hover:bg-coral/90 shadow-md hover:shadow-lg',
};

const sizes: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  onClick,
  type = 'button',
  disabled = false,
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-full font-semibold font-sans
        transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {children}
    </motion.button>
  );
}
