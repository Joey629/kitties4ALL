import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/admin/components/ui/button';
import type { CareTask } from '../types';
import type { PointReward } from '../types';

interface TaskCompletionFeedbackProps {
  open: boolean;
  task: CareTask | null;
  reward: PointReward | null;
  onContinue: () => void;
}

export function TaskCompletionFeedback({
  open,
  task,
  reward,
  onContinue,
}: TaskCompletionFeedbackProps) {
  return (
    <AnimatePresence>
      {open && task && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] flex items-end justify-center bg-black/40 p-5 pb-8"
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <div className="mb-4 flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl">
                <Check className="h-7 w-7 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Task complete</h2>
              <p className="mt-1 text-sm text-muted-foreground">{task.title}</p>
              {task.catName && task.catName !== 'General' && (
                <p className="mt-2 text-sm text-foreground">
                  {task.catName} is one step closer to a great day.
                </p>
              )}
            </div>

            {reward && (
              <div className="mb-5 rounded-xl bg-violet-50 px-4 py-3 text-center">
                <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-violet-700">
                  <Sparkles className="h-4 w-4" />
                  +{reward.points} Paw Points
                </p>
                <p className="mt-0.5 text-xs text-violet-600">{reward.label}</p>
                {reward.newAchievements.length > 0 && (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    {reward.newAchievements.map((item) => `${item.emoji} ${item.title}`).join(' · ')}
                  </p>
                )}
              </div>
            )}

            <Button className="h-12 w-full rounded-xl text-base" onClick={onContinue}>
              Back to Today
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
