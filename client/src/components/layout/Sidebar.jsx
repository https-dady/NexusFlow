import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Activity,
  BarChart3,
  Bell,
  ChevronDown,
  Cpu,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  Radio,
  ScrollText,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';
import { Logo } from './Logo.jsx';
import { Avatar } from '../ui/DataDisplay.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { can, PERMISSIONS } from '../../lib/permissions.js';
import { closeSidebar } from '../../store/uiSlice.js';
import { logoutUser } from '../../store/authSlice.js';
import { cn, roleLabels } from '../../lib/utils.js';

const groups = [
  {
    label: 'Workspace',
    items: [
      { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/devices', label: 'Devices', icon: Cpu, permission: PERMISSIONS.DEVICES_READ },
      { to: '/live', label: 'Live monitor', icon: Radio, permission: PERMISSIONS.TELEMETRY_READ },
      { to: '/alerts', label: 'Alerts', icon: Bell, permission: PERMISSIONS.ALERTS_READ },
      {
        to: '/rules',
        label: 'Rule engine',
        icon: SlidersHorizontal,
        permission: PERMISSIONS.RULES_READ,
      },
      {
        to: '/simulator',
        label: 'Simulator',
        icon: Gauge,
        permission: PERMISSIONS.SIMULATOR_MANAGE,
      },
    ],
  },
  {
    label: 'Insights',
    items: [
      {
        to: '/analytics',
        label: 'Analytics',
        icon: BarChart3,
        permission: PERMISSIONS.ANALYTICS_READ,
      },
      { to: '/reports', label: 'Reports', icon: FileText, permission: PERMISSIONS.REPORTS_EXPORT },
      {
        to: '/logs',
        label: 'Logs & activity',
        icon: ScrollText,
        permission: PERMISSIONS.LOGS_READ,
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/users', label: 'Team & roles', icon: Users, permission: PERMISSIONS.USERS_READ },
      { to: '/settings', label: 'Settings', icon: Settings, permission: PERMISSIONS.SETTINGS_READ },
      {
        to: '/health',
        label: 'System health',
        icon: Activity,
        permission: PERMISSIONS.DIAGNOSTICS_READ,
      },
    ],
  },
];

function NavItem({ item, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12.5px] font-semibold transition-all duration-150',
          isActive
            ? 'bg-flame text-ink shadow-[0_8px_22px_-12px_rgba(253,133,73,0.9)]'
            : 'text-white/60 hover:bg-white/[0.07] hover:text-white'
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.3 : 1.9} aria-hidden />
          <span className="truncate">{item.label}</span>
          {item.badge > 0 && (
            <span
              className={cn(
                'ml-auto rounded-full px-1.5 py-0.5 text-[9.5px] font-extrabold',
                isActive ? 'bg-ink/15 text-ink' : 'bg-flame text-ink'
              )}
            >
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar({ alertCount = 0, unread = 0 }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const open = useSelector((state) => state.ui.sidebarOpen);
  const { user } = useAuth();

  const close = () => dispatch(closeSidebar());

  const onSignOut = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  const content = (
    <aside className="flex h-full w-[268px] shrink-0 flex-col bg-ink text-white">
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <Logo light />
        <button
          type="button"
          onClick={close}
          className="cursor-pointer rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => {
            if (can(user, PERMISSIONS.SETTINGS_READ)) navigate('/settings');
            close();
          }}
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2.5 text-left transition hover:bg-white/[0.09]"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
            <ShieldCheck className="h-3.5 w-3.5 text-gold" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[11.5px] font-bold text-white">
              NexusFlow workspace
            </span>
            <span className="block text-[9.5px] font-medium tracking-wide text-white/40 uppercase">
              {user?.role ? roleLabels[user.role] : 'Single tenant'}
            </span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-white/35" aria-hidden />
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 scrollbar-none">
        {groups.map((group) => {
          const items = group.items
            .filter((item) => !item.permission || can(user, item.permission))
            .map((item) => (item.to === '/alerts' ? { ...item, badge: alertCount } : item));
          if (!items.length) return null;
          return (
            <div key={group.label} className="mb-5">
              <p className="mb-1.5 px-3 text-[9px] font-bold tracking-[0.2em] text-white/28 uppercase">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavItem key={item.to} item={item} onNavigate={close} />
                ))}
              </div>
            </div>
          );
        })}

        <div className="mt-2 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-transparent p-3.5">
          <div className="flex items-center gap-2 text-[11px] font-bold text-white">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#44D493]" />
            Pipeline operational
          </div>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-white/45">
            {unread > 0
              ? `${unread} unread notification${unread === 1 ? '' : 's'} waiting for you.`
              : 'All caught up. Real-time streams are flowing.'}
          </p>
          <div className="mt-2.5 flex items-center gap-1.5 text-[9.5px] font-semibold tracking-wide text-white/35 uppercase">
            <span>Simulation-first</span>
            <span className="h-0.5 w-0.5 rounded-full bg-white/30" />
            <span>Hardware ready</span>
          </div>
        </div>
      </nav>

      <div className="border-t border-white/10 p-3.5">
        <div className="flex items-center gap-2.5 rounded-xl px-1 py-1">
          <Avatar name={user?.name} color={user?.avatarColor} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11.5px] font-bold text-white">{user?.name}</p>
            <p className="truncate text-[9.5px] text-white/40">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="cursor-pointer rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">{content}</div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
            onClick={close}
            aria-hidden
          />
          <div className="animate-in absolute inset-y-0 left-0 shadow-float">{content}</div>
        </div>
      )}
    </>
  );
}
