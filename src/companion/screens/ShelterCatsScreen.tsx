import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search } from 'lucide-react';
import { getShelterCats } from '../data/mock';
import { CatAvatar } from '../components/MobileShell';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent } from '@/admin/components/ui/card';
import { Badge } from '@/admin/components/ui/badge';
import { adminCats } from '@/admin/data/mock';

export function ShelterCatsScreen() {
  const [query, setQuery] = useState('');
  const shelterCats = useMemo(() => getShelterCats(), []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return shelterCats;
    return shelterCats.filter((cat) => cat.name.toLowerCase().includes(normalized));
  }, [query, shelterCats]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-4 pb-6">
      <Link
        to="/companion"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Today
      </Link>

      <PageHeader
        title="Shelter cats"
        description="Browse cats on-site — open a profile to log updates or report concerns"
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name…"
          className="h-11 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <div className="flex flex-col gap-4">
        {filtered.map((cat) => {
          const adminCat = adminCats.find((entry) => entry.id === cat.id);
          return (
            <Link key={cat.id} to={`/companion/cats/${cat.id}`} className="block">
              <Card className="transition-colors hover:border-primary/25">
                <CardContent className="flex items-center gap-3 p-4">
                  <CatAvatar photo={cat.photo} name={cat.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{cat.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {cat.age} · {cat.healthStatus}
                    </p>
                    {adminCat?.location && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{adminCat.location}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    Update
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">No cats match your search.</p>
      )}
    </motion.div>
  );
}
