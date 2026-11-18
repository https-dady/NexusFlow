import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button.jsx';
import { cn } from '../../lib/utils.js';

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className = '',
  closeOnBackdrop = true,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[1.6rem] border border-line/60 bg-white shadow-float sm:rounded-[1.6rem]',
          widths[size] ?? widths.md,
          'animate-in',
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line/70 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-[16px] font-bold tracking-[-0.02em] text-ink">{title}</h2>
            {description && (
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 cursor-pointer rounded-lg p-1.5 text-muted transition hover:bg-cloud hover:text-ink"
            aria-label="Close dialog"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line/70 bg-cloud/50 px-5 py-3.5 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children ?? (
        <p className="text-[13px] leading-relaxed text-muted">
          This action takes effect immediately. You can review the audit trail afterwards.
        </p>
      )}
    </Modal>
  );
}
