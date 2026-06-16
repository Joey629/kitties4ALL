import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useAdminChat } from '@/admin/context/AdminChatContext';
import { Avatar, AvatarFallback } from '@/admin/components/ui/avatar';
import { Badge } from '@/admin/components/ui/badge';
import { Button } from '@/admin/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/admin/components/ui/tabs';
import { PageBackLink } from '@/admin/components/shared/PageBackLink';
import { PageHeader } from '@/admin/components/shared/PageHeader';
import { OpenTasksPanel } from '@/admin/components/tasks/OpenTasksPanel';
import { FosterAssignmentsTab } from '@/admin/components/caregivers/FosterAssignmentsTab';
import { FosterActionsDropdown } from '@/admin/components/caregivers/FosterActionsDropdown';
import { getCaregiverById } from '@/shared/caregivers';
import { getFosterApplicationForCaregiver, isPendingFosterApplication } from '@/shared/fosterWorkflow';
import { getCaregiverRoleLabel } from '@/admin/lib/caregiverDisplay';
import { cn, formatDate } from '@/admin/lib/utils';
import type { Caregiver, CaregiverRole } from '@/admin/types';

const roleBadgeVariant: Record<
  CaregiverRole,
  'default' | 'success' | 'warning'
> = {
  volunteer: 'success',
  foster_parent: 'warning',
  staff: 'default',
};

function CaregiverProfileTab({ caregiver }: { caregiver: Caregiver }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {caregiver.skills.map((skill) => (
          <Badge key={skill} variant="outline" className="rounded-full px-3 py-1">
            {skill}
          </Badge>
        ))}
      </div>

      <div className="grid gap-3 border-t border-border/60 pt-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</p>
          <p className="mt-1 text-foreground">{caregiver.email}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</p>
          <p className="mt-1 text-foreground">{caregiver.phone}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Availability</p>
          <p className={cn('mt-1 text-foreground')}>{caregiver.availability}</p>
        </div>
      </div>
    </div>
  );
}

export function CaregiverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { openChat } = useAdminChat();
  const caregiver = getCaregiverById(id ?? '');

  const isFosterView = useMemo(() => {
    if (!caregiver) return false;
    if (caregiver.role === 'foster_parent') return true;
    return isPendingFosterApplication(getFosterApplicationForCaregiver(caregiver.id));
  }, [caregiver]);

  if (!caregiver) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Caregiver not found.</p>
        <PageBackLink to="/admin/caregivers" className="mb-0 mt-4">
          Back to caregivers
        </PageBackLink>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="-mx-4 -mb-4 flex min-h-0 flex-1 flex-col bg-muted/35 px-6 pb-5 pt-0 sm:-mx-6 lg:-mx-8"
    >
      <PageBackLink to="/admin/caregivers">Back to caregivers</PageBackLink>

      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="admin-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-6">
            <div className="mb-4 border-b border-border/60 pb-4">
              <PageHeader
                variant="section"
                className="mb-0 gap-3 border-0 pb-0 sm:items-center"
                title={caregiver.name}
                description={`Joined ${formatDate(caregiver.joinedDate)} · ${caregiver.activityCount} activity logs`}
                actions={
                  isFosterView ? (
                    <FosterActionsDropdown caregiver={caregiver} />
                  ) : caregiver.role !== 'staff' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5"
                      onClick={() => openChat(caregiver.id)}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Message
                    </Button>
                  ) : undefined
                }
              />
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary/8 text-xs font-semibold text-primary">
                  {caregiver.avatar}
                </AvatarFallback>
              </Avatar>
              <Badge variant={roleBadgeVariant[caregiver.role]}>
                {getCaregiverRoleLabel(caregiver.role)}
              </Badge>
              <span className="text-sm text-muted-foreground">{caregiver.email}</span>
            </div>

            {isFosterView ? (
              <Tabs defaultValue="profile">
                <TabsList className="h-9 w-full">
                  <TabsTrigger value="profile" className="flex-1 text-xs">
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="assignments" className="flex-1 text-xs">
                    Assignments
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="flex-1 text-xs">
                    Open tasks
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-4">
                  <CaregiverProfileTab caregiver={caregiver} />
                </TabsContent>

                <TabsContent value="assignments" className="mt-4">
                  <FosterAssignmentsTab caregiver={caregiver} />
                </TabsContent>

                <TabsContent value="tasks" className="mt-4">
                  <OpenTasksPanel
                    assigneeId={caregiver.id}
                    includeRelatedSupplyRequests
                    showAssignForm
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <Tabs defaultValue="profile">
                <TabsList className="h-9 w-full">
                  <TabsTrigger value="profile" className="flex-1 text-xs">
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="flex-1 text-xs">
                    Open tasks
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-4">
                  <CaregiverProfileTab caregiver={caregiver} />
                </TabsContent>

                <TabsContent value="tasks" className="mt-4">
                  <OpenTasksPanel assigneeId={caregiver.id} />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
