'use client';

import { PanelRight } from 'lucide-react';
import TitleDrag from '@/components/TitleDrag';

interface BacklinksData {
  tags: string[];
  backlinks: string[];
  outgoing: { label: string; path: string | null }[];
}

export default function BacklinksPanel({
  data,
  onNavigate,
  onHide
}: {
  data: BacklinksData | null;
  onNavigate: (path: string) => void;
  onHide: () => void;
}) {
  return (
    <div className="h-full flex flex-col bg-surface">
      <div className="flex items-center h-9 px-3 border-b border-border shrink-0">
        <span className="text-[11px] uppercase tracking-wider text-muted">Links</span>
        <TitleDrag className="flex-1 self-stretch min-w-[8px]" />
        <button
          onClick={onHide}
          title="Hide links (⌘⇧B)"
          className="w-6 h-6 flex items-center justify-center rounded text-muted hover:text-text hover:bg-surface2"
        >
          <PanelRight size={14} strokeWidth={1.75} />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 text-xs space-y-5">
        {!data ? (
          <p className="text-muted">Select a note to see links.</p>
        ) : (
          <>
            <section>
              <h3 className="text-muted uppercase tracking-wider text-[10px] mb-2">Tags</h3>
              {data.tags.length === 0 ? (
                <p className="text-muted">No tags</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {data.tags.map((t) => (
                    <span key={t} className="px-1.5 py-0.5 rounded bg-surface2 text-teal">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="text-muted uppercase tracking-wider text-[10px] mb-2">Links out</h3>
              {data.outgoing.length === 0 ? (
                <p className="text-muted">No outgoing links</p>
              ) : (
                <ul className="space-y-1">
                  {data.outgoing.map((l, i) => (
                    <li key={i}>
                      {l.path ? (
                        <button onClick={() => onNavigate(l.path!)} className="text-amber hover:underline">
                          {l.label}
                        </button>
                      ) : (
                        <span className="text-muted line-through" title="Unresolved link">
                          {l.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="text-muted uppercase tracking-wider text-[10px] mb-2">Linked mentions</h3>
              {data.backlinks.length === 0 ? (
                <p className="text-muted">Nothing links here yet</p>
              ) : (
                <ul className="space-y-1">
                  {data.backlinks.map((p) => (
                    <li key={p}>
                      <button onClick={() => onNavigate(p)} className="text-text hover:text-amber truncate block">
                        {p}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
