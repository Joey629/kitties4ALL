import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { formatMessageTime } from '@/admin/lib/utils';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '@/admin/components/ui/badge';
import { Button } from '@/admin/components/ui/button';
import { Input } from '@/admin/components/ui/input';
import { useTeamMessages } from '@/hooks/useTeamMessages';
import {
  getThreadListForCaregiver,
  isIncomingForCaregiver,
  threadIdFor,
  type MessageContact,
} from '@/shared/teamMessages';
import { cn } from '@/admin/lib/utils';

export function MessagesScreen() {
  const { user } = useCompanion();
  const [activeContact, setActiveContact] = useState<MessageContact | null>(null);
  const activeThreadId = activeContact ? threadIdFor(user.id, activeContact.id) : null;

  const { messages, allMessages, sendMessage, markRead, unreadCount } = useTeamMessages('caregiver', {
    threadId: activeThreadId,
    caregiverId: user.id,
  });
  const threadList = getThreadListForCaregiver(allMessages, user.id);

  const [reply, setReply] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeThreadId) return;
    markRead();
  }, [markRead, messages.length, activeThreadId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeThreadId]);

  const handleSend = () => {
    if (!reply.trim() || !activeThreadId) return;
    sendMessage(reply.trim(), user.name, activeThreadId, user.id);
    setReply('');
  };

  if (activeContact && activeThreadId) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex h-full min-h-0 flex-col"
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={() => setActiveContact(null)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {activeContact.avatar}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{activeContact.name}</p>
            <p className="truncate text-xs text-muted-foreground">{activeContact.title}</p>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No messages with {activeContact.name} yet.
            </p>
          )}
          {messages.map((msg, i) => {
            const incoming = isIncomingForCaregiver(msg, user.id);
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex ${incoming ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-xl px-4 py-3',
                    incoming
                      ? 'rounded-bl-sm border border-border bg-card shadow-sm'
                      : 'rounded-br-sm bg-primary text-primary-foreground',
                  )}
                >
                  {incoming && (
                    <p className="mb-1 text-xs font-semibold text-primary">{msg.from}</p>
                  )}
                  <p className={cn('text-sm leading-relaxed', incoming ? 'text-foreground' : 'text-primary-foreground')}>
                    {msg.text}
                  </p>
                  <p className={cn('mt-1.5 text-[10px]', incoming ? 'text-muted-foreground' : 'text-primary-foreground/60')}>
                    {formatMessageTime(msg.timestamp)}
                  </p>
                </div>
              </motion.div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="sticky bottom-0 border-t border-border bg-background px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-2">
            <Input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Message ${activeContact.name}...`}
              className="h-12 flex-1 rounded-lg"
            />
            <Button onClick={handleSend} disabled={!reply.trim()} size="icon" className="h-12 w-12 shrink-0 rounded-lg">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full min-h-0 flex-col">
      <div className="px-5 pt-4 pb-3">
        <PageHeader
          title="Messages"
          description="Chat with the shelter team and other caregivers"
          actions={
            unreadCount > 0 ? (
              <Badge variant="default">{unreadCount} new</Badge>
            ) : undefined
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {threadList.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No conversations yet.</p>
        ) : (
          <ul>
            {threadList.map(({ contact, lastMessage, unreadCount: threadUnread }, index) => (
              <li key={contact.id}>
                <button
                  type="button"
                  onClick={() => setActiveContact(contact)}
                  className="flex w-full items-center gap-3 py-3 text-left transition-colors active:bg-muted/40"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {contact.avatar}
                  </div>
                  <div
                    className={cn(
                      'min-w-0 flex-1',
                      index < threadList.length - 1 && 'border-b border-border/40 pb-3',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{contact.name}</p>
                      {lastMessage && (
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {formatMessageTime(lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-muted-foreground">
                        {lastMessage?.text ?? contact.title}
                      </p>
                      {threadUnread > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                          {threadUnread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
