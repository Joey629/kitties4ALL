import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';
import { PageBackLink } from '@/admin/components/shared/PageBackLink';
import { PageHeader } from '@/admin/components/shared/PageHeader';
import { CatPortrait } from '@/admin/components/shared/CatPortrait';
import { SendThankYouButton } from '@/admin/components/donors/SendThankYouButton';
import { Badge } from '@/admin/components/ui/badge';
import { Button } from '@/admin/components/ui/button';
import { Input } from '@/admin/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/admin/components/ui/tabs';
import { getCatById } from '@/admin/data/mock';
import { useDonors } from '@/hooks/useDonors';
import { useAdoptionApplications } from '@/hooks/useAdoptionApplications';
import { isDonationAcknowledged, updateDonorContact } from '@/shared/donors';
import { formatCurrency, formatDate } from '@/admin/lib/utils';
import type { Communication } from '@/admin/types';
import type { ReactNode } from 'react';

const donationTypeLabels: Record<string, string> = {
  'one-time': 'One-time',
  monthly: 'Monthly',
  annual: 'Annual',
};

const communicationTypeLabels: Record<Communication['type'], string> = {
  email: 'Email',
  call: 'Call',
  'thank-you': 'Thank-you',
};

function formatDonationType(type: string) {
  return donationTypeLabels[type] ?? type;
}

function formatListDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function formatDonorSubtitle(donor: { totalDonated: number; memberSince: string; email: string; phone: string }) {
  const summary = `${formatCurrency(donor.totalDonated)} total · Member since ${formatDate(donor.memberSince)}`;
  const contact = donor.phone ? `${donor.email} · ${donor.phone}` : donor.email;
  return `${summary} · ${contact}`;
}

export function DonorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { donors, refresh } = useDonors();
  const { applications } = useAdoptionApplications();
  const donor = donors.find((entry) => entry.id === id);

  const [editingContact, setEditingContact] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [phoneDraft, setPhoneDraft] = useState('');

  const supportedCats = useMemo(
    () =>
      (donor?.supportedCatIds ?? [])
        .map((catId) => getCatById(catId))
        .filter((cat): cat is NonNullable<typeof cat> => Boolean(cat)),
    [donor],
  );

  const matchingAdoption = useMemo(() => {
    if (!donor) return null;
    const normalizedEmail = donor.email.toLowerCase();
    return (
      applications.find(
        (application) => application.email.toLowerCase() === normalizedEmail,
      ) ?? null
    );
  }, [applications, donor]);

  if (!donor) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Donor not found.</p>
        <PageBackLink to="/admin/donors" className="mb-0 mt-4">
          Back to donors
        </PageBackLink>
      </div>
    );
  }

  function startEditingContact() {
    setNameDraft(donor!.name);
    setEmailDraft(donor!.email);
    setPhoneDraft(donor!.phone);
    setEditingContact(true);
  }

  function saveContact() {
    updateDonorContact(donor!.id, {
      name: nameDraft,
      email: emailDraft,
      phone: phoneDraft,
    });
    setEditingContact(false);
    refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="-mx-4 -mb-4 flex min-h-0 flex-1 flex-col bg-muted/35 px-6 pb-5 pt-0 sm:-mx-6 lg:-mx-8"
    >
      <PageBackLink to="/admin/donors">Back to donors</PageBackLink>

      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="admin-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-6">
            <div className="mb-4 border-b border-border/60 pb-4">
              <PageHeader
                variant="section"
                className="mb-0 gap-3 border-0 pb-0 sm:items-center"
                title={donor.name}
                description={formatDonorSubtitle(donor)}
                actions={
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={startEditingContact}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit contact
                    </Button>
                    <SendThankYouButton donor={donor} onSent={refresh} />
                  </div>
                }
              />
            </div>

            {editingContact && (
              <div className="mb-4 rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-sm font-semibold text-foreground">Edit contact</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Input
                    value={nameDraft}
                    onChange={(event) => setNameDraft(event.target.value)}
                    placeholder="Full name"
                  />
                  <Input
                    type="email"
                    value={emailDraft}
                    onChange={(event) => setEmailDraft(event.target.value)}
                    placeholder="Email"
                  />
                  <Input
                    value={phoneDraft}
                    onChange={(event) => setPhoneDraft(event.target.value)}
                    placeholder="Phone"
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={saveContact}>
                    Save contact
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingContact(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {matchingAdoption && (
              <div className="mb-4 rounded-lg border border-sky/20 bg-sky/5 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">
                  Also in adoption pipeline for {matchingAdoption.catName}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Stage: {matchingAdoption.stage} · submitted {formatDate(matchingAdoption.submittedDate)}
                </p>
                <Link
                  to={`/admin/adoption/${matchingAdoption.id}`}
                  className="mt-2 inline-flex text-sm font-medium text-primary hover:underline"
                >
                  View adoption application
                </Link>
              </div>
            )}

            <div className="mb-5 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total given
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {formatCurrency(donor.totalDonated)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Donations
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">{donor.donations.length}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cats supported
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {supportedCats.length > 0 ? supportedCats.length : 'General fund'}
                </p>
              </div>
            </div>

            <Tabs defaultValue="donations">
              <TabsList className="h-9 w-full">
                <TabsTrigger value="donations" className="flex-1 text-xs">
                  Donations
                </TabsTrigger>
                <TabsTrigger value="cats" className="flex-1 text-xs">
                  Supported cats
                </TabsTrigger>
                <TabsTrigger value="communications" className="flex-1 text-xs">
                  Communications
                </TabsTrigger>
              </TabsList>

              <TabsContent value="donations" className="mt-4">
                {donor.donations.length === 0 ? (
                  <EmptyState>No donations recorded yet.</EmptyState>
                ) : (
                  <div className="divide-y divide-border/60">
                    {donor.donations.map((donation) => (
                      <article key={donation.id} className="flex items-start justify-between gap-4 py-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(donation.amount)}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatListDate(donation.date)}
                            {donation.catName ? ` · for ${donation.catName}` : ' · General shelter fund'}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <Badge variant="outline">{formatDonationType(donation.type)}</Badge>
                          {!isDonationAcknowledged(donation) && (
                            <Badge variant="warning" className="text-[10px]">
                              Thank-you pending
                            </Badge>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cats" className="mt-4">
                {supportedCats.length === 0 ? (
                  <EmptyState>Donations go to the general shelter fund.</EmptyState>
                ) : (
                  <div className="divide-y divide-border/60">
                    {supportedCats.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/admin/cats/${cat.id}`}
                        className="flex items-center gap-4 py-4 transition-colors hover:bg-muted/30 -mx-2 px-2 rounded-lg"
                      >
                        <CatPortrait catId={cat.id} photo={cat.photo} size={56} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                          <p className="mt-0.5 text-sm text-muted-foreground">{cat.tagline}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="communications" className="mt-4 space-y-4">
                <p className="text-xs text-muted-foreground">
                  Outreach history for this donor. Thank-you notes are logged locally — no email is sent in this demo.
                </p>
                {donor.communications.length === 0 ? (
                  <EmptyState>No communications logged yet.</EmptyState>
                ) : (
                  <div className="divide-y divide-border/60">
                    {donor.communications.map((entry) => (
                      <article key={entry.id} className="py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{communicationTypeLabels[entry.type]}</Badge>
                          <span className="text-xs text-muted-foreground">{formatListDate(entry.date)}</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-foreground">{entry.subject}</p>
                        {entry.notes.trim() && (
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{entry.notes}</p>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
