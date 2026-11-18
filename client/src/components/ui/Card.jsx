import { cn } from '../../lib/utils.js';

export function Card({ children, className = '', as: Component = 'div', ...props }) {
  return (
    <Component
      className={cn('rounded-[1.35rem] border border-line/80 bg-white shadow-card', className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ title, description, action, className = '', eyebrow }) {
  return (
    <div
      className={cn('flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-4', className)}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-[10.5px] font-semibold tracking-[0.16em] text-muted uppercase">
            {eyebrow}
          </p>
        )}
        <h2 className="text-[15px] font-bold tracking-[-0.01em] text-ink">{title}</h2>
        {description && (
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  accent = '#FD8549',
  hint,
  trend,
  className = '',
  loading = false,
}) {
  return (
    <Card className={cn('relative overflow-hidden p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-semibold tracking-[0.16em] text-muted uppercase">
            {label}
          </p>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            {loading ? (
              <span className="shimmer block h-8 w-20 rounded-lg" />
            ) : (
              <span className="text-[28px] leading-none font-extrabold tracking-[-0.04em] text-ink">
                {value}
              </span>
            )}
            {suffix && <span className="text-[13px] font-semibold text-muted">{suffix}</span>}
          </div>
          {hint && <p className="mt-2 text-[11.5px] text-muted">{hint}</p>}
        </div>
        {Icon && (
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${accent}1a`, color: accent }}
          >
            <Icon className="h-4.5 w-4.5" strokeWidth={2.1} aria-hidden />
          </span>
        )}
      </div>
      {trend && <div className="mt-3 text-[11.5px] font-medium text-muted">{trend}</div>}
      <span
        className="pointer-events-none absolute -right-6 -bottom-8 h-20 w-20 rounded-full opacity-[0.07]"
        style={{ backgroundColor: accent }}
      />
    </Card>
  );
}

export function MiniStat({ label, value, icon: Icon, accent = '#FD8549' }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line/70 bg-cream/60 px-4 py-3">
      {Icon && (
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accent}1a`, color: accent }}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      )}
      <div>
        <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">{label}</p>
        <p className="text-[15px] font-bold tracking-tight text-ink">{value}</p>
      </div>
    </div>
  );
}
