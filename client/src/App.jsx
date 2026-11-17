import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppShell, AuthGate, NotFoundPage, PermissionGate } from './components/layout/AppShell.jsx';
import { LoadingScreen } from './components/ui/Feedback.jsx';
import { ToastViewport } from './components/ui/Toasts.jsx';
import { bootstrapAuth, signedOut } from './store/authSlice.js';
import { setUnauthorizedHandler } from './lib/api.js';
import { PERMISSIONS } from './lib/permissions.js';

const LoginPage = lazy(() => import('./pages/auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage.jsx'));
const InvitePage = lazy(() => import('./pages/auth/InvitePage.jsx'));

const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const DevicesPage = lazy(() => import('./pages/devices/DevicesPage.jsx'));
const DeviceDetailPage = lazy(() => import('./pages/devices/DeviceDetailPage.jsx'));
const LivePage = lazy(() => import('./pages/LivePage.jsx'));
const AlertsPage = lazy(() => import('./pages/alerts/AlertsPage.jsx'));
const RulesPage = lazy(() => import('./pages/rules/RulesPage.jsx'));
const RuleEditorPage = lazy(() => import('./pages/rules/RuleEditorPage.jsx'));
const SimulatorPage = lazy(() => import('./pages/SimulatorPage.jsx'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
const LogsPage = lazy(() => import('./pages/LogsPage.jsx'));
const UsersPage = lazy(() => import('./pages/UsersPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const HealthPage = lazy(() => import('./pages/HealthPage.jsx'));

const page = (element) => (
  <Suspense fallback={<LoadingScreen label="Loading view…" />}>{element}</Suspense>
);

export default function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      dispatch(signedOut());
      navigate('/login', { replace: true });
    });
  }, [dispatch, navigate]);

  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  return (
    <>
      <Routes>
        <Route path="/login" element={<AuthGate>{page(<LoginPage />)}</AuthGate>} />
        <Route path="/register" element={<AuthGate>{page(<RegisterPage />)}</AuthGate>} />
        <Route
          path="/forgot-password"
          element={<AuthGate>{page(<ForgotPasswordPage />)}</AuthGate>}
        />
        <Route
          path="/reset-password"
          element={<AuthGate>{page(<ResetPasswordPage />)}</AuthGate>}
        />
        <Route path="/invite" element={<AuthGate>{page(<InvitePage />)}</AuthGate>} />

        <Route path="/" element={<AppShell />}>
          <Route
            index
            element={
              <PermissionGate permission={PERMISSIONS.DASHBOARD_VIEW}>
                {page(<DashboardPage />)}
              </PermissionGate>
            }
          />
          <Route
            path="devices"
            element={
              <PermissionGate permission={PERMISSIONS.DEVICES_READ}>
                {page(<DevicesPage />)}
              </PermissionGate>
            }
          />
          <Route
            path="devices/:deviceId"
            element={
              <PermissionGate permission={PERMISSIONS.DEVICES_READ}>
                {page(<DeviceDetailPage />)}
              </PermissionGate>
            }
          />
          <Route
            path="live"
            element={
              <PermissionGate permission={PERMISSIONS.TELEMETRY_READ}>
                {page(<LivePage />)}
              </PermissionGate>
            }
          />
          <Route
            path="alerts"
            element={
              <PermissionGate permission={PERMISSIONS.ALERTS_READ}>
                {page(<AlertsPage />)}
              </PermissionGate>
            }
          />
          <Route
            path="rules"
            element={
              <PermissionGate permission={PERMISSIONS.RULES_READ}>
                {page(<RulesPage />)}
              </PermissionGate>
            }
          />
          <Route
            path="rules/new"
            element={
              <PermissionGate permission={PERMISSIONS.RULES_WRITE}>
                {page(<RuleEditorPage />)}
              </PermissionGate>
            }
          />
          <Route
            path="rules/:ruleId/edit"
            element={
              <PermissionGate permission={PERMISSIONS.RULES_WRITE}>
                {page(<RuleEditorPage />)}
              </PermissionGate>
            }
          />
          <Route
            path="simulator"
            element={
              <PermissionGate permission={PERMISSIONS.SIMULATOR_MANAGE}>
                {page(<SimulatorPage />)}
              </PermissionGate>
            }
          />
          <Route
            path="analytics"
            element={
              <PermissionGate permission={PERMISSIONS.ANALYTICS_READ}>
                {page(<AnalyticsPage />)}
              </PermissionGate>
            }
          />
          <Route
            path="reports"
            element={
              <PermissionGate permission={PERMISSIONS.REPORTS_EXPORT}>
                {page(<ReportsPage />)}
              </PermissionGate>
            }
          />
          <Route
            path="logs"
            element={
              <PermissionGate permission={PERMISSIONS.LOGS_READ}>
                {page(<LogsPage />)}
              </PermissionGate>
            }
          />
          <Route
            path="users"
            element={
              <PermissionGate permission={PERMISSIONS.USERS_READ}>
                {page(<UsersPage />)}
              </PermissionGate>
            }
          />
          <Route
            path="settings"
            element={
              <PermissionGate permission={PERMISSIONS.SETTINGS_READ}>
                {page(<SettingsPage />)}
              </PermissionGate>
            }
          />
          <Route path="profile" element={page(<ProfilePage />)} />
          <Route
            path="health"
            element={
              <PermissionGate permission={PERMISSIONS.DIAGNOSTICS_READ}>
                {page(<HealthPage />)}
              </PermissionGate>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastViewport />
    </>
  );
}
