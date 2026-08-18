'use client';

import { Braces, Link2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { basename } from '@/lib/paths';
import { wikiLinkTargetForPath } from '@/lib/markdownEdit';

function clampPoint(x: number, y: number, width: number, height: number) {
  const margin = 8;
  return {
    left: Math.max(margin, Math.min(x, window.innerWidth - width - margin)),
    top: Math.max(margin, Math.min(y, window.innerHeight - height - margin))
  };
}

export default function FileInsertPopover({
  point,
  sourcePath,
  onInsertLink,
  onInsertEmbed,
  onClose
}: {
  point: { x: number; y: number };
  sourcePath: string;
  onInsertLink: () => void;
  onInsertEmbed: () => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: point.y, left: point.x });
  const fileName = basename(sourcePath);
  const linkPreview = wikiLinkTargetForPath(sourcePath);

  useLayoutEffect(() => {
    const panel = panelRef.current?.getBoundingClientRect();
    setCoords(clampPoint(point.x, point.y, panel?.width ?? 220, panel?.height ?? 120));
  }, [point.x, point.y]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      onClose();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onPointer);
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[200] w-[220px] rounded-lg border border-border bg-surface shadow-xl pointer-events-auto"
      style={{ top: coords.top, left: coords.left }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="px-3 py-2 border-b border-border">
        <div className="text-[10px] uppercase tracking-wider text-muted">Insert file</div>
        <div className="text-xs text-text font-medium mt-0.5 truncate" title={sourcePath}>
          {fileName}
        </div>
      </div>
      <div className="py-1">
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onInsertLink}
          className="w-full px-3 py-2 flex items-center gap-2 text-left text-xs text-text hover:bg-surface2 transition-colors"
        >
          <Link2 size={14} strokeWidth={1.75} className="shrink-0 text-muted" />
          <span>
            Insert as link
            <span className="block text-[10px] text-muted mt-0.5 font-mono">{`[[${linkPreview}]]`}</span>
          </span>
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onInsertEmbed}
          className="w-full px-3 py-2 flex items-center gap-2 text-left text-xs text-text hover:bg-surface2 transition-colors"
        >
          <Braces size={14} strokeWidth={1.75} className="shrink-0 text-muted" />
          <span>
            Insert as embed
            <span className="block text-[10px] text-muted mt-0.5 font-mono truncate">{`![[${sourcePath}]]`}</span>
          </span>
        </button>
      </div>
    </div>,
    document.body
  );
}
