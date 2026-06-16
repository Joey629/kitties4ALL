import { donors as seedDonors } from '@/admin/data/mock';
import type { Communication, Donation, Donor } from '@/admin/types';

const STORAGE_KEY = 'kitticare-donors';

type Listener = (donors: Donor[]) => void;
const listeners = new Set<Listener>();

function notify(donors: Donor[]) {
  listeners.forEach((fn) => fn(donors));
}

export function loadDonors(): Donor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveDonors(seedDonors);
      return seedDonors;
    }
    return JSON.parse(raw) as Donor[];
  } catch {
    return seedDonors;
  }
}

export function saveDonors(donors: Donor[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(donors));
  notify(donors);
}

export function subscribeDonors(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDonorById(id: string) {
  return loadDonors().find((donor) => donor.id === id);
}

export function getDonorByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return loadDonors().find((donor) => donor.email.toLowerCase() === normalized);
}

export function isDonationAcknowledged(donation: Donation) {
  return donation.acknowledged !== false;
}

export function getUnacknowledgedDonations(donorList: Donor[] = loadDonors()) {
  return donorList.flatMap((donor) =>
    donor.donations
      .filter((gift) => !isDonationAcknowledged(gift))
      .map((gift) => ({ donor, gift })),
  );
}

export function countUnacknowledgedDonations(donorList: Donor[] = loadDonors()) {
  return getUnacknowledgedDonations(donorList).length;
}

export function getDonorsForCat(catId: string, donorList: Donor[] = loadDonors()) {
  return donorList
    .filter((donor) => donor.supportedCatIds.includes(catId))
    .map((donor) => {
      const catTotal = donor.donations
        .filter((gift) => gift.catId === catId)
        .reduce((sum, gift) => sum + gift.amount, 0);
      return { donor, catTotal };
    })
    .sort((a, b) => b.catTotal - a.catTotal);
}

function parseAmount(amount: string | number) {
  if (typeof amount === 'number') return amount;
  return Number(amount.replace(/[^0-9.]/g, '')) || 0;
}

function donorInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function tierForTotal(total: number): Donor['tier'] {
  if (total >= 5000) return 'guardian';
  if (total >= 1000) return 'champion';
  if (total >= 100) return 'supporter';
  return 'friend';
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function appendDonationToDonor(
  donor: Donor,
  donation: Donation,
  catId?: string,
): Donor {
  const totalDonated = donor.totalDonated + donation.amount;
  const supportedCatIds =
    catId && !donor.supportedCatIds.includes(catId)
      ? [...donor.supportedCatIds, catId]
      : donor.supportedCatIds;

  return {
    ...donor,
    totalDonated,
    supportedCatIds,
    tier: tierForTotal(totalDonated),
    donations: [donation, ...donor.donations],
  };
}

export function addDonor(input: {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}): Donor {
  const email = input.email.trim();
  const existing = getDonorByEmail(email);
  if (existing) return existing;

  const created: Donor = {
    id: `don-${Date.now()}`,
    name: input.name.trim(),
    email,
    phone: input.phone?.trim() ?? '',
    totalDonated: 0,
    memberSince: todayIsoDate(),
    supportedCatIds: [],
    donations: [],
    communications: input.notes?.trim()
      ? [
          {
            id: `comm-${Date.now()}`,
            date: todayIsoDate(),
            type: 'email',
            subject: 'Donor profile created',
            notes: input.notes.trim(),
          },
        ]
      : [],
    avatar: donorInitials(input.name),
    tier: 'friend',
  };

  saveDonors([created, ...loadDonors()]);
  return created;
}

export function recordManualDonation(input: {
  donorId: string;
  amount: number;
  type?: Donation['type'];
  catId?: string;
  catName?: string;
  date?: string;
  acknowledged?: boolean;
}): Donor | null {
  const donors = loadDonors();
  const index = donors.findIndex((donor) => donor.id === input.donorId);
  if (index < 0) return null;

  const donation: Donation = {
    id: `d-${Date.now()}`,
    date: input.date ?? todayIsoDate(),
    amount: input.amount,
    type: input.type ?? 'one-time',
    acknowledged: input.acknowledged ?? true,
    ...(input.catId ? { catId: input.catId, catName: input.catName } : {}),
  };

  const updated = appendDonationToDonor(donors[index], donation, input.catId);
  const next = [...donors];
  next[index] = updated;
  saveDonors(next);
  return updated;
}

export function recordDonation(input: {
  name: string;
  email: string;
  amount: string;
  catId?: string;
  catName?: string;
  type?: Donation['type'];
}): Donor {
  const amount = parseAmount(input.amount);
  const today = todayIsoDate();
  const donation: Donation = {
    id: `d-${Date.now()}`,
    date: today,
    amount,
    type: input.type ?? 'one-time',
    acknowledged: false,
    ...(input.catId ? { catId: input.catId, catName: input.catName } : {}),
  };

  const donors = loadDonors();
  const existingIndex = donors.findIndex(
    (donor) => donor.email.toLowerCase() === input.email.trim().toLowerCase(),
  );

  if (existingIndex >= 0) {
    const updated = appendDonationToDonor(donors[existingIndex], donation, input.catId);
    const next = [...donors];
    next[existingIndex] = updated;
    saveDonors(next);
    return updated;
  }

  const created: Donor = {
    id: `don-${Date.now()}`,
    name: input.name.trim(),
    email: input.email.trim(),
    phone: '',
    totalDonated: amount,
    memberSince: today,
    supportedCatIds: input.catId ? [input.catId] : [],
    donations: [donation],
    communications: [],
    avatar: donorInitials(input.name),
    tier: tierForTotal(amount),
  };
  saveDonors([created, ...donors]);
  return created;
}

export function recordCommunication(input: {
  donorId: string;
  type: Communication['type'];
  subject: string;
  notes?: string;
  date?: string;
}): Donor | null {
  const donors = loadDonors();
  const index = donors.findIndex((donor) => donor.id === input.donorId);
  if (index < 0) return null;

  const entry: Communication = {
    id: `comm-${Date.now()}`,
    date: input.date ?? todayIsoDate(),
    type: input.type,
    subject: input.subject.trim(),
    notes: input.notes?.trim() ?? '',
  };

  const updated: Donor = {
    ...donors[index],
    communications: [entry, ...donors[index].communications],
  };
  const next = [...donors];
  next[index] = updated;
  saveDonors(next);
  return updated;
}

export function sendThankYouForDonation(
  donorId: string,
  donationId?: string,
  options?: { subject?: string; notes?: string },
): Donor | null {
  const donors = loadDonors();
  const index = donors.findIndex((donor) => donor.id === donorId);
  if (index < 0) return null;

  const donor = donors[index];
  const targetGift =
    (donationId ? donor.donations.find((gift) => gift.id === donationId) : undefined) ??
    donor.donations.find((gift) => !isDonationAcknowledged(gift));

  const subject =
    options?.subject?.trim() ||
    (targetGift
      ? `Thank you for your ${targetGift.type === 'monthly' ? 'monthly ' : ''}gift`
      : 'Thank you for supporting Kitties4All');

  const notes =
    options?.notes?.trim() ||
    (targetGift?.catName
      ? `Thank-you sent for ${targetGift.catName} support.`
      : 'Thank-you sent for general shelter support.');

  const communication: Communication = {
    id: `comm-${Date.now()}`,
    date: todayIsoDate(),
    type: 'thank-you',
    subject,
    notes,
  };

  const updatedDonations = donor.donations.map((gift) => {
    if (targetGift && gift.id === targetGift.id) {
      return { ...gift, acknowledged: true };
    }
    if (!donationId && !targetGift && !isDonationAcknowledged(gift)) {
      return { ...gift, acknowledged: true };
    }
    return gift;
  });

  const updated: Donor = {
    ...donor,
    donations: updatedDonations,
    communications: [communication, ...donor.communications],
  };

  const next = [...donors];
  next[index] = updated;
  saveDonors(next);
  return updated;
}

export function updateDonorContact(
  donorId: string,
  patch: { name?: string; email?: string; phone?: string },
): Donor | null {
  const donors = loadDonors();
  const index = donors.findIndex((donor) => donor.id === donorId);
  if (index < 0) return null;

  const updated: Donor = {
    ...donors[index],
    ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
    ...(patch.email !== undefined ? { email: patch.email.trim() } : {}),
    ...(patch.phone !== undefined ? { phone: patch.phone.trim() } : {}),
  };

  const next = [...donors];
  next[index] = updated;
  saveDonors(next);
  return updated;
}

export function donationsTotalForMonth(
  donorList: Donor[] = loadDonors(),
  referenceDate = new Date(),
) {
  const month = referenceDate.getMonth();
  const year = referenceDate.getFullYear();

  return donorList.reduce((sum, donor) => {
    const donorMonthTotal = donor.donations
      .filter((gift) => {
        const date = new Date(gift.date);
        return date.getMonth() === month && date.getFullYear() === year;
      })
      .reduce((giftSum, gift) => giftSum + gift.amount, 0);
    return sum + donorMonthTotal;
  }, 0);
}
