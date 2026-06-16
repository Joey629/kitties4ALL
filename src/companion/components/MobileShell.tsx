import type { ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Cat, MessageCircle, Sparkles } from 'lucide-react';
import { cn } from '@/admin/lib/utils';
import { useCompanion } from '../context/CompanionContext';
import { RewardToast } from './RewardToast';
import type { WorkRole } from '../types';

const allTabs: {
  to: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
  roles: WorkRole[];
}[] = [
  { to: '/companion', label: 'Today', icon: Home, end: true, roles: ['volunteer', 'foster_parent'] },
  { to: '/companion/my-cats', label: 'My Cats', icon: Cat, roles: ['foster_parent'] },
  { to: '/companion/messages', label: 'Messages', icon: MessageCircle, roles: ['volunteer', 'foster_parent'] },
  { to: '/companion/impact', label: 'Impact', icon: Sparkles, roles: ['volunteer', 'foster_parent'] },
];

export function MobileShell({ children }: { children?: ReactNode }) {
  const location = useLocation();
  const { lastReward, clearLastReward } = useCompanion();
  const hideNav = location.pathname.includes('/tasks/') ||
    location.pathname.includes('/update') ||
    location.pathname.includes('/cats/new') ||
    location.pathname.includes('/profile') ||
    location.pathname.includes('/shelter-cats') ||
    location.pathname.includes('/foster/') ||
    location.pathname.match(/\/cats\/[^/]+$/);

  return (
    <div className="companion-theme h-dvh overflow-hidden bg-background companion-preview-bg md:flex md:items-center md:justify-center md:p-6 lg:p-10">
      <div className="h-full w-full md:contents">
        <PhoneFrame>
          <div className="companion-phone-content relative flex h-full min-h-0 flex-col bg-background">
            <main
              className={cn(
                'flex-1 min-h-0 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]',
                hideNav ? '' : 'pb-20',
              )}
            >
              {children ?? <Outlet />}
            </main>
            {!hideNav && <BottomNav />}
            <RewardToast reward={lastReward} onDismiss={clearLastReward} />
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Full-width on real mobile */}
      <div className="relative mx-auto flex h-dvh w-full max-w-[360px] flex-col overflow-hidden md:hidden">
        {children}
      </div>

      {/* Phone mockup on desktop */}
      <div className="hidden md:block companion-phone">
        <div className="companion-phone-bezel">
          <div className="companion-phone-button companion-phone-button-left" aria-hidden />
          <div className="companion-phone-button companion-phone-button-right" aria-hidden />
          <div className="companion-phone-screen">
            <div className="companion-phone-island" aria-hidden>
              <span className="companion-phone-camera" />
            </div>
            {children}
            <div className="companion-phone-home-indicator" aria-hidden />
          </div>
        </div>
      </div>
    </>
  );
}

function BottomNav() {
  const { unreadCount, workRole } = useCompanion();
  const tabs = allTabs.filter((tab) => tab.roles.some((role) => role === workRole));

  return (
    <nav className="companion-bottom-nav absolute bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:pb-4">
      <div className="flex items-end justify-around gap-0.5">
        {tabs.map((tab) => (
          <NavTab key={tab.to} tab={tab} unreadCount={unreadCount} />
        ))}
      </div>
    </nav>
  );
}

function NavTab({
  tab,
  unreadCount,
}: {
  tab: (typeof allTabs)[number];
  unreadCount: number;
}) {
  return (
    <NavLink
      to={tab.to}
      end={tab.end}
      className={({ isActive }) =>
        cn(
          'relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[56px]',
          isActive
            ? 'text-primary bg-primary/8'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted',
        )
      }
    >
      <tab.icon className="w-5 h-5" strokeWidth={2} />
      <span className="text-[10px] font-medium">{tab.label}</span>
      {tab.to === '/companion/messages' && unreadCount > 0 && (
        <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-primary" />
      )}
    </NavLink>
  );
}

export function CatAvatar({ photo, name, size = 'md' }: { photo: string; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-[4.5rem] h-[6.5rem]',
  };
  const isImage =
    photo.startsWith('/') ||
    photo.startsWith('http') ||
    photo.startsWith('data:') ||
    photo.startsWith('blob:');
  return (
    <div
      aria-label={name}
      className={cn(
        'rounded-xl bg-accent flex items-end justify-center shrink-0 border border-border overflow-hidden',
        sizes[size],
      )}
    >
      {isImage ? (
        <img src={photo} alt={name} className="h-full w-full object-contain object-bottom" />
      ) : (
        <span
          className={cn(
            'flex h-full w-full items-center justify-center',
            size === 'sm' && 'text-lg',
            size === 'md' && 'text-2xl',
            size === 'lg' && 'text-4xl',
          )}
        >
          {photo}
        </span>
      )}
    </div>
  );
}

export function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? (completed / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" className="stroke-accent" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15" fill="none" className="stroke-primary" strokeWidth="3"
            strokeDasharray={`${pct * 0.94} 100`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">
          {completed}/{total}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Today&apos;s progress</p>
        <p className="text-xs text-muted-foreground">{completed} of {total} completed</p>
      </div>
    </div>
  );
}
