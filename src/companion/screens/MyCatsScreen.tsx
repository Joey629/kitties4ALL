import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Trash2 } from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { CatAvatar } from '../components/MobileShell';
import { PageHeader } from '../components/PageHeader';
import { FosterWorkflowBlock } from '../components/FosterWorkflowCards';
import { Card, CardContent } from '@/admin/components/ui/card';
import { resolveCompanionMyCats } from '../lib/myCats';

export function MyCatsScreen() {
  const {
    user,
    workRole,
    registeredCatIds,
    removedCatIds,
    cats,
    removeCat,
    fosterApplication,
    fosterMatches,
    fosterAdoptionInterests,
    acknowledgeFosterAdoptionInterest,
    withdrawFosterApplication,
  } = useCompanion();
  const allCats = resolveCompanionMyCats({
    workRole,
    userId: user.id,
    cats,
    registeredCatIds,
    removedCatIds,
  });
  const isFoster = workRole === 'foster_parent';
  const fosterWorkflowProps = {
    fosterApplication,
    fosterMatches,
    fosterAdoptionInterests,
    onWithdraw: withdrawFosterApplication,
    onAcknowledge: acknowledgeFosterAdoptionInterest,
  };
  const showFosterWorkflowSection =
    isFoster &&
    (!fosterApplication ||
      (fosterApplication && fosterApplication.status !== 'approved') ||
      fosterMatches.length > 0 ||
      fosterAdoptionInterests.length > 0);

  const handleRemove = (catId: string, catName: string) => {
    if (!window.confirm(`Remove ${catName} from My Cats?`)) return;
    removeCat(catId);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-4 pb-6">
      <PageHeader
        title="My Cats"
        description={isFoster ? 'Your foster companions at home' : 'Cats you care for at the shelter'}
      />

      {allCats.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🐱</p>
          <p className="font-medium text-foreground">No cats assigned yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isFoster
              ? 'Submit a foster application to get started.'
              : 'Check back with the shelter team'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {allCats.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Link
                      to={`/companion/cats/${cat.id}`}
                      className="flex min-w-0 flex-1 items-start gap-4 active:scale-[0.98] transition-transform"
                    >
                      <CatAvatar photo={cat.photo} name={cat.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h2 className="font-semibold text-foreground">{cat.name}</h2>
                          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/50" />
                        </div>
                        {cat.daysTogether !== undefined && (
                          <p className="mt-0.5 text-sm font-medium text-primary">
                            {cat.daysTogether} days together
                          </p>
                        )}
                        {cat.recentUpdates && (
                          <div className="mt-3 space-y-1">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">Recent updates</p>
                            {cat.recentUpdates.map((u) => (
                              <p key={u} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                {u}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                    {!isFoster && (
                      <button
                        type="button"
                        onClick={() => handleRemove(cat.id, cat.name)}
                        className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remove ${cat.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {showFosterWorkflowSection && (
        <div className="mt-6 space-y-3">
          <FosterWorkflowBlock
            {...fosterWorkflowProps}
            showApplyPrompt={!fosterApplication}
          />
        </div>
      )}

      <Card className="mt-8 border-none bg-accent">
        <CardContent className="p-5 text-center">
          <p className="text-sm text-primary">
            {isFoster
              ? 'Your home is a safe bridge while they wait for a forever family.'
              : 'Every moment you spend with these cats shapes their journey to a forever home.'}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
