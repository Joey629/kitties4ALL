import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Cat,
  Users,
  Heart,
  HandCoins,
  PawPrint,
  ExternalLink,
  Menu,
  X,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/admin/lib/utils';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useTeamMessages } from '@/hooks/useTeamMessages';
import { useTodayTasksFeed } from '@/hooks/useTodayTasksFeed';
import { AdminChatProvider } from '@/admin/context/AdminChatContext';

const navItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/tasks', label: 'Tasks', icon: ClipboardList, taskBadge: true as const },
  { to: '/admin/cats', label: 'Cats', icon: Cat },
  { to: '/admin/caregivers', label: 'Caregivers', icon: Users, unreadKey: 'team' as const },
  { to: '/admin/adoption', label: 'Adoption', icon: Heart },
  { to: '/admin/donors', label: 'Donors', icon: HandCoins },
];

function SidebarNav({
  onNavigate,
  teamUnread,
  urgentTaskCount,
}: {
  onNavigate?: () => void;
  teamUnread: number;
  urgentTaskCount: number;
}) {
  const location = useLocation();

  return (
    <>
      <div className="flex h-[4.5rem] items-center gap-3 px-5 shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
          <PawPrint className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-semibold leading-tight truncate text-foreground">Kitties 4 All</p>
        </div>
      </div>
      <div className="mx-4 border-b border-border shrink-0" />

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-all',
                isActive
                  ? 'bg-primary/8 text-primary admin-nav-active'
                  : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.unreadKey === 'team' && teamUnread > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {teamUnread}
                </span>
              )}
              {item.taskBadge && urgentTaskCount > 0 && (
                <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-destructive-foreground">
                  {urgentTaskCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-1 shrink-0">
        <a
          href="/companion"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <PawPrint className="h-5 w-5 shrink-0" />
          caregiver app
        </a>
        <a
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-5 w-5 shrink-0" />
          adopter flow
        </a>
      </div>

      <div className="p-3 pt-0 shrink-0">
        <div className="flex items-center gap-3 rounded-lg px-3 py-3 border-t border-border">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">Sarah Chen</p>
            <p className="text-xs text-muted-foreground truncate">Shelter Manager</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
            SC
          </div>
        </div>
      </div>
    </>
  );
}

function Sidebar({
  mobile,
  open,
  onClose,
  teamUnread,
  urgentTaskCount,
}: {
  mobile?: boolean;
  open?: boolean;
  onClose?: () => void;
  teamUnread: number;
  urgentTaskCount: number;
}) {
  if (mobile) {
    return (
      <>
        {open && (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={onClose}
          />
        )}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex h-dvh w-64 max-w-[85vw] flex-col border-r border-border bg-sidebar transition-transform duration-200 lg:hidden',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
          <SidebarNav onNavigate={onClose} teamUnread={teamUnread} urgentTaskCount={urgentTaskCount} />
        </aside>
      </>
    );
  }

  return (
    <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:sticky lg:top-0 lg:h-dvh lg:flex-col border-r border-border bg-sidebar">
      <SidebarNav teamUnread={teamUnread} urgentTaskCount={urgentTaskCount} />
    </aside>
  );
}

function AdminHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/80 bg-[hsl(220_8%_97%)]/90 backdrop-blur-md px-4 sm:px-6 lg:hidden">
      <button
        type="button"
        onClick={onMenuClick}
        className="p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
    </header>
  );
}

export function AdminLayout() {
  useDocumentMeta('Manager console', '📋', 'admin');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount: teamUnread } = useTeamMessages('manager');
  const tasks = useTodayTasksFeed();
  const urgentTaskCount = tasks.filter((item) => item.status === 'Urgent').length;

  useEffect(() => {
    document.documentElement.dataset.app = 'admin';
    return () => {
      delete document.documentElement.dataset.app;
    };
  }, []);

  return (
    <AdminChatProvider>
      <div className="admin-theme admin-surface flex h-dvh w-full overflow-hidden">
        <Sidebar mobile open={sidebarOpen} onClose={() => setSidebarOpen(false)} teamUnread={teamUnread} urgentTaskCount={urgentTaskCount} />
        <Sidebar teamUnread={teamUnread} urgentTaskCount={urgentTaskCount} />

        <div className="admin-main flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto w-full min-w-0 px-4 pt-4 pb-4 sm:px-6 sm:pt-6 sm:pb-4 lg:px-8 lg:pt-8 lg:pb-4">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminChatProvider>
  );
}
