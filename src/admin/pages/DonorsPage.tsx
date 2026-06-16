import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { PageHeader } from '@/admin/components/shared/PageHeader';
import { PageToolbar } from '@/admin/components/shared/PageToolbar';
import { DataTableShell } from '@/admin/components/shared/DataTableShell';
import { Button } from '@/admin/components/ui/button';
import { Input } from '@/admin/components/ui/input';
import { Badge } from '@/admin/components/ui/badge';
import { Avatar, AvatarFallback } from '@/admin/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/admin/components/ui/table';
import { useDonors } from '@/hooks/useDonors';
import { countUnacknowledgedDonations, isDonationAcknowledged } from '@/shared/donors';
import { formatCurrency, formatDate } from '@/admin/lib/utils';

const tierLabels = {
  friend: { label: 'Friend', variant: 'secondary' as const },
  supporter: { label: 'Supporter', variant: 'default' as const },
  champion: { label: 'Champion', variant: 'success' as const },
  guardian: { label: 'Guardian', variant: 'warning' as const },
};

export function DonorsPage() {
  const navigate = useNavigate();
  const { donors } = useDonors();
  const [search, setSearch] = useState('');

  const filteredDonors = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return donors;
    return donors.filter(
      (donor) =>
        donor.name.toLowerCase().includes(query) ||
        donor.email.toLowerCase().includes(query) ||
        donor.phone.toLowerCase().includes(query),
    );
  }, [donors, search]);

  const pendingThankYous = countUnacknowledgedDonations(donors);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex h-full min-h-0 flex-col"
    >
      <PageHeader
        title="Donors"
        description="Solicit gifts, acknowledge support, and steward long-term donor relationships"
        actions={
          <Button size="sm" onClick={() => navigate('/admin/donors/new')}>
            <Plus className="h-4 w-4" />
            Add donor
          </Button>
        }
      />

      {pendingThankYous > 0 && (
        <div className="mb-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm">
          <p className="font-semibold text-foreground">
            {pendingThankYous} gift{pendingThankYous === 1 ? '' : 's'} need a thank-you
          </p>
          <p className="mt-0.5 text-muted-foreground">
            Open a donor profile to send acknowledgment and log outreach.
          </p>
        </div>
      )}

      <PageToolbar>
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search donors..."
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </PageToolbar>

      <DataTableShell>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Donor</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Total Given</TableHead>
              <TableHead className="hidden md:table-cell">Member Since</TableHead>
              <TableHead className="hidden lg:table-cell">Supported Cats</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDonors.map((donor) => {
              const tier = tierLabels[donor.tier];
              const needsThankYou = donor.donations.some((gift) => !isDonationAcknowledged(gift));

              return (
                <TableRow
                  key={donor.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/donors/${donor.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/8">{donor.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{donor.name}</p>
                          {needsThankYou && (
                            <Badge variant="warning" className="text-[10px]">
                              Thank-you pending
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{donor.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tier.variant}>{tier.label}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(donor.totalDonated)}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{formatDate(donor.memberSince)}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {donor.supportedCatIds.length > 0
                        ? `${donor.supportedCatIds.length} cat${donor.supportedCatIds.length > 1 ? 's' : ''}`
                        : 'General fund'}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DataTableShell>
    </motion.div>
  );
}
