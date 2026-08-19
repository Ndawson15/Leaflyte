'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { slugToHref } from '@/lib/nav';

type SearchEntry = {
  title: string;
  slug: string;
  description: string;
  headings: string[];
  excerpt: string;
};

type SearchDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;

    fetch('/docs/search-index.json')
      .then((res) => res.json())
      .then((data: SearchEntry[]) => {
        setEntries(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [open, loaded]);

  useEffect(() => {
    if (open) {
      setQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const fuse = useMemo(
    () =>
      new Fuse(entries, {
        keys: [
          { name: 'title', weight: 0.45 },
          { name: 'headings', weight: 0.25 },
          { name: 'description', weight: 0.15 },
          { name: 'excerpt', weight: 0.15 },
        ],
        threshold: 0.35,
        includeScore: true,
      }),
    [entries]
  );

  const results = query.trim() ? fuse.search(query.trim()).slice(0, 8) : [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/30 px-4 pt-[12vh] backdrop-blur-sm">
      <button type="button" aria-label="Close search" className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search size={18} className="text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search or jump to…"
            className="flex-1 bg-transparent text-base text-text outline-none placeholder:text-muted"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted transition hover:bg-accent-soft hover:text-forest"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {!query.trim() ? (
            <p className="px-3 py-6 text-sm text-muted">
              Type to search titles, headings, and excerpts. Press <kbd className="rounded border border-border px-1">/</kbd> anytime to open search.
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-6 text-sm text-muted">No results for “{query}”.</p>
          ) : (
            <ul>
              {results.map(({ item }) => (
                <li key={item.slug}>
                  <Link
                    href={slugToHref(item.slug)}
                    onClick={onClose}
                    className="block rounded-xl px-3 py-3 transition hover:bg-accent-soft/70"
                  >
                    <p className="font-medium text-forest">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{item.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
