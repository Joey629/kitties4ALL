import { motion } from 'framer-motion';
import { Button } from './Button';

interface CompletionAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'coral';
}

interface CompletionLinkAction {
  hint: string;
  label: string;
  onClick: () => void;
}

interface ModalCompletionProps {
  title: string;
  message: string;
  details?: string[];
  reference?: string;
  particles?: string[];
  primaryAction?: CompletionAction;
  secondaryAction?: CompletionAction;
  linkAction?: CompletionLinkAction;
}

const DEFAULT_PARTICLES = ['🐾', '💛', '✨', '🐾'];

export function ModalCompletion({
  title,
  message,
  details,
  reference,
  particles = DEFAULT_PARTICLES,
  primaryAction,
  secondaryAction,
  linkAction,
}: ModalCompletionProps) {
  return (
    <div className="relative py-4 text-center">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((emoji, i) => (
          <motion.span
            key={`${emoji}-${i}`}
            className="absolute text-lg"
            style={{ left: `${12 + i * 22}%`, bottom: '18%' }}
            initial={{ opacity: 0, y: 8, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0], y: -72, scale: [0.4, 1, 0.7] }}
            transition={{
              duration: 1.4,
              delay: 0.15 + i * 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 20 }}
        className="relative z-10 mx-auto mb-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-sage/20 ring-4 ring-sage/10"
      >
        <motion.svg
          viewBox="0 0 24 24"
          className="h-9 w-9 text-sage-dark"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.path d="M5 13l4 4L19 7" />
        </motion.svg>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.25 }}
        className="relative z-10 font-display text-2xl font-bold text-warm-brown"
      >
        {title}
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.25 }}
        className="relative z-10 mx-auto mt-2 max-w-sm text-sm leading-relaxed text-charcoal/70"
      >
        {message}
      </motion.p>

      {reference && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.25 }}
          className="relative z-10 mt-3 text-xs font-semibold uppercase tracking-wide text-charcoal/45"
        >
          {reference}
        </motion.p>
      )}

      {details && details.length > 0 && (
        <motion.ul
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.25 }}
          className="relative z-10 mx-auto mt-5 max-w-sm space-y-2.5 rounded-2xl border border-warm-brown/10 bg-white/70 p-4 text-left"
        >
          {details.map((detail) => (
            <li key={detail} className="flex gap-2 text-sm leading-relaxed text-charcoal/75">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
              <span>{detail}</span>
            </li>
          ))}
        </motion.ul>
      )}

      {(primaryAction || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.25 }}
          className="relative z-10 mt-6 space-y-3"
        >
          {primaryAction && (
            <Button
              variant={primaryAction.variant ?? 'coral'}
              className="w-full"
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant ?? 'ghost'}
              className="w-full"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
          {linkAction && (
            <p className="text-sm leading-relaxed text-charcoal/65">
              {linkAction.hint}{' '}
              <button
                type="button"
                onClick={linkAction.onClick}
                className="font-semibold text-sage-dark underline underline-offset-2 transition-colors hover:text-sage"
              >
                {linkAction.label}
              </button>
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
