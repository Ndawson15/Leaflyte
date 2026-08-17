'use client';

import { useState } from 'react';
import { Check, Eye, FilePenLine, Loader2, RotateCcw, Sparkles, X } from 'lucide-react';
import type { AiFileEdit } from '@/lib/ai/edits';
import type { AiEditStatus } from '@/lib/ai/preview';
import { basename } from '@/lib/paths';

function summarizeChange(before: string | undefined, after: string) {
  const beforeLines = before?.split('\n').length ?? 0;
  const afterLines = after.split('\n').length;
  if (before === undefined) return `New file · ${afterLines} lines`;
  if (before === after) return 'No content change';
  return `${beforeLines} → ${afterLines} lines`;
}

export default function AiEditProposal({
  edit,
  previousContent,
  status,
  onPreview,
  onDismiss,
  onOpenFile
}: {
  edit: AiFileEdit;
  previousContent?: string;
  status: AiEditStatus;
  onPreview: () => Promise<void>;
  onDismiss: () => void;
  onOpenFile?: (path: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'declined') return null;

  const preview = async () => {
    setLoading(true);
    setError(null);
    try {
      await onPreview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open preview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`mt-2 rounded-md border text-xs ${
        status === 'applied'
          ? 'border-green-500/40 bg-green-500/5'
          : status === 'previewing'
            ? 'border-amber/40 bg-amber/5'
            : 'border-border bg-surface2/50'
      }`}
    >
      <div className="flex items-start gap-2 px-3 py-2">
        <FilePenLine size={14} className="text-amber shrink-0 mt-0.5" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onOpenFile?.(edit.path)}
            className="font-mono text-[11px] text-text hover:text-amber truncate block max-w-full text-left"
            title={edit.path}
          >
            {edit.path}
          </button>
          <p className="text-[10px] text-muted mt-0.5">{summarizeChange(previousContent, edit.content)}</p>
        </div>
        {status === 'applied' ? (
          <span className="shrink-0 flex items-center gap-1 text-[10px] text-green-400 uppercase tracking-wider">
            <Check size={12} strokeWidth={2} />
            Approved
          </span>
        ) : status === 'previewing' ? (
          <span className="shrink-0 flex items-center gap-1 text-[10px] text-amber uppercase tracking-wider">
            <Eye size={12} strokeWidth={2} />
            Reviewing
          </span>
        ) : (
          <div className="shrink-0 flex items-center gap-1">
            <button
              type="button"
              onClick={preview}
              disabled={loading}
              className="px-2 py-1 rounded bg-amber text-bg text-[10px] font-medium hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : 'Preview'}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              disabled={loading}
              className="w-6 h-6 flex items-center justify-center rounded text-muted hover:text-text hover:bg-bg disabled:opacity-50"
              title="Dismiss"
            >
              <X size={12} strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>
      {error && <p className="px-3 pb-2 text-[10px] text-red-400">{error}</p>}
    </div>
  );
}

export function AiEditReviewBar({
  path,
  isActiveFile,
  onGoTo,
  onApprove,
  onDecline
}: {
  path: string;
  isActiveFile: boolean;
  onGoTo: () => void;
  onApprove: () => Promise<void>;
  onDecline: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<'approve' | 'decline' | null>(null);

  const run = async (action: 'approve' | 'decline') => {
    setBusy(action);
    try {
      if (action === 'approve') await onApprove();
      else await onDecline();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="shrink-0 flex items-center gap-3 px-4 py-2 border-b border-amber/30 bg-amber/10 text-xs">
      <Sparkles size={14} className="text-amber shrink-0" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className="text-text font-medium">AI suggested changes</p>
        <p className="text-muted truncate">
          {isActiveFile ? (
            <>Review <span className="font-mono text-text">{basename(path)}</span> below, then approve or revert.</>
          ) : (
            <>
              Preview open in editor: <span className="font-mono text-text">{path}</span>
            </>
          )}
        </p>
      </div>
      {!isActiveFile && (
        <button
          type="button"
          onClick={onGoTo}
          className="shrink-0 px-2.5 py-1 rounded border border-border bg-surface text-text hover:bg-surface2"
        >
          Open file
        </button>
      )}
      <button
        type="button"
        onClick={() => run('decline')}
        disabled={!!busy}
        className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border bg-surface text-muted hover:text-text hover:bg-surface2 disabled:opacity-50"
      >
        {busy === 'decline' ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
        Revert
      </button>
      <button
        type="button"
        onClick={() => run('approve')}
        disabled={!!busy}
        className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber text-bg font-medium hover:opacity-90 disabled:opacity-50"
      >
        {busy === 'approve' ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        Approve
      </button>
    </div>
  );
}
