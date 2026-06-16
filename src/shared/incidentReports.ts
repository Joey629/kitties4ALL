const STORAGE_KEY = 'kitticare-incident-reports';

export type IncidentReportStatus = 'new' | 'acknowledged' | 'resolved';

export interface IncidentReport {
  id: string;
  catId: string;
  catName: string;
  reporterId: string;
  reporterName: string;
  description: string;
  photoUrl?: string;
  voiceNoteUrl?: string;
  voiceNoteDurationSec?: number;
  createdAt: string;
  status: IncidentReportStatus;
  taskId?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

type Listener = (reports: IncidentReport[]) => void;
const listeners = new Set<Listener>();

function notify(reports: IncidentReport[]) {
  listeners.forEach((listener) => listener(reports));
}

export function loadIncidentReports(): IncidentReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as IncidentReport[];
  } catch {
    return [];
  }
}

function persist(reports: IncidentReport[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  notify(reports);
}

export function subscribeIncidentReports(listener: Listener) {
  listener(loadIncidentReports());
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function submitIncidentReport(
  input: Omit<IncidentReport, 'id' | 'createdAt' | 'status'>,
): IncidentReport {
  const report: IncidentReport = {
    ...input,
    id: `ir-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'new',
  };
  persist([report, ...loadIncidentReports()]);
  return report;
}

export function countNewIncidentReports(reports = loadIncidentReports()) {
  return reports.filter((report) => report.status === 'new').length;
}

export function getIncidentsForReporter(reporterId: string) {
  return loadIncidentReports().filter((report) => report.reporterId === reporterId);
}

export function getOpenIncidentsForReporter(reporterId: string) {
  return getIncidentsForReporter(reporterId).filter((report) => report.status !== 'resolved');
}

export function linkIncidentTask(incidentReportId: string, taskId: string) {
  const next = loadIncidentReports().map((report) =>
    report.id === incidentReportId ? { ...report, taskId } : report,
  );
  persist(next);
}

export function acknowledgeIncidentReport(incidentReportId: string) {
  const next = loadIncidentReports().map((report) =>
    report.id === incidentReportId && report.status === 'new'
      ? { ...report, status: 'acknowledged' as const, acknowledgedAt: new Date().toISOString() }
      : report,
  );
  persist(next);
}

export function resolveIncidentReport(incidentReportId: string) {
  const next = loadIncidentReports().map((report) =>
    report.id === incidentReportId && report.status !== 'resolved'
      ? { ...report, status: 'resolved' as const, resolvedAt: new Date().toISOString() }
      : report,
  );
  persist(next);
}

export function getIncidentReportById(incidentReportId: string) {
  return loadIncidentReports().find((report) => report.id === incidentReportId);
}
