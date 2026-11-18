import { forwardRef, useId } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export function Field({ label, hint, error, required, children, className = '', htmlFor }) {
  return (
    <div className={cn('min-w-0', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="mb-1.5 block text-[11px] font-semibold tracking-[0.12em] text-muted uppercase"
        >
          {label} {required && <span className="text-flame">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-[11.5px] font-medium text-danger">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">{hint}</p>
      )}
    </div>
  );
}

export const Input = forwardRef(function Input(
  { label, error, hint, className = '', containerClassName = '', id, required, ...props },
  ref
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
      htmlFor={fieldId}
    >
      <input
        ref={ref}
        id={fieldId}
        required={required}
        className={cn(
          'field',
          error && 'border-danger/60 focus:border-danger focus:ring-danger/10',
          className
        )}
        {...props}
      />
    </Field>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className = '', containerClassName = '', id, rows = 3, ...props },
  ref
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <Field label={label} hint={hint} error={error} className={containerClassName} htmlFor={fieldId}>
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        className={cn('field resize-y leading-relaxed', error && 'border-danger/60', className)}
        {...props}
      />
    </Field>
  );
});

export const Select = forwardRef(function Select(
  { label, error, hint, className = '', containerClassName = '', children, id, ...props },
  ref
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <Field label={label} hint={hint} error={error} className={containerClassName} htmlFor={fieldId}>
      <select
        ref={ref}
        id={fieldId}
        className={cn(
          'field cursor-pointer appearance-none pr-9',
          error && 'border-danger/60',
          className
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2377746d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
        }}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
});

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="field h-10 pl-9 text-[13px]"
        aria-label={placeholder}
      />
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-line/70 bg-cream/50 px-4 py-3.5 transition hover:border-line',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
    >
      <span>
        <span className="block text-[13px] font-semibold text-ink">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[11.5px] leading-relaxed text-muted">
            {description}
          </span>
        )}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          className="peer sr-only"
          checked={Boolean(checked)}
          onChange={(event) => onChange?.(event.target.checked)}
          disabled={disabled}
        />
        <span className="block h-6 w-11 rounded-full bg-[#d9d6ce] transition peer-checked:bg-flame peer-focus-visible:ring-4 peer-focus-visible:ring-flame/20" />
        <span className="pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function Checkbox({ checked, onChange, label, className = '', disabled }) {
  return (
    <label
      className={cn(
        'inline-flex cursor-pointer items-center gap-2 text-[13px]',
        disabled && 'opacity-50',
        className
      )}
    >
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange?.(event.target.checked)}
        disabled={disabled}
        className="h-4 w-4 cursor-pointer rounded border-line text-flame accent-[#FD8549]"
      />
      <span className="text-ink/80">{label}</span>
    </label>
  );
}

export function SegmentedControl({ options, value, onChange, className = '', size = 'md' }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-xl border border-line/80 bg-cloud p-1',
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'cursor-pointer rounded-lg font-semibold transition-all',
            size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-[12px]',
            value === option.value
              ? 'bg-white text-ink shadow-sm ring-1 ring-line/70'
              : 'text-muted hover:text-ink'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
