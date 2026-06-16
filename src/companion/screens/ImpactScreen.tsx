import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Heart, CheckCircle, Star, Sparkles, Trophy } from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent } from '@/admin/components/ui/card';
import {
  ACHIEVEMENT_DEFINITIONS,
  getAchievementProgress,
  getImpactSummary,
  getNextVolunteerTier,
  getVolunteerTier,
} from '@/shared/volunteerProgress';
import { cn } from '@/admin/lib/utils';

export function ImpactScreen() {
  const { user, progress, updates } = useCompanion();
  const tier = getVolunteerTier(progress.points);
  const nextTier = getNextVolunteerTier(progress.points);
  const summary = getImpactSummary(progress, {
    catsHelped: user.impact.catsHelped,
    adoptionStories: user.impact.adoptionStories,
  });
  const unlockedIds = new Set(progress.unlockedAchievements.map((item) => item.id));
  const tierProgress = nextTier
    ? ((progress.points - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100
    : 100;

  const stats = [
    { icon: Sparkles, label: 'Paw Points earned', value: summary.pawPoints, color: 'bg-violet-50 text-violet-600' },
    { icon: CheckCircle, label: 'Care tasks completed', value: summary.tasksCompleted, color: 'bg-emerald-50 text-emerald-600' },
    { icon: Heart, label: 'Cats helped', value: summary.catsHelped, color: 'bg-rose-50 text-rose-500' },
    { icon: Star, label: 'Adoption stories', value: summary.adoptionStories, color: 'bg-amber-50 text-amber-500' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-4 pb-6">
      <PageHeader
        title="Your impact"
        description="Care that adds up — for cats and for you"
      />

      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-primary-gradient rounded-2xl p-5 mb-5 text-primary-foreground"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/70">
              {tier.emoji} {tier.label}
            </p>
            <p className="mt-1 text-3xl font-semibold">{summary.pawPoints}</p>
            <p className="text-sm text-primary-foreground/75">Paw Points</p>
          </div>
          {summary.streakDays > 0 && (
            <div className="rounded-xl bg-white/15 px-3 py-2 text-center backdrop-blur-sm">
              <p className="flex items-center justify-center gap-1 text-lg font-semibold">
                <Flame className="h-4 w-4" />
                {summary.streakDays}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-primary-foreground/70">day streak</p>
            </div>
          )}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-primary-foreground/80">{tier.message}</p>

        {nextTier && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs text-primary-foreground/70">
              <span>Next: {nextTier.emoji} {nextTier.label}</span>
              <span>{nextTier.minPoints - progress.points} pts to go</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white/90 transition-all"
                style={{ width: `${Math.min(100, Math.max(8, tierProgress))}%` }}
              />
            </div>
          </div>
        )}
      </motion.div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <p className="text-xl font-semibold text-foreground">{stat.value}</p>
                <p className="text-xs leading-snug text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-foreground">Achievements</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {summary.achievementsUnlocked}/{summary.achievementsTotal} unlocked
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2.5">
        {ACHIEVEMENT_DEFINITIONS.map((achievement, i) => {
          const unlocked = unlockedIds.has(achievement.id);
          const { current, target } = getAchievementProgress(progress, achievement);

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08 + i * 0.03 }}
            >
              <Card className={cn(!unlocked && 'opacity-90')}>
                <CardContent className="p-3.5">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg',
                        unlocked ? 'bg-amber-50' : 'bg-muted grayscale',
                      )}
                    >
                      {achievement.emoji}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-tight">{achievement.title}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                        {achievement.description}
                      </p>
                      {!unlocked && (
                        <div className="mt-2">
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary/70"
                              style={{ width: `${Math.min(100, (current / target) * 100)}%` }}
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {Math.min(current, target)}/{target}
                          </p>
                        </div>
                      )}
                      {unlocked && (
                        <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                          Unlocked
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {updates.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Recent updates you sent
          </h2>
          <div className="space-y-2">
            {updates.slice(0, 3).map((update) => (
              <Card key={update.id}>
                <CardContent className="px-4 py-3 text-sm text-muted-foreground">
                  Update logged — mood: {update.mood}, eating: {update.eating}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Keep showing up — the cats remember gentle hands.{' '}
        <Link to="/companion" className="font-medium text-primary hover:underline">
          Back to today
        </Link>
      </p>
    </motion.div>
  );
}
