import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { RoleSwitcher } from '../components/RoleSwitcher';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent } from '@/admin/components/ui/card';
import { Button } from '@/admin/components/ui/button';
import {
  ACHIEVEMENT_DEFINITIONS,
  getVolunteerTier,
} from '@/shared/volunteerProgress';

export function ProfileScreen() {
  const { user, workEnvironment, progress } = useCompanion();
  const tier = getVolunteerTier(progress.points);
  const unlockedIds = new Set(progress.unlockedAchievements.map((item) => item.id));
  const featuredAchievements = ACHIEVEMENT_DEFINITIONS.filter((item) => unlockedIds.has(item.id)).slice(-3);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-4 pb-6">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/companion">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <PageHeader title="Profile" description="Your account and work settings" />

      <Card className="mb-4">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-lg font-semibold text-primary">
            {user.avatar}
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{workEnvironment.label} · Paw Companion</p>
          </div>
        </CardContent>
      </Card>

      <Link to="/companion/impact" className="mb-6 block">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  {tier.emoji} {tier.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {progress.points} Paw Points · {progress.unlockedAchievements.length} achievements
                </p>
              </div>
              <span className="text-xs font-medium text-primary">View impact →</span>
            </div>
            {featuredAchievements.length > 0 && (
              <div className="mt-3 flex gap-2">
                {featuredAchievements.map((achievement) => (
                  <span
                    key={achievement.id}
                    className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"
                    title={achievement.title}
                  >
                    {achievement.emoji} {achievement.title}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>

      <div className="mb-3">
        <h2 className="text-sm font-semibold text-foreground">Work environment</h2>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Switch when you move between on-site volunteer shifts and foster home care. This is not needed for everyday use.
        </p>
      </div>

      <RoleSwitcher />
    </motion.div>
  );
}
