import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Cat } from 'lucide-react';
import { getGreeting, getTasksForWorkRole } from '../data/mock';
import { useCompanion } from '../context/CompanionContext';
import { TaskCard } from '../components/TaskCard';
import { EmergencyReportButton } from '../components/EmergencyReportButton';
import { EmergencyReportSheet } from '../components/EmergencyReportSheet';
import { ProgressRing } from '../components/MobileShell';
import { PageHeader } from '../components/PageHeader';
import {
  FosterWorkflowBlock,
} from '../components/FosterWorkflowCards';
import { Card, CardContent } from '@/admin/components/ui/card';
import { Button } from '@/admin/components/ui/button';
import { Badge } from '@/admin/components/ui/badge';
import { isAdoptionTask, isFosterCheckInTask } from '../lib/taskDisplay';
import { fosterHasActiveCat, resolveCompanionMyCats } from '../lib/myCats';

export function TodayScreen() {
  const {
    user,
    workRole,
    tasks,
    cats,
    registeredCatIds,
    removedCatIds,
    fosterApplication,
    fosterMatches,
    fosterAdoptionInterests,
    acknowledgeFosterAdoptionInterest,
    withdrawFosterApplication,
  } = useCompanion();
  const [showCompleted, setShowCompleted] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  const userTasks = getTasksForWorkRole(workRole, tasks, user.id);
  const myCats = resolveCompanionMyCats({
    workRole,
    userId: user.id,
    cats,
    registeredCatIds,
    removedCatIds,
  });
  const hasFosterCat = fosterHasActiveCat({
    workRole,
    userId: user.id,
    myCats,
    tasks: userTasks,
  });
  const completed = userTasks.filter((t) => t.status === 'completed');
  const pending = userTasks.filter((t) => t.status === 'pending');
  const adoptionTasks = useMemo(
    () => pending.filter(isAdoptionTask),
    [pending],
  );
  const fosterCheckInTasks = useMemo(
    () => pending.filter(isFosterCheckInTask),
    [pending],
  );
  const otherPending = useMemo(
    () => pending.filter((task) => !isAdoptionTask(task) && !isFosterCheckInTask(task)),
    [pending],
  );
  const allDone = userTasks.length > 0 && pending.length === 0;
  const showShelterCatsCard = workRole === 'volunteer';
  const showDailyCareSection = showShelterCatsCard || otherPending.length > 0;
  const showGroupedTaskSections =
    (workRole === 'foster_parent' && fosterCheckInTasks.length > 0) ||
    adoptionTasks.length > 0 ||
    showDailyCareSection;

  const shelterCatsCard = (
    <Link to="/companion/shelter-cats" className="block">
      <Card className="transition-colors hover:border-primary/20">
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky/10 text-sky">
              <Cat className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Shelter cats</p>
              <p className="text-xs text-muted-foreground">Browse on-site cats and send care updates</p>
            </div>
          </div>
          <Badge variant="outline">Browse</Badge>
        </CardContent>
      </Card>
    </Link>
  );

  const dailyCareSection = showDailyCareSection ? (
    <div>
      {showGroupedTaskSections && (
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          Daily care
        </h3>
      )}
      <div className="space-y-3">
        {showShelterCatsCard && shelterCatsCard}
        {otherPending.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  ) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-5 pt-4 pb-6"
    >
      <PageHeader
        title={`${getGreeting()}, ${user.name}`}
        description={
          workRole === 'volunteer'
            ? "Here's your shelter care for today"
            : "Here's your foster home care for today"
        }
        actions={
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" asChild>
            <Link to="/companion/profile" aria-label="Profile and settings">
              <User className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4">
          <ProgressRing completed={completed.length} total={userTasks.length} />
        </CardContent>
      </Card>

      {workRole === 'foster_parent' && !hasFosterCat && (
        <div className="mb-6">
          <FosterWorkflowBlock
            fosterApplication={fosterApplication}
            fosterMatches={fosterMatches}
            fosterAdoptionInterests={fosterAdoptionInterests}
            onWithdraw={withdrawFosterApplication}
            onAcknowledge={acknowledgeFosterAdoptionInterest}
          />
        </div>
      )}

      <section aria-label="Today's care tasks">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Today&apos;s care tasks
          </h2>
          <EmergencyReportButton onActivate={() => setEmergencyOpen(true)} />
        </div>

        {userTasks.length === 0 ? (
          showDailyCareSection ? (
            <div className="space-y-6">{dailyCareSection}</div>
          ) : (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No tasks scheduled for this role today.
          </div>
          )
        ) : allDone ? (
          <>
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-xl border border-border bg-card py-10 text-center"
            >
              <p className="text-4xl mb-3">🎉</p>
              <p className="font-semibold text-foreground">All done for today!</p>
              <p className="text-sm text-muted-foreground mt-1">The cats appreciate you — check Impact for your points.</p>
              {completed.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCompleted((v) => !v)}
                  className="mt-4 text-xs font-medium text-primary hover:underline"
                >
                  {showCompleted ? 'Hide completed tasks' : "View today's completed tasks"}
                </button>
              )}
            </motion.div>
            {dailyCareSection && <div className="mt-6">{dailyCareSection}</div>}
          </>
        ) : (
          <div className="space-y-6">
            {workRole === 'foster_parent' && fosterCheckInTasks.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  Foster check-in
                </h3>
                <div className="space-y-3">
                  {fosterCheckInTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {adoptionTasks.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  Adoption
                </h3>
                <div className="space-y-3">
                  {adoptionTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {dailyCareSection}
          </div>
        )}

        {allDone && showCompleted && (
          <div className="mt-4 space-y-3">
            {completed.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>

      <EmergencyReportSheet open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
    </motion.div>
  );
}
