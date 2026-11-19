import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { NotificationsPanel } from './NotificationsPanel.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useSocketBridge } from '../../hooks/useSocket.js';
import { useGetAlertSummaryQuery, useGetUnreadCountQuery } from '../../store/api/nexusApi.js';
import { LoadingScreen } from '../ui/Feedback.jsx';
import { Button } from '../ui/Button.jsx';

export function AppShell() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  useSocketBridge();
  const { data: alertSummary } = useGetAlertSummaryQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval: 30_000,
  });
  const { data: unreadData } = useGetUnreadCountQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval: 30_000,
  });

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  const alertCount = alertSummary?.active?.total ?? 0;
  const unread = unreadData?.unread ?? 0;

  return (
    <div className="flex min-h-screen bg-cloud">
      <Sidebar alertCount={alertCount} unread={unread} />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-[268px]">
        <Topbar unread={unread} />
        <main className="mx-auto w-full max-w-[1560px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
          <Outlet />
        </main>
        <footer className="mx-auto flex w-full max-w-[1560px] flex-wrap items-center justify-between gap-2 px-4 pb-5 text-[10.5px] text-muted sm:px-6 lg:px-8">
          <span>NexusFlow v1.0 · Visual IoT Telemetry &amp; Rule Engine</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> Actuators intentionally
            disabled
          </span>
        </footer>
      </div>
      <NotificationsPanel />
    </div>
  );
}

export function AuthGate({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) {
    return <Navigate to={location.state?.from || '/'} replace />;
  }
  return children;
}

export function PermissionGate({ permission, children }) {
  const { can, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!can(permission)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/8 text-danger ring-1 ring-danger/15">
          <ShieldAlert className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-xl font-extrabold tracking-tight">Access restricted</h1>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted">
          Your role does not include this permission. If you believe you should have access, ask a
          workspace administrator to review your role.
        </p>
        <Button variant="outline" className="mt-5" onClick={() => window.history.back()}>
          Go back
        </Button>
      </div>
    );
  }
  return children;
}

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="text-[11px] font-bold tracking-[0.3em] text-flame uppercase">Error 404</p>
      <h1 className="mt-3 text-5xl font-extrabold tracking-[-0.06em]">Signal lost.</h1>
      <p className="mt-3 max-w-md text-[13px] leading-relaxed text-muted">
        The page you are looking for does not exist. It may have been moved, archived, or never
        connected to the pipeline.
      </p>
      <Button className="mt-6" onClick={() => navigate('/')}>
        Return to overview
      </Button>
    </div>
  );
}
