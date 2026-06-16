import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { CatAvatar } from '../components/MobileShell';
import { Button } from '@/admin/components/ui/button';
import { Card, CardContent } from '@/admin/components/ui/card';
import { getCatById } from '@/admin/data/mock';
import { healthConfig } from '@/admin/lib/catDisplay';
import type { CompanionCat } from '../types';

export function FosterMatchScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cats, fosterMatches, acceptFosterMatch, declineFosterMatch } = useCompanion();
  const match = fosterMatches.find((item) => item.id === id);
  const companionCat = match ? cats.find((item) => item.id === match.catId) : null;
  const adminCat = match ? getCatById(match.catId) : null;
  const cat: CompanionCat | null = companionCat ?? (adminCat ? {
    id: adminCat.id,
    name: adminCat.name,
    photo: adminCat.photo,
    age: adminCat.age,
    personality: adminCat.personality,
    healthStatus: healthConfig[adminCat.health].label,
    careInstructions: '',
    currentCaregiver: '',
    story: adminCat.story,
    vaccinated: true,
  } : null);

  if (!match) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Foster match not found.
        <Link to="/companion/my-cats" className="mt-4 block text-primary">
          Back to My Cats
        </Link>
      </div>
    );
  }

  const handleAccept = () => {
    acceptFosterMatch(match.id);
    navigate('/companion/my-cats');
  };

  const handleDecline = () => {
    declineFosterMatch(match.id);
    navigate('/companion/my-cats');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-4 pb-8">
      <Link
        to="/companion/my-cats"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <h1 className="text-xl font-semibold text-foreground">Foster match</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Review this cat&apos;s profile before accepting the foster assignment.
      </p>

      <Card className="mt-5 overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-b from-accent to-background px-5 py-6 text-center">
            {cat && <CatAvatar photo={cat.photo} name={cat.name} size="lg" />}
            <h2 className="mt-4 text-2xl font-semibold text-foreground">{match.catName}</h2>
            {cat && <p className="mt-1 text-sm text-muted-foreground">{cat.age}</p>}
          </div>
          <div className="space-y-4 px-5 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Why this match
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{match.summary}</p>
            </div>
            {cat && (
              <>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Health
                  </p>
                  <p className="mt-1 text-sm text-foreground">{cat.healthStatus}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Story
                  </p>
                  <p className="mt-1 text-sm italic leading-relaxed text-muted-foreground">
                    &ldquo;{cat.story}&rdquo;
                  </p>
                </div>
                <Button asChild variant="outline" className="h-11 w-full rounded-xl">
                  <Link to={`/companion/cats/${cat.id}`}>Open full cat profile</Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {match.status === 'pending' ? (
        <div className="mt-5 space-y-3">
          <Button onClick={handleAccept} className="h-12 w-full rounded-xl text-base">
            <Check className="h-4 w-4" />
            Accept foster assignment
          </Button>
          <Button
            onClick={handleDecline}
            variant="outline"
            className="h-12 w-full rounded-xl text-base"
          >
            <X className="h-4 w-4" />
            Decline this match
          </Button>
        </div>
      ) : (
        <Card className="mt-5">
          <CardContent className="p-4 text-sm text-muted-foreground">
            This match has already been {match.status}.
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
