import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plus, Send, X } from 'lucide-react';
import { Button } from '@/admin/components/ui/button';
import { Input } from '@/admin/components/ui/input';
import { formatMessageTime } from '@/admin/lib/utils';
import { useTeamMessages } from '@/hooks/useTeamMessages';
import { addPickupTask } from '@/shared/teamTasks';
import { MANAGER_NAME, threadIdFor } from '@/shared/teamMessages';
import { cn } from '@/admin/lib/utils';
import type { Caregiver } from '@/admin/types';

interface TeamConversationPanelProps {
  caregiver: Caregiver;
  onClose?: () => void;
  className?: string;
  variant?: 'drawer' | 'embedded';
}

export function TeamConversationPanel({
  caregiver,
  onClose,
  className,
  variant = 'drawer',
}: TeamConversationPanelProps) {
  const threadId = threadIdFor(caregiver.id);
  const canAssignPickup = caregiver.role === 'volunteer';
  const isEmbedded = variant === 'embedded';
  const { messages, sendMessage, markRead } = useTeamMessages('manager', { threadId });

  const [draft, setDraft] = useState('');
  const [showPickupForm, setShowPickupForm] = useState(false);
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupCatName, setPickupCatName] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markRead();
  }, [markRead, messages.length, threadId]);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages.length, threadId]);

  const handleSend = () => {
    if (!draft.trim()) return;
    sendMessage(draft.trim(), MANAGER_NAME, threadId);
    setDraft('');
  };

  const handleAssignPickup = () => {
    if (!pickupLocation.trim()) return;
    addPickupTask({
      location: pickupLocation.trim(),
      catName: pickupCatName.trim() || undefined,
      instructions: pickupNotes.trim() || undefined,
      assigneeId: caregiver.id,
    });
    sendMessage(
      `📍 Pickup task: ${pickupLocation.trim()}${pickupCatName.trim() ? ` — ${pickupCatName.trim()}` : ''}${pickupNotes.trim() ? `. ${pickupNotes.trim()}` : ''}. Added to Today's care tasks.`,
      MANAGER_NAME,
      threadId,
    );
    setPickupLocation('');
    setPickupCatName('');
    setPickupNotes('');
    setShowPickupForm(false);
  };

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      {!isEmbedded && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 pb-3 pt-7">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{caregiver.name}</p>
            <p className="text-xs text-muted-foreground">Team conversation</p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="Close conversation"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div
        ref={messagesRef}
        className={cn(
          'min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-y-contain p-4',
          isEmbedded && 'bg-card',
        )}
      >
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation below.
          </p>
        )}
        {messages.map((msg, i) => {
          const isManager = msg.fromRole === 'manager';
          const isPickupTask = isManager && msg.text.startsWith('📍 Pickup task:');
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`flex ${isManager ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-xl px-3 py-2.5',
                  isManager
                    ? isPickupTask
                      ? 'rounded-br-sm border border-primary/30 bg-primary/10 text-foreground'
                      : 'rounded-br-sm bg-primary text-primary-foreground'
                    : 'rounded-bl-sm border border-border bg-muted/40',
                )}
              >
                {!isManager && (
                  <p className="mb-1 text-xs font-semibold text-primary">{msg.from}</p>
                )}
                {isPickupTask && (
                  <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    <MapPin className="h-3 w-3" />
                    Pickup task
                  </p>
                )}
                <p className={cn('text-sm leading-relaxed', isManager && !isPickupTask && 'text-primary-foreground')}>
                  {msg.text}
                </p>
                <p className={cn('mt-1 text-[10px]', isManager && !isPickupTask ? 'text-primary-foreground/65' : 'text-muted-foreground')}>
                  {formatMessageTime(msg.timestamp)}
                </p>
              </div>
            </motion.div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className={cn('shrink-0 border-t border-border p-3', isEmbedded && 'bg-card')}>
        {canAssignPickup && showPickupForm && (
          <div className="mb-3 rounded-lg border border-border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Assign pickup
              </p>
              <button
                type="button"
                onClick={() => setShowPickupForm(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close pickup form"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid gap-2">
              <Input
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="Location"
                className="h-8 text-sm"
              />
              <Input
                value={pickupCatName}
                onChange={(e) => setPickupCatName(e.target.value)}
                placeholder="Cat name (optional)"
                className="h-8 text-sm"
              />
              <Input
                value={pickupNotes}
                onChange={(e) => setPickupNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="h-8 text-sm"
              />
            </div>
            <Button
              onClick={handleAssignPickup}
              disabled={!pickupLocation.trim()}
              size="sm"
              className="mt-2 h-8"
            >
              Send pickup task
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            {canAssignPickup && (
              <button
                type="button"
                onClick={() => setShowPickupForm((value) => !value)}
                title="Assign cat pickup"
                aria-label="Assign cat pickup"
                className={cn(
                  'absolute left-2.5 top-1/2 z-10 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground',
                  showPickupForm && 'text-primary',
                )}
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Message ${caregiver.name}...`}
              className={cn('h-9 w-full', canAssignPickup && 'pl-9')}
            />
          </div>
          <Button onClick={handleSend} disabled={!draft.trim()} size="icon" className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
