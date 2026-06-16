import { motion } from 'framer-motion';
import { ChevronRight, Check, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CareTask } from '../types';
import { CatAvatar } from './MobileShell';
import { getCatImageUrl } from '@/shared/catImages';
import { getTaskHeadline, getTaskSubline, isAdoptionTask } from '../lib/taskDisplay';

export function TaskCard({ task }: { task: CareTask }) {
  const isDone = task.status === 'completed';
  const catImage = getCatImageUrl(task.catId);

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        to={`/companion/tasks/${task.id}`}
        className={`flex items-center gap-3 p-4 rounded-xl border transition-all active:scale-[0.98] ${
          isDone
            ? 'bg-muted border-border opacity-60'
            : 'bg-card border-border shadow-sm hover:shadow-md'
        }`}
      >
        {catImage ? (
          <CatAvatar photo={catImage} name={task.catName} size="sm" />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-accent text-2xl">
            {task.emoji}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {task.assignedBy === 'manager' && !isDone && (
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-primary">From shelter</p>
          )}
          <p className={`text-sm font-semibold ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {getTaskHeadline(task)}
          </p>
          <p className="text-sm text-muted-foreground">{getTaskSubline(task)}</p>
          {task.location && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{task.location}</span>
            </p>
          )}
          {!isAdoptionTask(task) && (
            <p className="text-xs text-muted-foreground mt-0.5">{task.dueTime}</p>
          )}
        </div>
        {isDone ? (
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
            <Check className="w-4 h-4 text-primary" />
          </div>
        ) : (
          <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
        )}
      </Link>
    </motion.div>
  );
}
