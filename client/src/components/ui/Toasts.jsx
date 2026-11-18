import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { dismissToast } from '../../store/uiSlice.js';
import { cn } from '../../lib/utils.js';

const toneMeta = {
  success: {
    icon: CheckCircle2,
    ring: 'ring-success/20',
    color: 'text-success',
    bar: 'bg-success',
  },
  danger: { icon: AlertTriangle, ring: 'ring-danger/20', color: 'text-danger', bar: 'bg-danger' },
  warning: { icon: AlertTriangle, ring: 'ring-gold/30', color: 'text-[#8a6400]', bar: 'bg-gold' },
  info: { icon: Info, ring: 'ring-info/20', color: 'text-info', bar: 'bg-info' },
};

function Toast({ toast }) {
  const dispatch = useDispatch();
  const meta = toneMeta[toast.tone] ?? toneMeta.info;
  const Icon = meta.icon;

  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), toast.duration ?? 4200);
    return () => clearTimeout(timer);
  }, [dispatch, toast]);

  return (
    <div
      role="status"
      className={cn(
        'animate-in pointer-events-auto flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-2xl border border-line/70 bg-white p-4 shadow-float ring-1',
        meta.ring
      )}
    >
      <span className={cn('mt-0.5 shrink-0', meta.color)}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-bold text-ink">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 line-clamp-3 text-[11.5px] leading-relaxed text-muted">
            {toast.message}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => dispatch(dismissToast(toast.id))}
        className="cursor-pointer rounded-md p-1 text-muted transition hover:bg-cloud hover:text-ink"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <span className={cn('absolute bottom-0 left-0 h-0.5', meta.bar)} />
    </div>
  );
}

export function ToastViewport() {
  const toasts = useSelector((state) => state.ui.toasts);
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[70] flex w-full max-w-sm flex-col items-end gap-2.5 sm:right-6 sm:bottom-6">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
