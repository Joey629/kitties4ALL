import { getFosterAssignedCats } from '@/admin/lib/fosterCaregiverDisplay';
import {
  addTeamMessage,
  DEFAULT_MANAGER_CONTACT_ID,
  MANAGER_NAME,
  threadIdFor,
} from '@/shared/teamMessages';
import { addManualCareTask } from '@/shared/teamTasks';
import type { Caregiver } from '@/admin/types';

function primaryFosterCatName(caregiverId: string) {
  const cats = getFosterAssignedCats(caregiverId);
  if (cats.length === 0) return null;
  if (cats.length === 1) return cats[0].name;
  return cats.map((cat) => cat.name).join(', ');
}

function sendFosterManagerMessage(caregiverId: string, text: string) {
  addTeamMessage(
    text,
    MANAGER_NAME,
    'manager',
    threadIdFor(caregiverId),
    DEFAULT_MANAGER_CONTACT_ID,
  );
}

export function requestFosterUpdate(caregiver: Caregiver) {
  const catLabel = primaryFosterCatName(caregiver.id);
  const detail = catLabel
    ? `Please send a daily update for ${catLabel} when you have a moment.`
    : 'Please send a daily update on your foster cats when you have a moment.';
  sendFosterManagerMessage(caregiver.id, `📋 Request update — ${detail}`);
}

export function scheduleFosterVetVisit(caregiver: Caregiver) {
  const cats = getFosterAssignedCats(caregiver.id);
  const cat = cats[0];
  addManualCareTask({
    assigneeId: caregiver.id,
    type: 'checkup',
    catId: cat?.id,
    catName: cat?.name,
    dueTime: 'This week',
    instructions: 'Coordinate vet visit with shelter team and confirm appointment time.',
    title: cat ? `Vet visit — ${cat.name}` : 'Vet visit coordination',
  });
  sendFosterManagerMessage(
    caregiver.id,
    cat
      ? `🏥 Vet visit scheduled — Please coordinate transport for ${cat.name} and confirm timing with the shelter.`
      : '🏥 Vet visit scheduled — Please coordinate with the shelter team on timing and transport.',
  );
}

export function markFosterAdoptionReady(caregiver: Caregiver) {
  const catLabel = primaryFosterCatName(caregiver.id);
  sendFosterManagerMessage(
    caregiver.id,
    catLabel
      ? `✨ Adoption ready — ${catLabel} is being marked ready for adoption listing. Please keep updates flowing until transfer.`
      : '✨ Adoption ready — Your foster cat is being marked ready for adoption listing.',
  );
}

export function requestFosterTransfer(caregiver: Caregiver) {
  const catLabel = primaryFosterCatName(caregiver.id);
  sendFosterManagerMessage(
    caregiver.id,
    catLabel
      ? `↔️ Foster transfer — Let's plan next steps for ${catLabel}. Reply with your availability for handoff.`
      : `↔️ Foster transfer — Let's plan the next foster handoff. Reply with your availability.`,
  );
}
