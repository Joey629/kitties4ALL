import { linkIncidentTask, submitIncidentReport } from '@/shared/incidentReports';
import { addIncidentResponseTask } from '@/shared/teamTasks';
import { addTeamMessage, threadIdFor } from '@/shared/teamMessages';

export interface SubmitEmergencyWorkflowInput {
  catId: string;
  catName: string;
  reporterId: string;
  reporterName: string;
  description: string;
  photoUrl?: string;
}

export function submitEmergencyWorkflow(input: SubmitEmergencyWorkflowInput) {
  const report = submitIncidentReport({
    catId: input.catId,
    catName: input.catName,
    reporterId: input.reporterId,
    reporterName: input.reporterName,
    description: input.description,
    photoUrl: input.photoUrl,
  });

  const detail =
    input.description.trim() || (input.photoUrl ? 'Photo evidence attached' : 'Emergency reported');

  addTeamMessage(
    `🚨 Emergency — ${input.catName}: ${detail}`,
    input.reporterName,
    'caregiver',
    threadIdFor(input.reporterId),
    input.reporterId,
  );

  const task = addIncidentResponseTask({
    incidentReportId: report.id,
    catId: input.catId,
    catName: input.catName,
    reporterName: input.reporterName,
    summary: detail,
  });

  linkIncidentTask(report.id, task.id);

  return { report, task };
}
