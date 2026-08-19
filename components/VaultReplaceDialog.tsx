'use client';

import { useEffect, useRef, useState } from 'react';
import {
  applyReplace,
  parseSearchQuery,
  previewVaultReplace,
  type ReplacePreview
} from '@/lib/vaultSearch';
import * as vault from '@/lib/vaultClient';

export default function VaultReplaceDialog({
  allFiles,
  onClose,
  onApplied
}: {
  allFiles: string[];
  onClose: () => void;
  onApplied?: (paths: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [previews, setPreviews] = useState<ReplacePreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const findRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    findRef.current?.focus();
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setPreviews([]);
      setError(null);
      return;
    }
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const { previews: next, error: err } = await previewVaultReplace(
          q,
          replacement,
          allFiles,
          (path) => vault.readFile(path)
        );
        setError(err);
        setPreviews(next);
        setSelected(Object.fromEntries(next.map((p) => [p.path, true])));
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query, replacement, allFiles]);

  const applySelected = async () => {
    const paths = previews.filter((p) => selected[p.path]).map((p) => p.path);
    if (paths.length === 0) return;
    setApplying(true);
    const parsed = parseSearchQuery(query);
    const done: string[] = [];
    try {
      for (const path of paths) {
        const content = await vault.readFile(path);
        const { next, count } = applyReplace(content, parsed, replacement);
        if (count === 0) continue;
        await vault.writeFile(path, next);
        done.push(path);
      }
      onApplied?.(done);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Replace failed');
    } finally {
      setApplying(false);
    }
  };

  const selectedCount = previews.filter((p) => selected[p.path]).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-24 z-[60]" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-lg w-[560px] max-h-[80vh] shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm text-text font-medium">Find and replace in vault</h2>
          <p className="text-[11px] text-muted mt-1">
            Supports <code className="text-muted">ext:ts</code>, <code className="text-muted">path:src/</code>,{' '}
            <code className="text-muted">/regex/</code>. Confirm each file before writing.
          </p>
        </div>
        <div className="px-4 py-3 space-y-2 border-b border-border">
          <input
            ref={findRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find — e.g. TODO ext:ts or /foo.+/i"
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-muted font-mono"
          />
          <input
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder="Replace with"
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-muted font-mono"
          />
        </div>
        <ul className="flex-1 overflow-y-auto min-h-[12rem]">
          {loading && <li className="px-4 py-3 text-xs text-muted">Scanning…</li>}
          {error && <li className="px-4 py-3 text-xs text-amber">{error}</li>}
          {!loading && !error && query.trim() && previews.length === 0 && (
            <li className="px-4 py-3 text-xs text-muted">No matches</li>
          )}
          {previews.map((p) => (
            <li key={p.path} className="flex items-start gap-3 px-4 py-2 border-b border-border/60">
              <input
                type="checkbox"
                checked={Boolean(selected[p.path])}
                onChange={(e) => setSelected((s) => ({ ...s, [p.path]: e.target.checked }))}
                className="mt-1 accent-[var(--cv-amber)]"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-text truncate">{p.path}</div>
                <div className="text-[11px] text-muted truncate mt-0.5">
                  {p.count} match{p.count === 1 ? '' : 'es'} · {p.preview}
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border">
          <span className="text-[11px] text-muted">
            {selectedCount} of {previews.length} file{previews.length === 1 ? '' : 's'} selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-sm text-muted hover:text-text"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={applying || selectedCount === 0}
              onClick={applySelected}
              className="px-3 py-1.5 rounded-md text-sm bg-amber text-bg font-medium disabled:opacity-50"
            >
              {applying ? 'Replacing…' : `Replace in ${selectedCount}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
