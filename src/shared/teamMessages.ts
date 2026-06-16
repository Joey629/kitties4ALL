import { caregivers } from '@/admin/data/mock';
import type { CaregiverRole } from '@/admin/types';

export type TeamMessageRole = 'manager' | 'caregiver';

export interface TeamMessage {
  id: string;
  threadId: string;
  from: string;
  fromId?: string;
  fromRole: TeamMessageRole;
  text: string;
  timestamp: string;
  readByManager: boolean;
  readByCaregiver: boolean;
}

export const MANAGER_NAME = 'Sarah Chen';
export const DEFAULT_MANAGER_CONTACT_ID = 'mgr-sarah';

export interface MessageContact {
  id: string;
  caregiverId: string;
  name: string;
  title: string;
  avatar: string;
}

const STORAGE_KEY = 'kitticare-team-messages-v2';

export function peerThreadId(idA: string, idB: string) {
  const [a, b] = [idA, idB].sort();
  return `peer::${a}::${b}`;
}

export function threadIdFor(caregiverId: string, contactId = DEFAULT_MANAGER_CONTACT_ID) {
  if (contactId.startsWith('mgr-')) return `${caregiverId}::${contactId}`;
  return peerThreadId(caregiverId, contactId);
}

export function caregiverIdFromThread(threadId: string) {
  if (threadId.startsWith('peer::')) return threadId.split('::')[1] ?? '';
  return threadId.split('::')[0] ?? '';
}

export function contactIdFromThread(threadId: string) {
  if (threadId.startsWith('peer::')) return threadId.split('::')[2] ?? '';
  return threadId.split('::')[1] ?? DEFAULT_MANAGER_CONTACT_ID;
}

function roleLabel(role: CaregiverRole) {
  if (role === 'staff') return 'Shelter manager';
  if (role === 'foster_parent') return 'Foster parent';
  return 'Volunteer';
}

export function getCompanionMessageContacts(currentUserId: string): MessageContact[] {
  return caregivers
    .filter((caregiver) => caregiver.id !== currentUserId)
    .map((caregiver) => ({
      id: caregiver.role === 'staff' ? DEFAULT_MANAGER_CONTACT_ID : caregiver.id,
      caregiverId: caregiver.id,
      name: caregiver.name,
      title: roleLabel(caregiver.role),
      avatar: caregiver.avatar,
    }));
}

export function threadIncludesCaregiver(threadId: string, caregiverId: string) {
  if (threadId.startsWith(`${caregiverId}::`)) return true;
  if (threadId.startsWith('peer::')) {
    const parts = threadId.split('::');
    return parts.includes(caregiverId);
  }
  return false;
}

export function isIncomingForCaregiver(message: TeamMessage, caregiverId: string) {
  if (message.fromRole === 'manager') return true;
  if (message.fromId) return message.fromId !== caregiverId;
  if (message.threadId.startsWith(`${caregiverId}::`)) return false;
  return true;
}

const SEED_MESSAGES: TeamMessage[] = [
  {
    id: 'msg-1',
    threadId: threadIdFor('cg-2'),
    from: MANAGER_NAME,
    fromRole: 'manager',
    text: 'Luna has a vet appointment tomorrow at 10 AM. Please keep her calm today.',
    timestamp: '2025-06-12T08:00:00',
    readByManager: true,
    readByCaregiver: false,
  },
  {
    id: 'msg-2',
    threadId: threadIdFor('cg-2'),
    from: MANAGER_NAME,
    fromRole: 'manager',
    text: 'Great work with Pearl yesterday! Her confidence is really growing.',
    timestamp: '2025-06-11T16:00:00',
    readByManager: true,
    readByCaregiver: true,
  },
  {
    id: 'msg-3',
    threadId: threadIdFor('cg-2'),
    from: 'Marcus Webb',
    fromId: 'cg-2',
    fromRole: 'caregiver',
    text: 'Mochi had an amazing play session today. Very social with visitors!',
    timestamp: '2025-06-11T14:30:00',
    readByManager: true,
    readByCaregiver: true,
  },
  {
    id: 'msg-4',
    threadId: threadIdFor('cg-2'),
    from: MANAGER_NAME,
    fromRole: 'manager',
    text: 'Reminder: Biscuit adoption pickup at 2 PM today. Rivera family confirmed.',
    timestamp: '2025-06-12T07:30:00',
    readByManager: true,
    readByCaregiver: false,
  },
  {
    id: 'msg-5',
    threadId: threadIdFor('cg-3'),
    from: MANAGER_NAME,
    fromRole: 'manager',
    text: 'Maple\'s weekly photo update is due tomorrow. Can you send one tonight?',
    timestamp: '2025-06-12T09:15:00',
    readByManager: true,
    readByCaregiver: false,
  },
  {
    id: 'msg-6',
    threadId: threadIdFor('cg-3'),
    from: 'Elena Rodriguez',
    fromId: 'cg-3',
    fromRole: 'caregiver',
    text: 'Will do! She\'s been eating well and sleeping through the night.',
    timestamp: '2025-06-12T10:00:00',
    readByManager: true,
    readByCaregiver: true,
  },
  {
    id: 'msg-7',
    threadId: threadIdFor('cg-4'),
    from: 'James Park',
    fromId: 'cg-4',
    fromRole: 'caregiver',
    text: 'Shadow came within arm\'s reach during quiet bonding today.',
    timestamp: '2025-06-12T11:20:00',
    readByManager: false,
    readByCaregiver: true,
  },
  {
    id: 'msg-8',
    threadId: peerThreadId('cg-2', 'cg-3'),
    from: 'Elena Rodriguez',
    fromId: 'cg-3',
    fromRole: 'caregiver',
    text: 'Can you cover Maple\'s evening feeding on Thursday?',
    timestamp: '2025-06-12T12:00:00',
    readByManager: true,
    readByCaregiver: false,
  },
  {
    id: 'msg-9',
    threadId: peerThreadId('cg-2', 'cg-4'),
    from: 'James Park',
    fromId: 'cg-4',
    fromRole: 'caregiver',
    text: 'Shadow is ready for a calm meet-and-greet this weekend if you have time.',
    timestamp: '2025-06-12T11:45:00',
    readByManager: true,
    readByCaregiver: false,
  },
  {
    id: 'msg-10',
    threadId: threadIdFor('cg-9'),
    from: 'Rachel Morrison',
    fromId: 'cg-9',
    fromRole: 'caregiver',
    text: 'Pearl ate a full breakfast and explored the hallway for the first time!',
    timestamp: '2026-06-12T08:45:00',
    readByManager: false,
    readByCaregiver: true,
  },
  {
    id: 'msg-11',
    threadId: threadIdFor('cg-11'),
    from: MANAGER_NAME,
    fromRole: 'manager',
    text: 'Willow\'s follow-up is Thursday — please note appetite and mobility in your update.',
    timestamp: '2026-06-12T09:00:00',
    readByManager: true,
    readByCaregiver: false,
  },
  {
    id: 'msg-12',
    threadId: threadIdFor('cg-5'),
    from: MANAGER_NAME,
    fromRole: 'manager',
    text: 'We may have a short-term kitten placement next week. Are you available?',
    timestamp: '2026-06-11T15:30:00',
    readByManager: true,
    readByCaregiver: true,
  },
];

type Listener = (messages: TeamMessage[]) => void;
const listeners = new Set<Listener>();

function notify(messages: TeamMessage[]) {
  listeners.forEach((fn) => fn(messages));
}

export function loadTeamMessages(): TeamMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveTeamMessages(SEED_MESSAGES);
      return SEED_MESSAGES;
    }
    return JSON.parse(raw) as TeamMessage[];
  } catch {
    return SEED_MESSAGES;
  }
}

export function saveTeamMessages(messages: TeamMessage[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  notify(messages);
}

export function subscribeTeamMessages(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function sortMessagesChronologically(messages: TeamMessage[]) {
  return [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

export function addTeamMessage(
  text: string,
  from: string,
  fromRole: TeamMessageRole,
  threadId: string,
  fromId?: string,
): TeamMessage {
  const message: TeamMessage = {
    id: `msg-${Date.now()}`,
    threadId,
    from,
    fromId,
    fromRole,
    text,
    timestamp: new Date().toISOString(),
    readByManager: fromRole === 'manager',
    readByCaregiver: fromRole === 'caregiver' && Boolean(fromId),
  };
  const next = [...loadTeamMessages(), message];
  saveTeamMessages(next);
  return message;
}

export function markReadByManager(threadId?: string) {
  const next = loadTeamMessages().map((m) => {
    if (m.fromRole !== 'caregiver') return m;
    if (threadId && m.threadId !== threadId) return m;
    return { ...m, readByManager: true };
  });
  saveTeamMessages(next);
}

export function markReadByCaregiver(caregiverId: string, threadId?: string) {
  const next = loadTeamMessages().map((m) => {
    if (threadId && m.threadId !== threadId) return m;
    if (!threadIncludesCaregiver(m.threadId, caregiverId)) return m;
    if (!isIncomingForCaregiver(m, caregiverId)) return m;
    return { ...m, readByCaregiver: true };
  });
  saveTeamMessages(next);
}

export function countUnreadForManager(messages: TeamMessage[]) {
  return messages.filter((m) => m.fromRole === 'caregiver' && !m.readByManager).length;
}

export function countUnreadForCaregiver(messages: TeamMessage[], caregiverId: string) {
  return messages.filter(
    (m) =>
      threadIncludesCaregiver(m.threadId, caregiverId) &&
      isIncomingForCaregiver(m, caregiverId) &&
      !m.readByCaregiver,
  ).length;
}

export function countUnreadInThread(
  messages: TeamMessage[],
  threadId: string,
  side: 'manager' | 'caregiver',
  caregiverId?: string,
) {
  return messages.filter((m) => {
    if (m.threadId !== threadId) return false;
    if (side === 'manager') return m.fromRole === 'caregiver' && !m.readByManager;
    if (!caregiverId) return m.fromRole === 'manager' && !m.readByCaregiver;
    return isIncomingForCaregiver(m, caregiverId) && !m.readByCaregiver;
  }).length;
}

export interface ThreadSummary {
  threadId: string;
  lastMessage: TeamMessage | null;
  unreadCount: number;
}

export function getManagerThreadSummaries(
  messages: TeamMessage[],
  caregiverIds: string[],
): ThreadSummary[] {
  return caregiverIds.map((caregiverId) => {
    const threadId = threadIdFor(caregiverId);
    const threadMessages = sortMessagesChronologically(
      messages.filter((m) => m.threadId === threadId),
    );
    return {
      threadId,
      lastMessage: threadMessages.at(-1) ?? null,
      unreadCount: countUnreadInThread(messages, threadId, 'manager'),
    };
  });
}

export function getCaregiverThreadSummaries(
  messages: TeamMessage[],
  caregiverId: string,
): ThreadSummary[] {
  return getCompanionMessageContacts(caregiverId).map((contact) => {
    const threadId = threadIdFor(caregiverId, contact.id);
    const threadMessages = sortMessagesChronologically(
      messages.filter((m) => m.threadId === threadId),
    );
    return {
      threadId,
      lastMessage: threadMessages.at(-1) ?? null,
      unreadCount: countUnreadInThread(messages, threadId, 'caregiver', caregiverId),
    };
  });
}

export function getThreadListForCaregiver(
  messages: TeamMessage[],
  caregiverId: string,
): Array<ThreadSummary & { contact: MessageContact }> {
  const contacts = getCompanionMessageContacts(caregiverId);
  const summaries = getCaregiverThreadSummaries(messages, caregiverId);

  return contacts
    .map((contact, index) => ({
      contact,
      ...summaries[index],
    }))
    .sort((a, b) => {
      if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
      const aTime = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
      return bTime - aTime;
    });
}
