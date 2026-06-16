import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addTeamMessage,
  countUnreadForCaregiver,
  countUnreadForManager,
  loadTeamMessages,
  markReadByCaregiver,
  markReadByManager,
  sortMessagesChronologically,
  subscribeTeamMessages,
  type TeamMessage,
} from '@/shared/teamMessages';

interface UseTeamMessagesOptions {
  threadId?: string | null;
  caregiverId?: string;
}

export function useTeamMessages(
  side: 'manager' | 'caregiver',
  options: UseTeamMessagesOptions = {},
) {
  const { threadId, caregiverId } = options;
  const [allMessages, setAllMessages] = useState<TeamMessage[]>(() => loadTeamMessages());

  useEffect(() => {
    const unsubscribe = subscribeTeamMessages(setAllMessages);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'kitticare-team-messages-v2') {
        setAllMessages(loadTeamMessages());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const messages = useMemo(() => {
    const filtered = threadId
      ? allMessages.filter((m) => m.threadId === threadId)
      : allMessages;
    return sortMessagesChronologically(filtered);
  }, [allMessages, threadId]);

  const sendMessage = useCallback(
    (text: string, from: string, targetThreadId: string, fromId?: string) => {
      addTeamMessage(text, from, side, targetThreadId, fromId);
    },
    [side],
  );

  const markRead = useCallback(() => {
    if (!threadId) return;
    if (side === 'manager') markReadByManager(threadId);
    else if (caregiverId) markReadByCaregiver(caregiverId, threadId);
  }, [side, threadId, caregiverId]);

  const unreadCount = useMemo(() => {
    if (side === 'manager') return countUnreadForManager(allMessages);
    if (!caregiverId) return 0;
    return countUnreadForCaregiver(allMessages, caregiverId);
  }, [allMessages, side, caregiverId]);

  return { messages, allMessages, sendMessage, markRead, unreadCount };
}
