export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard:view',
  DEVICES_READ: 'devices:read',
  DEVICES_WRITE: 'devices:write',
  DEVICES_ARCHIVE: 'devices:archive',
  TELEMETRY_READ: 'telemetry:read',
  RULES_READ: 'rules:read',
  RULES_WRITE: 'rules:write',
  RULES_ARCHIVE: 'rules:archive',
  ALERTS_READ: 'alerts:read',
  ALERTS_ACT: 'alerts:act',
  ANALYTICS_READ: 'analytics:read',
  SIMULATOR_MANAGE: 'simulator:manage',
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',
  LOGS_READ: 'logs:read',
  LOGS_AUDIT: 'logs:audit',
  REPORTS_EXPORT: 'reports:export',
  DIAGNOSTICS_READ: 'diagnostics:read',
  NOTIFICATIONS_READ: 'notifications:read',
};

export const can = (user, permission) => Boolean(user?.permissions?.includes(permission));

export const canAny = (user, permissions = []) =>
  permissions.some((permission) => can(user, permission));
