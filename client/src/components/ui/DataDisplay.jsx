import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, initials } from '../../lib/utils.js';
import { Button } from './Button.jsx';

export function Avatar({ name, color = '#FD8549', size = 'md', className = '' }) {
  const sizes = {
    xs: 'h-6 w-6 text-[9px]',
    sm: 'h-8 w-8 text-[10px]',
    md: 'h-9.5 w-9.5 text-[11px]',
    lg: 'h-12 w-12 text-sm',
    xl: 'h-16 w-16 text-lg',
  };
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-white/60',
        sizes[size] ?? sizes.md,
        className
      )}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function PageHeader({ eyebrow, title, description, actions, className = '', children }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[10.5px] font-bold tracking-[0.2em] text-flame uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[26px] leading-[1.1] font-extrabold tracking-[-0.045em] text-ink sm:text-[30px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">{description}</p>
        )}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Pagination({ meta, onPageChange, className = '' }) {
  if (!meta) return null;
  const { page = 1, totalPages = 1, total = 0, limit = 20 } = meta;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(total, page * limit);
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 px-4 py-3.5', className)}>
      <p className="text-[11.5px] text-muted">
        Showing <span className="font-semibold text-ink">{start}</span>–
        <span className="font-semibold text-ink">{end}</span> of{' '}
        <span className="font-semibold text-ink">{total}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-16 text-center text-[11.5px] font-semibold text-muted">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function Tabs({ tabs, value, onChange, className = '' }) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 overflow-x-auto border-b border-line/70 scrollbar-none',
        className
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative flex cursor-pointer items-center gap-1.5 px-3.5 py-2.5 text-[12.5px] font-semibold whitespace-nowrap transition-colors',
              active ? 'text-ink' : 'text-muted hover:text-ink'
            )}
          >
            {tab.icon && <tab.icon className="h-3.5 w-3.5" aria-hidden />}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  active ? 'bg-flame/15 text-flame-deep' : 'bg-mist text-muted'
                )}
              >
                {tab.count}
              </span>
            )}
            {active && (
              <span className="absolute right-2 -bottom-px left-2 h-0.5 rounded-full bg-flame" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ProgressBar({ value, max = 100, tone = '#FD8549', className = '', label }) {
  const pct = Math.max(0, Math.min(100, (Number(value) / Number(max || 1)) * 100));
  return (
    <div className={className}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span className="font-medium text-muted">{label}</span>
          <span className="font-semibold text-ink">{Math.round(pct)}%</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-mist">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: tone }}
        />
      </div>
    </div>
  );
}

export function DataRow({ label, value, className = '' }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 py-2.5 text-[12.5px]', className)}>
      <span className="text-muted">{label}</span>
      <span className="text-right font-semibold text-ink">{value ?? '—'}</span>
    </div>
  );
}

export function MetricTile({ label, value, unit, tone = '#FD8549', loading = false }) {
  return (
    <div className="rounded-xl border border-line/70 bg-white px-3.5 py-3">
      <p className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">{label}</p>
      {loading ? (
        <span className="shimmer mt-1.5 block h-5 w-14 rounded" />
      ) : (
        <p
          className="mt-0.5 text-[18px] leading-tight font-extrabold tracking-tight"
          style={{ color: tone }}
        >
          {value}
          {unit && <span className="ml-0.5 text-[11px] font-semibold text-muted">{unit}</span>}
        </p>
      )}
    </div>
  );
}
