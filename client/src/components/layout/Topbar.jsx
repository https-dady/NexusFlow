import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Bell,
  ChevronDown,
  Cpu,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRound,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Avatar } from '../ui/DataDisplay.jsx';
import { Badge } from '../ui/Badge.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useDebounced } from '../../hooks/useDebounced.js';
import { useGetDeviceOptionsQuery } from '../../store/api/nexusApi.js';
import { useSocketStatus } from '../../hooks/useLiveTelemetry.js';
import { toggleSidebar, toggleNotifications } from '../../store/uiSlice.js';
import { logoutUser } from '../../store/authSlice.js';
import { cn, roleLabels } from '../../lib/utils.js';

function GlobalSearch({ className = '' }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const debounced = useDebounced(search, 250);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { data, isFetching } = useGetDeviceOptionsQuery(debounced, {
    skip: debounced.trim().length < 1,
  });
  const results = (data?.data ?? []).slice(0, 6);

  useEffect(() => {
    const onClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (deviceId) => {
    setOpen(false);
    setSearch('');
    navigate(`/devices/${deviceId}`);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && results[0]) go(results[0].deviceId);
          if (event.key === 'Escape') setOpen(false);
        }}
        placeholder="Search devices, IDs…"
        className="h-9.5 w-full rounded-xl border border-line/80 bg-white pr-12 pl-9 text-[12.5px] transition placeholder:text-muted/60 focus:border-flame focus:ring-4 focus:ring-flame/10 focus:outline-none sm:w-64 lg:w-80"
        aria-label="Search devices"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md border border-line bg-cloud px-1.5 py-0.5 text-[9px] font-semibold text-muted">
        ↵
      </kbd>
      {open && search.trim() && (
        <div className="absolute top-11 right-0 z-40 w-full min-w-[280px] overflow-hidden rounded-2xl border border-line/80 bg-white shadow-float">
          <div className="border-b border-line/60 px-3 py-2 text-[9.5px] font-bold tracking-[0.16em] text-muted uppercase">
            {isFetching
              ? 'Searching…'
              : `${results.length} device${results.length === 1 ? '' : 's'}`}
          </div>
          {results.length === 0 && !isFetching && (
            <p className="px-4 py-5 text-[12px] text-muted">No matching devices.</p>
          )}
          {results.map((device) => (
            <button
              key={device.deviceId}
              type="button"
              onClick={() => go(device.deviceId)}
              className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition hover:bg-cream"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-flame/10 text-flame-deep">
                <Cpu className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold text-ink">
                  {device.name}
                </span>
                <span className="block font-mono text-[10px] text-muted">{device.deviceId}</span>
              </span>
              <Badge tone="neutral">{device.status}</Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex cursor-pointer items-center gap-2 rounded-xl border border-transparent p-1 pr-1.5 transition hover:border-line hover:bg-white"
        aria-label="Account menu"
      >
        <Avatar name={user?.name} color={user?.avatarColor} size="sm" />
        <span className="hidden text-left sm:block">
          <span className="block max-w-28 truncate text-[11.5px] leading-tight font-bold text-ink">
            {user?.name}
          </span>
          <span className="block text-[9.5px] font-medium text-muted">
            {roleLabels[user?.role]}
          </span>
        </span>
        <ChevronDown className="hidden h-3.5 w-3.5 text-muted sm:block" aria-hidden />
      </button>
      {open && (
        <div className="animate-in absolute top-12 right-0 z-40 w-56 overflow-hidden rounded-2xl border border-line/80 bg-white p-1.5 shadow-float">
          <div className="px-3 py-2.5">
            <p className="truncate text-[12.5px] font-bold text-ink">{user?.name}</p>
            <p className="truncate text-[10.5px] text-muted">{user?.email}</p>
          </div>
          <div className="my-1 h-px bg-line/70" />
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-ink transition hover:bg-cloud"
          >
            <UserRound className="h-3.5 w-3.5 text-muted" /> Your profile
          </Link>
          <Link
            to="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-ink transition hover:bg-cloud"
          >
            <Settings className="h-3.5 w-3.5 text-muted" /> Workspace settings
          </Link>
          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              await dispatch(logoutUser());
              navigate('/login', { replace: true });
            }}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12px] font-medium text-danger transition hover:bg-danger/5"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function Topbar({ unread = 0 }) {
  const dispatch = useDispatch();
  const connected = useSocketStatus();

  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-cloud/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => dispatch(toggleSidebar())}
          className="cursor-pointer rounded-xl border border-line/70 bg-white p-2 text-ink transition hover:bg-cream lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        <GlobalSearch className="hidden flex-1 sm:block" />

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <span
            className={cn(
              'hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold md:inline-flex',
              connected
                ? 'border-success/20 bg-success/5 text-success'
                : 'border-line bg-white text-muted'
            )}
            title={connected ? 'Real-time connection active' : 'Reconnecting to live stream'}
          >
            {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {connected ? 'Live' : 'Offline'}
          </span>

          <button
            type="button"
            onClick={() => dispatch(toggleNotifications(true))}
            className="relative cursor-pointer rounded-xl border border-line/70 bg-white p-2.5 text-ink transition hover:bg-cream"
            aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-flame px-1 text-[8.5px] font-extrabold text-ink ring-2 ring-cloud">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          <div className="mx-1 hidden h-7 w-px bg-line sm:block" />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

export function MobileSearchButton() {
  return (
    <button
      type="button"
      className="cursor-pointer rounded-xl border border-line/70 bg-white p-2.5 sm:hidden"
      aria-label="Search"
      onClick={() => window.dispatchEvent(new CustomEvent('nexus:focus-search'))}
    >
      <Search className="h-4 w-4" />
    </button>
  );
}

export { GlobalSearch };
