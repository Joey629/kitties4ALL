import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquarePlus, Sparkles } from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { CatAvatar } from '../components/MobileShell';
import { ResupplySheet } from '../components/ResupplySheet';
import { SupplyProgressSection } from '../components/SupplyProgressSection';
import { EmergencyReportButton } from '../components/EmergencyReportButton';
import { EmergencyReportSheet } from '../components/EmergencyReportSheet';
import { getSupplyCatalog } from '@/shared/catSupplies';
import { formatDate } from '@/admin/lib/utils';
import { adminCats } from '@/admin/data/mock';
import { Button } from '@/admin/components/ui/button';
import { Badge } from '@/admin/components/ui/badge';
import { Card, CardContent } from '@/admin/components/ui/card';
import { generateCompanionCatAnalysis } from '../lib/catAnalysis';
import { cn } from '@/admin/lib/utils';
import type { CompanionCat } from '../types';

function AnalysisCard({ analysis }: { analysis: NonNullable<ReturnType<typeof generateCompanionCatAnalysis>> }) {
  return (
    <Card className="border-sky/20 bg-sky/5">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-sky/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
            <Sparkles className="h-3 w-3" />
            AI analysis
          </span>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground">{analysis.summary}</p>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Care focus</h2>
          <ul className="mt-1.5 space-y-1.5 text-sm text-foreground">
            {analysis.careFocus.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Temperament</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground">{analysis.temperamentNote}</p>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Adoption fit</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground">{analysis.adoptionFit}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileHero({
  cat,
  showAnalysis,
  onBack,
  onToggleAnalysis,
}: {
  cat: CompanionCat;
  showAnalysis: boolean;
  onBack: () => void;
  onToggleAnalysis: () => void;
}) {
  return (
    <div className="bg-gradient-to-b from-accent to-background px-5 pt-8 pb-6 border-b border-border">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            'h-9 w-9 shrink-0',
            showAnalysis && 'border-primary/40 bg-primary/8 text-primary',
          )}
          aria-label={showAnalysis ? 'Close cat analysis' : 'Cat analysis'}
          aria-pressed={showAnalysis}
          onClick={onToggleAnalysis}
        >
          <Sparkles className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-col items-center text-center">
        <CatAvatar photo={cat.photo} name={cat.name} size="lg" />
        <h1 className="text-2xl font-semibold text-foreground mt-4">{cat.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">{cat.age}</p>
      </div>
    </div>
  );
}

export function CatProfileScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cats, workRole, submitFosterResupply } = useCompanion();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [resupplyOpen, setResupplyOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const cat = cats.find((c) => c.id === id);
  const adminCat = adminCats.find((c) => c.id === id);
  const analysis = useMemo(
    () => (cat ? generateCompanionCatAnalysis(cat, adminCat) : null),
    [cat, adminCat],
  );
  const showSupplySection = workRole === 'foster_parent' && getSupplyCatalog(cat?.id ?? '').length > 0;

  if (!cat) {
    return <div className="p-8 text-center text-muted-foreground">Cat not found</div>;
  }

  const handleBack = () => {
    if (showAnalysis) {
      setShowAnalysis(false);
      return;
    }
    navigate(-1);
  };

  const handleToggleAnalysis = () => {
    if (showAnalysis) {
      setShowAnalysis(false);
      return;
    }
    if (analysis) setShowAnalysis(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-full pb-8">
      <ProfileHero
        cat={cat}
        showAnalysis={showAnalysis}
        onBack={handleBack}
        onToggleAnalysis={handleToggleAnalysis}
      />

      <div className="px-5 space-y-4 -mt-2 pt-4">
        {showAnalysis && analysis ? (
          <AnalysisCard analysis={analysis} />
        ) : (
          <>
            {showSupplySection && (
              <SupplyProgressSection
                catId={cat.id}
                catName={cat.name}
                onResupply={() => setResupplyOpen(true)}
              />
            )}

            <Card>
              <CardContent className="p-5">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Personality
                </h2>
                <div className="flex flex-wrap gap-2">
                  {cat.personality.map((t) => (
                    <Badge key={t} variant="default">
                      {t}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Medical
                </h2>
                <p className="text-sm text-foreground">
                  {cat.vaccinated ? '✓ Vaccinated' : 'Pending vaccination'}
                </p>
                <p className="text-sm text-foreground mt-1">Status: {cat.healthStatus}</p>
                {cat.medication && (
                  <Badge variant="warning" className="mt-2">
                    💊 {cat.medication}
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Story
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  &ldquo;{cat.story}&rdquo;
                </p>
              </CardContent>
            </Card>

            {adminCat && (
              <Card>
                <CardContent className="p-5">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Recent updates
                  </h2>
                  {cat.recentUpdates && cat.recentUpdates.length > 0 ? (
                    <ul className="space-y-2 text-sm text-foreground">
                      {cat.recentUpdates.map((update) => (
                        <li key={update} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{update}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No companion updates yet.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {adminCat && (
              <Card>
                <CardContent className="p-5">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Timeline
                  </h2>
                  <div className="space-y-3">
                    {adminCat.timeline.slice(0, 4).map((event) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Button asChild className="w-full h-12 rounded-xl text-base">
              <Link to={`/companion/cats/${cat.id}/update`}>
                <MessageSquarePlus className="w-5 h-5" />
                Update {cat.name}&apos;s status
              </Link>
            </Button>

            <div className="flex justify-center pt-2">
              <EmergencyReportButton onActivate={() => setEmergencyOpen(true)} />
            </div>
          </>
        )}
      </div>

      <ResupplySheet
        open={resupplyOpen}
        catId={cat.id}
        catName={cat.name}
        onClose={() => setResupplyOpen(false)}
        onSubmit={(itemIds) => submitFosterResupply({ catId: cat.id, catName: cat.name, itemIds })}
      />
      <EmergencyReportSheet
        open={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
        presetCatId={cat.id}
      />
    </motion.div>
  );
}
