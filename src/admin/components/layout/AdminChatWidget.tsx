import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Minus, PanelLeft, PanelLeftClose, X } from 'lucide-react';
import { TeamConversationPanel } from '@/admin/components/shared/TeamConversationPanel';
import { formatMessageTime, cn } from '@/admin/lib/utils';
import { useTeamMessages } from '@/hooks/useTeamMessages';
import { loadCaregivers, subscribeCaregivers } from '@/shared/caregivers';
import {
  getManagerThreadSummaries,
  threadIdFor,
} from '@/shared/teamMessages';
import type { CaregiverRole } from '@/admin/types';

const CHROME_BG = 'bg-[hsl(220_14%_93%)]';

function roleLabel(role: CaregiverRole) {
  if (role === 'foster_parent') return 'Foster';
  if (role === 'volunteer') return 'Volunteer';
  return 'Staff';
}

interface AdminChatWidgetProps {
  open: boolean;
  selectedId: string | null;
  onOpen: () => void;
  onClose: () => void;
  onSelectId: (id: string | null) => void;
}

export function AdminChatWidget({
  open,
  selectedId,
  onOpen,
  onClose,
  onSelectId,
}: AdminChatWidgetProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [caregiverList, setCaregiverList] = useState(() => loadCaregivers());
  const { allMessages, unreadCount } = useTeamMessages('manager');

  useEffect(() => {
    const unsubscribe = subscribeCaregivers(setCaregiverList);
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'kitticare-caregivers') setCaregiverList(loadCaregivers());
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const chatCaregivers = useMemo(
    () => caregiverList.filter((caregiver) => caregiver.role !== 'staff'),
    [caregiverList],
  );

  const threads = useMemo(() => {
    const summaries = getManagerThreadSummaries(
      allMessages,
      chatCaregivers.map((caregiver) => caregiver.id),
    );

    return chatCaregivers
      .map((caregiver) => {
        const summary = summaries.find((item) => item.threadId === threadIdFor(caregiver.id));
        return {
          caregiver,
          lastMessage: summary?.lastMessage ?? null,
          unreadCount: summary?.unreadCount ?? 0,
        };
      })
      .sort((a, b) => {
        const aTime = a.lastMessage?.timestamp ?? '';
        const bTime = b.lastMessage?.timestamp ?? '';
        if (aTime && bTime) return bTime.localeCompare(aTime);
        if (aTime) return -1;
        if (bTime) return 1;
        return a.caregiver.name.localeCompare(b.caregiver.name);
      });
  }, [allMessages, chatCaregivers]);

  const selectedCaregiver = useMemo(
    () => chatCaregivers.find((caregiver) => caregiver.id === selectedId) ?? null,
    [chatCaregivers, selectedId],
  );

  useEffect(() => {
    if (!open || selectedId) return;
    const firstUnread = threads.find((thread) => thread.unreadCount > 0);
    if (firstUnread) {
      onSelectId(firstUnread.caregiver.id);
      return;
    }
    if (threads[0]) onSelectId(threads[0].caregiver.id);
  }, [open, selectedId, threads, onSelectId]);

  useEffect(() => {
    if (open) setSidebarOpen(true);
  }, [open]);

  const widget = (
    <div className="admin-theme pointer-events-none fixed bottom-5 right-5 z-[200] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="pointer-events-auto isolate flex h-[min(560px,calc(100dvh-6rem))] w-[min(720px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_24px_64px_-28px_rgba(0,0,0,0.35)]"
          >
            <div
              className={cn(
                'flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-3 py-3 sm:px-4',
                CHROME_BG,
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSidebarOpen((value) => !value)}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-black/[0.04] hover:text-foreground"
                  aria-label={sidebarOpen ? 'Hide conversations' : 'Show conversations'}
                >
                  {sidebarOpen ? (
                    <PanelLeftClose className="h-4 w-4" />
                  ) : (
                    <PanelLeft className="h-4 w-4" />
                  )}
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Team chat</p>
                  <p className="text-xs text-muted-foreground">Message volunteers and foster parents</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-black/[0.04] hover:text-foreground"
                  aria-label="Minimize chat"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-black/[0.04] hover:text-foreground"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 bg-card">
              <aside
                className={cn(
                  'flex shrink-0 flex-col overflow-hidden border-r border-border/60 bg-card transition-[width] duration-200 ease-out',
                  sidebarOpen ? 'w-[11.5rem] sm:w-[13rem]' : 'w-0 border-r-0',
                )}
              >
                <div className="w-[11.5rem] shrink-0 border-b border-border/60 bg-card px-3 py-2 sm:w-[13rem]">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Conversations
                  </p>
                </div>
                <div className="min-h-0 w-[11.5rem] flex-1 overflow-y-auto bg-card sm:w-[13rem]">
                  {threads.length === 0 ? (
                    <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                      No caregivers yet.
                    </p>
                  ) : (
                    <ul>
                      {threads.map(({ caregiver, lastMessage, unreadCount: threadUnread }) => {
                        const isActive = caregiver.id === selectedId;
                        return (
                          <li key={caregiver.id}>
                            <button
                              type="button"
                              onClick={() => onSelectId(caregiver.id)}
                              className={cn(
                                'flex w-full items-start gap-2.5 px-3 py-3 text-left transition-colors',
                                isActive ? 'bg-primary/10' : 'hover:bg-black/[0.03]',
                              )}
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                                {caregiver.avatar}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <p className="truncate text-xs font-semibold text-foreground">
                                    {caregiver.name.split(' ')[0]}
                                  </p>
                                  {lastMessage && (
                                    <span className="shrink-0 text-[9px] text-muted-foreground">
                                      {formatMessageTime(lastMessage.timestamp)}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5 flex items-center justify-between gap-1">
                                  <p className="truncate text-[10px] text-muted-foreground">
                                    {lastMessage?.text ?? roleLabel(caregiver.role)}
                                  </p>
                                  {threadUnread > 0 && (
                                    <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
                                      {threadUnread}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </aside>

              <div className="flex min-w-0 flex-1 flex-col bg-card">
                {selectedCaregiver ? (
                  <>
                    <div className="flex shrink-0 items-center gap-2.5 border-b border-border/60 bg-card px-4 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                        {selectedCaregiver.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {selectedCaregiver.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {roleLabel(selectedCaregiver.role)}
                        </p>
                      </div>
                    </div>
                    <TeamConversationPanel
                      key={selectedCaregiver.id}
                      caregiver={selectedCaregiver}
                      variant="embedded"
                      className="min-h-0 flex-1 bg-card"
                    />
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center bg-card px-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Select a conversation to start messaging.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <motion.button
          type="button"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onOpen}
          className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_12px_32px_-12px_hsl(var(--primary)/0.55)] transition-shadow hover:shadow-[0_16px_40px_-10px_hsl(var(--primary)/0.6)]"
          aria-label="Open team chat"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-coral px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </motion.button>
      )}
    </div>
  );

  return createPortal(widget, document.body);
}
