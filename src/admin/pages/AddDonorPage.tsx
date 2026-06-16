import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/admin/components/ui/button';
import { Input } from '@/admin/components/ui/input';
import { PageBackLink } from '@/admin/components/shared/PageBackLink';
import { PageHeader } from '@/admin/components/shared/PageHeader';
import { adminCats } from '@/admin/data/mock';
import { addDonor, recordManualDonation } from '@/shared/donors';

export function AddDonorPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [recordGift, setRecordGift] = useState(false);
  const [amount, setAmount] = useState('');
  const [giftType, setGiftType] = useState<'one-time' | 'monthly'>('one-time');
  const [catId, setCatId] = useState('');

  const canSubmit = name.trim().length > 0 && email.trim().length > 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    const donor = addDonor({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      notes: notes.trim() || undefined,
    });

    if (recordGift && amount.trim()) {
      const selectedCat = adminCats.find((cat) => cat.id === catId);
      recordManualDonation({
        donorId: donor.id,
        amount: Number(amount.replace(/[^0-9.]/g, '')) || 0,
        type: giftType,
        catId: selectedCat?.id,
        catName: selectedCat?.name,
        acknowledged: true,
      });
    }

    navigate(`/admin/donors/${donor.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="-mx-4 -mb-4 flex min-h-0 flex-1 flex-col bg-muted/35 px-6 pb-5 pt-0 sm:-mx-6 lg:-mx-8"
    >
      <PageBackLink to="/admin/donors">Back to donors</PageBackLink>

      <div className="admin-card rounded-xl border border-border bg-card p-5 sm:p-6">
        <PageHeader
          variant="section"
          className="mb-6 border-0 pb-0"
          title="Add donor"
          description="Create a donor profile for offline gifts, pledges, or relationship tracking."
        />

        <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="donor-name">
              Full name
            </label>
            <Input
              id="donor-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Patricia Walsh"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="donor-email">
                Email
              </label>
              <Input
                id="donor-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="patricia@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="donor-phone">
                Phone
              </label>
              <Input
                id="donor-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="(555) 201-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="donor-notes">
              Internal notes
            </label>
            <textarea
              id="donor-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="How they found us, preferences, or stewardship notes…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={recordGift}
                onChange={(event) => setRecordGift(event.target.checked)}
                className="rounded border-input"
              />
              Record an initial gift
            </label>

            {recordGift && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="gift-amount">
                    Amount
                  </label>
                  <Input
                    id="gift-amount"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="gift-type">
                    Gift type
                  </label>
                  <select
                    id="gift-type"
                    value={giftType}
                    onChange={(event) => setGiftType(event.target.value as 'one-time' | 'monthly')}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="one-time">One-time</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="gift-cat">
                    Supported cat (optional)
                  </label>
                  <select
                    id="gift-cat"
                    value={catId}
                    onChange={(event) => setCatId(event.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">General shelter fund</option>
                    {adminCats.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={!canSubmit}>
              Save donor
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/donors')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
