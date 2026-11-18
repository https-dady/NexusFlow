import { AlertTriangle, Inbox, LoaderCircle, RefreshCw } from 'lucide-react';
import { cn, errorMessage } from '../../lib/utils.js';
import { Button } from './Button.jsx';

export function Spinner({ className = '' }) {
  return (
    <LoaderCircle
      className={cn('h-5 w-5 animate-spin text-flame', className)}
      aria-label="Loading"
    />
  );
}

export function LoadingScreen({ label = 'Preparing your workspace…' }) {
  return (
    <div className="flex h-full min-h-[60vh] w-full flex-col items-center justify-center gap-4">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-ink">
        <span className="absolute inset-0 animate-ping rounded-2xl bg-flame/20" />
        <span className="text-lg font-extrabold text-flame">N</span>
      </div>
      <p className="text-[12.5px] font-medium text-muted">{label}</p>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <span className={cn('shimmer block rounded-lg', className)} />;
}

export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="divide-y divide-line/50">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex items-center gap-4 px-4 py-4">
          {Array.from({ length: columns }).map((__, column) => (
            <Skeleton
              key={column}
              className={cn('h-3.5', column === 0 ? 'w-32' : column === 1 ? 'w-24' : 'flex-1')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className = '' }) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cream text-muted ring-1 ring-line/60">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="mt-4 text-[14px] font-bold text-ink">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  title = 'We could not load this view',
  className = '',
}) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/8 text-danger ring-1 ring-danger/15">
        <AlertTriangle className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="mt-4 text-[14px] font-bold text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-[12.5px] leading-relaxed text-muted">
        {errorMessage(error)}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" icon={RefreshCw} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function InlineNotice({
  tone = 'info',
  title,
  children,
  icon: Icon = AlertTriangle,
  action,
}) {
  const tones = {
    info: 'border-info/20 bg-info/5 text-info',
    success: 'border-success/20 bg-success/5 text-success',
    warning: 'border-gold/40 bg-gold/10 text-[#7d6100]',
    danger: 'border-danger/20 bg-danger/5 text-danger',
  };
  return (
    <div className={cn('flex items-start gap-3 rounded-xl border px-4 py-3', tones[tone])}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 text-[12px] leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && 'mt-0.5')}>{children}</div>
      </div>
      {action}
    </div>
  );
}
