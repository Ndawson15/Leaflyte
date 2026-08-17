'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import FileTypeIcon from '@/components/FileTypeIcon';
import * as vault from '@/lib/vaultClient';
import type { SearchHit } from '@/lib/vaultSearch';

export default function QuickSwitcher({
  allFiles,
  onSelect,
  onClose
}: {
  allFiles: string[];
  onSelect: (path: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const reqRef = useRef(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const q = query.trim();
    const id = ++reqRef.current;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const hits = q ? await vault.searchVault(q, 25) : allFiles.slice(0, 20).map((path) => ({ path, snippet: '', score: 0 }));
        if (reqRef.current === id) {
          setResults(hits);
          setHighlight(0);
        }
      } finally {
        if (reqRef.current === id) setLoading(false);
      }
    }, q ? 120 : 0);
    return () => window.clearTimeout(timer);
  }, [query, allFiles]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    }
    if (e.key === 'Enter' && results[highlight]) {
      onSelect(results[highlight].path);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-32 z-50" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-lg w-[520px] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Search notes by name, content, or #tag…"
          className="w-full bg-transparent px-4 py-3 text-sm outline-none border-b border-border text-text"
        />
        <ul className="max-h-80 overflow-y-auto">
          {loading && results.length === 0 && (
            <li className="px-4 py-3 text-xs text-muted">Searching…</li>
          )}
          {!loading && results.length === 0 && (
            <li className="px-4 py-3 text-xs text-muted">No matches</li>
          )}
          {results.map((hit, i) => (
            <li
              key={hit.path}
              className={`px-4 py-2 text-sm cursor-pointer ${i === highlight ? 'bg-surface2 text-amber' : 'text-text'}`}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => onSelect(hit.path)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileTypeIcon name={hit.path} size={15} />
                <span className="truncate">{hit.path}</span>
              </div>
              {hit.snippet && (
                <p className={`mt-0.5 text-[11px] truncate ${i === highlight ? 'text-muted' : 'text-muted'}`}>
                  {hit.snippet}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
