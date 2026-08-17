'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export type CommandItem = {
  id: string;
  label: string;
  group: string;
  shortcut?: string;
  run: () => void;
};

export default function CommandPalette({
  commands,
  onClose
}: {
  commands: CommandItem[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => setHighlight(0), [query]);

  const run = (item: CommandItem) => {
    onClose();
    item.run();
  };

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
      e.preventDefault();
      run(results[highlight]);
    }
  };

  let lastGroup = '';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-28 z-[60]" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-lg w-[520px] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a command…"
          className="w-full bg-transparent px-4 py-3 text-sm outline-none border-b border-border text-text"
        />
        <ul className="max-h-80 overflow-y-auto py-1">
          {results.length === 0 && <li className="px-4 py-3 text-xs text-muted">No commands</li>}
          {results.map((item, i) => {
            const showGroup = item.group !== lastGroup;
            lastGroup = item.group;
            return (
              <li key={item.id}>
                {showGroup && (
                  <div className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted">{item.group}</div>
                )}
                <button
                  type="button"
                  className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between gap-3 ${
                    i === highlight ? 'bg-surface2 text-amber' : 'text-text hover:bg-surface2/60'
                  }`}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => run(item)}
                >
                  <span>{item.label}</span>
                  {item.shortcut && <span className="text-[10px] text-muted shrink-0">{item.shortcut}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
