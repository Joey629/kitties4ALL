import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import type { PointReward } from '../types';

interface RewardToastProps {
  reward: PointReward | null;
  onDismiss: () => void;
}

export function RewardToast({ reward, onDismiss }: RewardToastProps) {
  useEffect(() => {
    if (!reward) return;
    const timer = window.setTimeout(onDismiss, 4200);
    return () => window.clearTimeout(timer);
  }, [reward, onDismiss]);

  return (
    <AnimatePresence>
      {reward && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          className="pointer-events-auto fixed bottom-24 left-1/2 z-[120] w-[min(320px,calc(100%-2.5rem))] -translate-x-1/2"
        >
          <div className="rounded-2xl border border-violet-200/80 bg-white p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">+{reward.points} Paw Points</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{reward.label}</p>
                {reward.newAchievements.length > 0 && (
                  <p className="mt-2 text-xs font-medium text-amber-600">
                    Achievement unlocked: {reward.newAchievements.map((item) => `${item.emoji} ${item.title}`).join(', ')}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onDismiss}
                className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
