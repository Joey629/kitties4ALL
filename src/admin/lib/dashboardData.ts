import { adminCats, dashboardStats, getAllCats, monthlyAdoptions, donors } from '@/admin/data/mock';
import type { AdminCat, AdoptionApplication, Donor, HealthStatus } from '@/admin/types';
import { generateAdoptionAiAssessment, getCatTraitsForDisplay } from '@/shared/adoptionMatch';
import { isCatAvailableForAdoption } from '@/admin/lib/catDisplay';
import { formatCurrency } from '@/admin/lib/utils';
import { loadIncidentReports } from '@/shared/incidentReports';
import { getPendingFosterApplications } from '@/shared/fosterWorkflow';
import { getUnacknowledgedDonations } from '@/shared/donors';

const ACTIVE_APP_STAGES: AdoptionApplication['stage'][] = ['new', 'reviewing'];

export function daysSince(date: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
}

export function hoursSince(date: string) {
  return Math.max(0, (Date.now() - new Date(date).getTime()) / 3600000);
}

export function isWithinLast24Hours(date: string) {
  return hoursSince(date) <= 24;
}

export function inCareAtShelter(cats: AdminCat[] = adminCats) {
  return cats.filter((cat) => cat.placement === 'shelter' && cat.adoptionPipeline !== 'adopted');
}

export function fosterHomeCount(cats: AdminCat[] = adminCats) {
  const homes = new Set<string>();
  for (const cat of cats) {
    if (cat.placement !== 'foster' || cat.adoptionPipeline === 'adopted') continue;
    const activeRecord = cat.fosterHistory?.find((record) => record.status === 'active');
    if (activeRecord?.fosterParent) {
      homes.add(activeRecord.fosterParent);
    }
  }
  return homes.size;
}

export function managedCatsSnapshot(cats: AdminCat[] = adminCats) {
  const active = cats.filter((cat) => cat.adoptionPipeline !== 'adopted');
  const shelter = active.filter((cat) => cat.placement === 'shelter').length;
  const foster = active.filter((cat) => cat.placement === 'foster').length;
  const medicalCare = active.filter((cat) => cat.health === 'medical').length;
  const fosterHomes = fosterHomeCount(cats);
  const avgShelterStayDays = averageShelterStayDays(cats);

  return {
    shelter,
    foster,
    fosterHomes,
    total: shelter + foster,
    medicalCare,
    avgShelterStayDays,
  };
}

export function shelterCapacitySnapshot(cats: AdminCat[] = getAllCats()) {
  const inShelter = inCareAtShelter(cats);
  const capacity = dashboardStats.capacity;
  const count = inShelter.length;
  const percent = capacity > 0 ? Math.round((count / capacity) * 100) : 0;
  const medicalCare = cats.filter(
    (cat) => cat.placement === 'shelter' && cat.adoptionPipeline !== 'adopted' && cat.health === 'medical',
  ).length;
  const projection = shelterCapacityProjection(cats, count, capacity);

  return {
    count,
    capacity,
    percent,
    medicalCare,
    projection,
  };
}

const CAPACITY_LOOKBACK_MONTHS = 6;

function monthWindowOffset(monthsAgo: number) {
  const anchor = new Date();
  const start = new Date(anchor.getFullYear(), anchor.getMonth() - monthsAgo, 1);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() - monthsAgo + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function averageMonthlyShelterIntakes(cats: AdminCat[], months = CAPACITY_LOOKBACK_MONTHS) {
  const totals = Array.from({ length: months }, (_, index) => {
    const { start, end } = monthWindowOffset(index);
    return cats.filter((cat) => {
      const intakeDate = new Date(cat.intakeDate);
      return intakeDate >= start && intakeDate <= end;
    }).length;
  });

  return totals.reduce((sum, value) => sum + value, 0) / months;
}

function averageMonthlyShelterOutflows(months = CAPACITY_LOOKBACK_MONTHS) {
  const recent = monthlyAdoptions.slice(-months);
  if (recent.length === 0) return 0;
  return recent.reduce((sum, entry) => sum + entry.adoptions, 0) / recent.length;
}

function formatCapacityLimitDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function shelterCapacityProjection(
  cats: AdminCat[] = getAllCats(),
  currentCount = inCareAtShelter(cats).length,
  capacity = dashboardStats.capacity,
) {
  const avgIntake = averageMonthlyShelterIntakes(cats);
  const avgOutflow = averageMonthlyShelterOutflows();
  const netPerMonth = avgIntake - avgOutflow;
  const remainingSlots = Math.max(0, capacity - currentCount);

  if (currentCount >= capacity) {
    return {
      label: 'At capacity limit — pause new intake',
      daysToFull: 0,
      netPerMonth,
      avgIntake,
      avgOutflow,
    };
  }

  if (netPerMonth <= 0.05) {
    return {
      label: '',
      daysToFull: null,
      netPerMonth,
      avgIntake,
      avgOutflow,
    };
  }

  const daysToFull = Math.max(1, Math.ceil((remainingSlots / netPerMonth) * 30));
  const limitDate = new Date(Date.now() + daysToFull * 86400000);

  return {
    label: `At capacity in ~${daysToFull} day${daysToFull === 1 ? '' : 's'} (${formatCapacityLimitDate(limitDate)})`,
    daysToFull,
    netPerMonth,
    avgIntake,
    avgOutflow,
  };
}

export function averageShelterStayDays(cats: AdminCat[] = adminCats) {
  const inShelter = cats.filter(
    (cat) => cat.placement === 'shelter' && cat.adoptionPipeline !== 'adopted',
  );
  if (inShelter.length === 0) return 0;
  const total = inShelter.reduce((sum, cat) => sum + daysSince(cat.intakeDate), 0);
  return Math.round(total / inShelter.length);
}

export function averageDaysInShelter(cats: AdminCat[] = adminCats) {
  if (cats.length === 0) return 0;
  const total = cats.reduce((sum, cat) => sum + daysSince(cat.intakeDate), 0);
  return Math.round(total / cats.length);
}

export function adoptionsThisMonth() {
  const current = monthlyAdoptions[monthlyAdoptions.length - 1];
  return current?.adoptions ?? 0;
}

export function averageAdoptionDays(applications: AdoptionApplication[]) {
  const approved = applications.filter((app) => app.stage === 'approved');
  if (approved.length === 0) return 0;

  const total = approved.reduce((sum, app) => {
    const assessments = app.reviewAssessments ?? [];
    const lastCompleted = assessments
      .map((item) => item.completedAt)
      .sort()
      .at(-1);
    const start = new Date(app.submittedDate).getTime();
    const end = lastCompleted ? new Date(lastCompleted).getTime() : Date.now();
    return sum + Math.max(0, Math.floor((end - start) / 86400000));
  }, 0);

  return Math.round(total / approved.length);
}

export function adoptionPipelineSnapshot(
  applications: AdoptionApplication[],
  cats: AdminCat[] = adminCats,
) {
  const newCount = applications.filter((app) => app.stage === 'new').length;
  const reviewingCount = applications.filter((app) => app.stage === 'reviewing').length;
  const approvedCount = applications.filter((app) => app.stage === 'approved').length;
  const avgAdoptionDays = averageAdoptionDays(applications);
  const availableForAdoption = cats.filter((cat) => isCatAvailableForAdoption(cat)).length;

  return {
    summary: `${newCount} new · ${reviewingCount} reviewing · ${approvedCount} approved`,
    newCount,
    reviewingCount,
    approvedCount,
    avgAdoptionDays,
    availableForAdoption,
  };
}

/** @deprecated Use adoptionPipelineSnapshot */
export function adoptionMonthSnapshot(
  applications: AdoptionApplication[],
  cats: AdminCat[] = adminCats,
) {
  return adoptionPipelineSnapshot(applications, cats);
}

export function pendingApplicationCount(applications: AdoptionApplication[]) {
  return applications.filter((app) => ACTIVE_APP_STAGES.includes(app.stage)).length;
}

export function newAdoptionCount(applications: AdoptionApplication[]) {
  return applications.filter((app) => app.stage === 'new').length;
}

export interface NewAdoptionQueueItem {
  app: AdoptionApplication;
  matchScore: number;
}

export function newAdoptionQueue(
  applications: AdoptionApplication[],
  limit = 5,
): NewAdoptionQueueItem[] {
  return buildNewAdoptionQueue(applications).slice(0, limit);
}

export function getAllNewAdoptionQueueItems(
  applications: AdoptionApplication[],
): NewAdoptionQueueItem[] {
  return buildNewAdoptionQueue(applications);
}

function buildNewAdoptionQueue(applications: AdoptionApplication[]): NewAdoptionQueueItem[] {
  return applications
    .filter((app) => app.stage === 'new')
    .map((app) => ({
      app,
      matchScore: generateAdoptionAiAssessment(app).score,
    }))
    .sort((a, b) => {
      const scoreDelta = b.matchScore - a.matchScore;
      if (scoreDelta !== 0) return scoreDelta;
      return (
        new Date(b.app.submittedDate).getTime() - new Date(a.app.submittedDate).getTime()
      );
    });
}

/** @deprecated Use newAdoptionQueue */
export function recentApplicationQueue(
  applications: AdoptionApplication[],
  hours = 24,
) {
  return applications
    .filter(
      (app) =>
        ACTIVE_APP_STAGES.includes(app.stage) &&
        hoursSince(app.submittedDate) <= hours,
    )
    .sort(
      (a, b) =>
        new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime(),
    );
}

export function formatQueueAge(date: string) {
  const hours = hoursSince(date);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${Math.max(1, Math.round(hours))}h ago`;
  return `${daysSince(date)}d ago`;
}

export interface RecentDonationItem {
  id: string;
  donorId: string;
  donorName: string;
  amount: number;
  type: 'one-time' | 'monthly';
  catName?: string;
  date: string;
}

export function donationsThisMonth(donorList: Donor[] = donors) {
  return donationsTotalForMonthFromDonors(donorList);
}

function donationsTotalForMonthFromDonors(
  donorList: Donor[],
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

export function shelterRunwaySnapshot(
  stats: Pick<typeof dashboardStats, 'cashReserve' | 'dailyOperatingCost'> = dashboardStats,
) {
  const { cashReserve, dailyOperatingCost } = stats;
  if (dailyOperatingCost <= 0) {
    return { days: 0, label: 'Runway unavailable' };
  }

  const days = Math.floor(cashReserve / dailyOperatingCost);
  if (days >= 60) {
    const months = Math.round(days / 30);
    return { days, label: `~${months} month${months === 1 ? '' : 's'} runway` };
  }
  return { days, label: `~${days} day${days === 1 ? '' : 's'} runway` };
}

export function donationMonthSnapshot(donorList: Donor[] = donors) {
  const received = donationsThisMonth(donorList);
  const runway = shelterRunwaySnapshot();

  return {
    received,
    runway,
  };
}

export function getAllRecentDonations(donorList: Donor[] = donors): RecentDonationItem[] {
  return buildRecentDonations(donorList);
}

export function recentDonations(donorList: Donor[] = donors, limit = 5): RecentDonationItem[] {
  return buildRecentDonations(donorList).slice(0, limit);
}

function buildRecentDonations(donorList: Donor[]): RecentDonationItem[] {
  return donorList
    .flatMap((donor) =>
      donor.donations.map((gift) => ({
        id: `${donor.id}-${gift.id}`,
        donorId: donor.id,
        donorName: donor.name,
        amount: gift.amount,
        type: gift.type,
        catName: gift.catName,
        date: gift.date,
      })),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function publicPageStatus(cat: AdminCat) {
  if (!isCatAvailableForAdoption(cat)) {
    if (cat.health !== 'healthy') {
      return { label: 'Not listed — health hold', tone: 'warning' as const };
    }
    return { label: 'Public page: Draft', tone: 'muted' as const };
  }
  if (!cat.publicPagePublished) {
    return { label: 'Public page: Draft', tone: 'muted' as const };
  }
  if (cat.hasPublicPhoto === false) {
    return { label: 'Public page: Missing photo', tone: 'warning' as const };
  }
  return { label: 'Public page: Published', tone: 'success' as const };
}

export function listedDays(cat: AdminCat) {
  return daysSince(cat.listedForAdoptionSince ?? cat.intakeDate);
}

export function fosterParentName(cat: AdminCat) {
  const active = cat.fosterHistory.find((record) => record.status === 'active');
  return active?.fosterParent ?? 'Unassigned';
}

export function fosterStaleDays(cat: AdminCat) {
  if (!cat.lastFosterUpdate) return null;
  return daysSince(cat.lastFosterUpdate);
}

export function pendingApplicationsForCat(catId: string, applications: AdoptionApplication[]) {
  return applications.filter(
    (app) => app.catId === catId && ACTIVE_APP_STAGES.includes(app.stage),
  ).length;
}

export type DashboardAlertCategory = 'medical' | 'ai' | 'incident' | 'foster' | 'donor';
export type DashboardAlertSeverity = 'high' | 'medium' | 'low';

export interface DashboardAlert {
  id: string;
  category: DashboardAlertCategory;
  severity: DashboardAlertSeverity;
  title: string;
  detail: string;
  href: string;
}

const MEDICAL_HEALTH_STATUSES: HealthStatus[] = ['medical', 'monitoring', 'pending_exam'];
const ACTIVE_ALERT_APP_STAGES: AdoptionApplication['stage'][] = ['new', 'reviewing'];

const SEVERITY_RANK: Record<DashboardAlertSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function medicalAlertSeverity(health: HealthStatus): DashboardAlertSeverity {
  if (health === 'medical') return 'high';
  if (health === 'pending_exam') return 'medium';
  return 'low';
}

function medicalAlertTitle(cat: AdminCat): string {
  if (cat.health === 'medical') return `${cat.name} needs medical care`;
  if (cat.health === 'pending_exam') return `${cat.name} awaiting veterinary exam`;
  return `${cat.name} under health monitoring`;
}

function medicalAlertDetail(cat: AdminCat): string {
  const ongoingRecord = cat.healthRecords.find((record) => record.status === 'ongoing');
  if (ongoingRecord) {
    return `${ongoingRecord.type} — ${ongoingRecord.notes}`;
  }
  if (cat.health === 'pending_exam') {
    return `Intake ${daysSince(cat.intakeDate)}d ago · ${cat.location}`;
  }
  return cat.adoptionStatus || cat.tagline;
}

function medicalAlerts(cats: AdminCat[]): DashboardAlert[] {
  return cats
    .filter((cat) => cat.adoptionPipeline !== 'adopted' && MEDICAL_HEALTH_STATUSES.includes(cat.health))
    .map((cat) => ({
      id: `medical-${cat.id}`,
      category: 'medical' as const,
      severity: medicalAlertSeverity(cat.health),
      title: medicalAlertTitle(cat),
      detail: medicalAlertDetail(cat),
      href: `/admin/cats/${cat.id}`,
    }));
}

function adoptionAiAlerts(applications: AdoptionApplication[]): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  for (const app of applications) {
    if (!ACTIVE_ALERT_APP_STAGES.includes(app.stage)) continue;

    const assessment = generateAdoptionAiAssessment(app);
    const actionableRisks = assessment.riskPoints.filter(
      (point) => point !== 'No major risk flags identified',
    );

    if (assessment.score < 65) {
      alerts.push({
        id: `ai-match-${app.id}`,
        category: 'ai',
        severity: 'high',
        title: 'Low adoption match predicted',
        detail: `${app.applicantName} · ${assessment.score}% match for ${app.catName}`,
        href: `/admin/adoption/${app.id}`,
      });
    }

    for (const risk of actionableRisks) {
      const severity: DashboardAlertSeverity =
        risk.includes('Landlord does not allow') ||
        risk.includes('Multiple cat adoptions') ||
        risk.includes('Limited adoption details')
          ? 'high'
          : assessment.score < 75
            ? 'medium'
            : 'low';

      alerts.push({
        id: `ai-risk-${app.id}-${risk}`,
        category: 'ai',
        severity,
        title: 'AI flagged adoption risk',
        detail: `${app.applicantName} · ${risk}`,
        href: `/admin/adoption/${app.id}`,
      });
    }
  }

  return alerts;
}

function catAiAlerts(cats: AdminCat[]): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  for (const cat of cats) {
    if (cat.adoptionPipeline === 'adopted') continue;

    const traits = getCatTraitsForDisplay(cat.id);
    if (
      isCatAvailableForAdoption(cat) &&
      traits &&
      traits.confidence <= 2 &&
      cat.health !== 'medical'
    ) {
      alerts.push({
        id: `ai-temperament-${cat.id}`,
        category: 'ai',
        severity: 'low',
        title: 'Slow-trust cat — extended socialization likely',
        detail: `${cat.name} may need several more weeks before confident adopter visits`,
        href: `/admin/cats/${cat.id}`,
      });
    }

    if (cat.placement === 'foster') {
      const staleDays = fosterStaleDays(cat);
      if (staleDays !== null && staleDays >= 7) {
        alerts.push({
          id: `ai-foster-${cat.id}`,
          category: 'ai',
          severity: staleDays >= 14 ? 'medium' : 'low',
          title: 'Foster update overdue',
          detail: `${cat.name} · ${staleDays}d since last check-in with ${fosterParentName(cat)}`,
          href: `/admin/cats/${cat.id}`,
        });
      }
    }
  }

  const capacity = shelterCapacitySnapshot(cats);
  if (capacity.percent >= 80) {
    alerts.push({
      id: 'ai-capacity',
      category: 'ai',
      severity: capacity.percent >= 90 ? 'medium' : 'low',
      title: 'Shelter capacity trending high',
      detail: `${capacity.percent}% used (${capacity.count}/${capacity.capacity}) — intake may need to slow soon`,
      href: '/admin/cats',
    });
  }

  return alerts;
}

function incidentAlerts(): DashboardAlert[] {
  return loadIncidentReports()
    .filter((report) => report.status === 'new')
    .map((report) => ({
      id: `incident-${report.id}`,
      category: 'incident' as const,
      severity: 'high' as const,
      title: `Emergency — ${report.catName}`,
      detail: report.description.trim() || `Reported by ${report.reporterName}`,
      href: `/admin/cats/${report.catId}?incident=${report.id}`,
    }));
}

function fosterApplicationAlerts(): DashboardAlert[] {
  return getPendingFosterApplications().map((application) => ({
    id: `foster-app-${application.id}`,
    category: 'foster' as const,
    severity: application.status === 'submitted' ? ('medium' as const) : ('low' as const),
    title: 'Foster application pending review',
    detail: `${application.caregiverName} · ${application.householdType} · ${formatQueueAge(application.submittedAt)}`,
    href: `/admin/caregivers/${application.caregiverId}`,
  }));
}

function donorStewardshipAlerts(donorList: Donor[] = donors): DashboardAlert[] {
  return getUnacknowledgedDonations(donorList).map(({ donor, gift }) => ({
    id: `donor-thankyou-${donor.id}-${gift.id}`,
    category: 'donor' as const,
    severity: gift.amount >= 100 ? ('medium' as const) : ('low' as const),
    title: 'Thank-you not sent',
    detail: `${donor.name} · ${formatCurrency(gift.amount)}${gift.catName ? ` for ${gift.catName}` : ''} · ${formatQueueAge(gift.date)}`,
    href: `/admin/donors/${donor.id}`,
  }));
}

function sortDashboardAlerts(alerts: DashboardAlert[]) {
  return [...alerts].sort((a, b) => {
    const severityDelta = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (severityDelta !== 0) return severityDelta;
    if (a.category !== b.category) return a.category === 'medical' ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
}

export function getDashboardAlerts(
  applications: AdoptionApplication[],
  cats: AdminCat[] = adminCats,
  donorList: Donor[] = donors,
  limit = 6,
): DashboardAlert[] {
  return buildDashboardAlerts(applications, cats, donorList).slice(0, limit);
}

export function getAllDashboardAlerts(
  applications: AdoptionApplication[],
  cats: AdminCat[] = adminCats,
  donorList: Donor[] = donors,
): DashboardAlert[] {
  return buildDashboardAlerts(applications, cats, donorList);
}

function buildDashboardAlerts(
  applications: AdoptionApplication[],
  cats: AdminCat[] = adminCats,
  donorList: Donor[] = donors,
): DashboardAlert[] {
  const alerts = [
    ...incidentAlerts(),
    ...fosterApplicationAlerts(),
    ...donorStewardshipAlerts(donorList),
    ...medicalAlerts(cats),
    ...adoptionAiAlerts(applications),
    ...catAiAlerts(cats),
  ];

  const seen = new Set<string>();
  const deduped = alerts.filter((alert) => {
    const key = `${alert.title}|${alert.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return sortDashboardAlerts(deduped);
}

export function catActivityNote(cat: AdminCat, applications: AdoptionApplication[]): string {
  const pendingApps = pendingApplicationsForCat(cat.id, applications);

  if (pendingApps > 0) {
    return `${pendingApps} adoption${pendingApps === 1 ? '' : 's'} pending review`;
  }
  if (cat.health === 'pending_exam') {
    return 'Awaiting veterinary exam';
  }
  if (isCatAvailableForAdoption(cat)) {
    const page = publicPageStatus(cat);
    return `${page.label} · Listed ${listedDays(cat)}d`;
  }
  if (cat.placement === 'foster') {
    const stale = fosterStaleDays(cat);
    if (stale !== null && stale >= 7) {
      return `${fosterParentName(cat)} · ${stale}d since last update`;
    }
    return `Foster: ${fosterParentName(cat)}`;
  }
  if (cat.adoptionPipeline === 'pending') {
    return 'Adoption in progress';
  }
  return cat.adoptionStatus;
}
