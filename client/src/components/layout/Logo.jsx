import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils.js';

export function Logo({ compact = false, light = false, className = '', to = '/' }) {
  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-flame shadow-[0_8px_20px_-10px_rgba(253,133,73,0.9)]">
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" aria-hidden>
          <path
            d="M4 18V6.6c0-.9 1.1-1.35 1.75-.7L18 18.2c.65.65 1.75.2 1.75-.7V6"
            stroke="#000"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'text-[16px] font-extrabold tracking-[-0.04em]',
              light ? 'text-white' : 'text-ink'
            )}
          >
            NexusFlow
          </span>
          <span
            className={cn(
              'mt-1 text-[8.5px] font-semibold tracking-[0.22em] uppercase',
              light ? 'text-white/45' : 'text-muted'
            )}
          >
            Telemetry OS
          </span>
        </span>
      )}
    </span>
  );

  if (!to) return content;
  return (
    <Link to={to} className="inline-flex shrink-0 items-center" aria-label="NexusFlow home">
      {content}
    </Link>
  );
}
