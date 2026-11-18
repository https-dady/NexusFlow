import { cn, severityTone, statusTone, titleCase } from '../../lib/utils.js';

const tones = {
  neutral: 'bg-mist text-[#5c5952] ring-[#e3e1da]',
  success: 'bg-[#e9f5ef] text-[#15724a] ring-[#c9e8da]',
  danger: 'bg-[#fceae7] text-[#b53a2e] ring-[#f6d4ce]',
  gold: 'bg-[#fff5d9] text-[#8a6400] ring-[#f5e4b2]',
  info: 'bg-[#edf1f6] text-[#48617e] ring-[#d9e1eb]',
  flame: 'bg-[#fff0e7] text-[#b65118] ring-[#fad9c4]',
  dark: 'bg-ink text-white ring-ink',
};

export function Badge({ children, tone = 'neutral', dot = false, className = '', icon: Icon }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset',
        tones[tone] ?? tones.neutral,
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {Icon && <Icon className="h-3 w-3" aria-hidden />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className, dot = true }) {
  return (
    <Badge tone={statusTone(status)} dot={dot} className={className}>
      {titleCase(status ?? 'unknown')}
    </Badge>
  );
}

export function SeverityBadge({ severity, className }) {
  return (
    <Badge tone={severityTone(severity)} dot className={className}>
      {titleCase(severity ?? 'info')}
    </Badge>
  );
}

export function RoleBadge({ role, label }) {
  const map = { super_admin: 'dark', admin: 'flame', operator: 'gold', viewer: 'neutral' };
  return <Badge tone={map[role] ?? 'neutral'}>{label ?? titleCase(role)}</Badge>;
}
