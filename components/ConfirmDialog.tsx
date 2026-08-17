'use client';

interface ConfirmDialogProps {
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div
        className="w-[22rem] max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-surface p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h3 className="text-sm font-medium text-text mb-2">{title}</h3>}
        <div className="text-sm text-text">{message}</div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="px-3 py-1.5 text-[12px] text-muted hover:text-text"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-[12px] rounded ${
              danger ? 'text-red-400 hover:bg-surface2' : 'text-text hover:bg-surface2'
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
