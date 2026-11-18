import { LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/utils.js';

const variants = {
  primary:
    'bg-ink text-white hover:bg-ink-soft active:scale-[0.985] shadow-[0_10px_24px_-14px_rgba(0,0,0,0.8)]',
  accent:
    'bg-flame text-ink hover:bg-flame-deep hover:text-white active:scale-[0.985] shadow-[0_10px_24px_-14px_rgba(253,133,73,0.8)]',
  gold: 'bg-gold text-ink hover:brightness-95 active:scale-[0.985]',
  outline: 'border border-line bg-white text-ink hover:border-ink/30 hover:bg-cloud',
  ghost: 'text-ink hover:bg-ink/[0.055]',
  soft: 'bg-mist text-ink hover:bg-[#e8e9eb]',
  danger: 'bg-danger text-white hover:brightness-95',
  'danger-soft': 'bg-danger/10 text-danger hover:bg-danger/15',
};

const sizes = {
  sm: 'h-8.5 px-3 text-[12.5px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-[13px] gap-2 rounded-xl',
  lg: 'h-11.5 px-5 text-sm gap-2 rounded-xl',
  icon: 'h-9.5 w-9.5 rounded-xl',
  'icon-sm': 'h-8 w-8 rounded-lg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled,
  icon: Icon,
  iconRight: IconRight,
  as: Component = 'button',
  type = 'button',
  ...props
}) {
  return (
    <Component
      type={Component === 'button' ? type : undefined}
      disabled={Component === 'button' ? disabled || loading : undefined}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center font-semibold whitespace-nowrap transition-all duration-150 select-none disabled:pointer-events-none disabled:opacity-45',
        variants[variant] ?? variants.primary,
        sizes[size] ?? sizes.md,
        className
      )}
      {...props}
    >
      {loading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        Icon && (
          <Icon className={cn('shrink-0', size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')} aria-hidden />
        )
      )}
      {children}
      {IconRight && !loading && (
        <IconRight
          className={cn('shrink-0', size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')}
          aria-hidden
        />
      )}
    </Component>
  );
}
