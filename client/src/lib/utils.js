import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNowStrict, isToday, isYesterday, parseISO } from 'date-fns';

export const cn = (...inputs) => twMerge(clsx(inputs));

export const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : parseISO(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDateTime = (value, pattern = 'd MMM yyyy, HH:mm') => {
  const date = toDate(value);
  return date ? format(date, pattern) : '—';
};

export const formatTime = (value) => formatDateTime(value, 'HH:mm:ss');

export const formatDay = (value) => formatDateTime(value, 'd MMM');

export const relativeTime = (value) => {
  const date = toDate(value);
  if (!date) return '—';
  return `${formatDistanceToNowStrict(date)} ago`;
};

export const smartTime = (value) => {
  const date = toDate(value);
  if (!date) return '—';
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return `Yesterday, ${format(date, 'HH:mm')}`;
  return format(date, 'd MMM, HH:mm');
};

export const formatNumber = (value, options = {}) => {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
    notation: Math.abs(number) >= 100_000 ? 'compact' : 'standard',
    ...options,
  }).format(number);
};

export const formatMetric = (value, precision = 1) => {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return number.toLocaleString('en-US', {
    maximumFractionDigits: precision,
    minimumFractionDigits: 0,
  });
};

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'NF';

export const titleCase = (value = '') =>
  String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const percent = (value, total) => {
  const a = Number(value);
  const b = Number(total);
  if (!b) return 0;
  return Math.round((a / b) * 100);
};

export const truncate = (value = '', length = 80) =>
  value.length > length ? `${value.slice(0, length - 1)}…` : value;

export const statusTone = (status) =>
  ({
    online: 'success',
    good: 'success',
    healthy: 'success',
    running: 'success',
    warning: 'gold',
    stale: 'gold',
    maintenance: 'info',
    offline: 'neutral',
    stopped: 'neutral',
    paused: 'gold',
    critical: 'danger',
    open: 'danger',
    acknowledged: 'gold',
    resolved: 'neutral',
    error: 'danger',
    info: 'info',
    triggered: 'danger',
    suppressed: 'neutral',
    active: 'success',
    suspended: 'danger',
    invited: 'gold',
  })[status] ?? 'neutral';

export const severityTone = (severity) =>
  ({ critical: 'danger', warning: 'gold', info: 'info' })[severity] ?? 'neutral';

export const localeDateInput = (date = new Date()) => {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 16);
};

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const filenameFromDisposition = (header, fallback) => {
  if (!header) return fallback;
  const match = /filename="?([^"]+)"?/i.exec(header);
  return match?.[1] ?? fallback;
};

export const errorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error?.data?.error?.message ?? error?.message ?? fallback;

export const deviceTypeMeta = {
  temperature_humidity: { label: 'Climate', short: 'TH', accent: '#FD8549' },
  energy_meter: { label: 'Energy', short: 'EM', accent: '#FFC123' },
  pressure_sensor: { label: 'Pressure', short: 'PS', accent: '#4F6B8C' },
  air_quality: { label: 'Air quality', short: 'AQ', accent: '#1F8A5B' },
  custom: { label: 'Custom', short: 'CU', accent: '#DDBD72' },
};

export const roleLabels = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  operator: 'Operator',
  viewer: 'Viewer',
};

export const severityLabels = { info: 'Info', warning: 'Warning', critical: 'Critical' };

export const secondsToReadable = (seconds) => {
  const value = Number(seconds);
  if (!Number.isFinite(value)) return '—';
  if (value < 60) return `${Math.round(value)}s`;
  if (value < 3600) return `${Math.round(value / 60)}m`;
  if (value < 86_400) return `${(value / 3600).toFixed(1)}h`;
  return `${(value / 86_400).toFixed(1)}d`;
};

export const isValidUrl = (value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};
