'use client';

import { AlertCircle, Code2, ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import MonacoSurface from '@/components/MonacoSurface';
import { MAX_FILE_EMBED_HEIGHT, MIN_FILE_EMBED_HEIGHT } from '@/lib/fileEmbeds';
import { isProbablyText } from '@/lib/fileKind';
import { languageForPath } from '@/lib/languageMap';
import { basename } from '@/lib/paths';

const MAX_EMBED_BYTES = 2_000_000;

export default function FileEmbedBlock({
  target,
  path,
  height,
  readFile,
  onOpen,
  onHeightCommit
}: {
  target: string;
  path: string | null;
  height: number;
  readFile: (path: string) => Promise<string>;
  onOpen: (path: string) => void;
  onHeightCommit: (height: number) => void;
}) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [localHeight, setLocalHeight] = useState(height);
  const heightRef = useRef(height);
  const dragRef = useRef<{ pointerId: number; startY: number; startHeight: number } | null>(null);

  useEffect(() => {
    heightRef.current = height;
    setLocalHeight(height);
  }, [height]);

  useEffect(() => {
    let cancelled = false;
    setContent('');
    setError(null);

    if (!path) {
      setError(`File not found: ${target}`);
      return;
    }
    if (!isProbablyText(path)) {
      setError('This file type cannot be displayed as source');
      return;
    }

    void readFile(path)
      .then((source) => {
        if (cancelled) return;
        if (source.length > MAX_EMBED_BYTES) {
          setError('File is too large to preview inline');
          return;
        }
        setContent(source);
      })
      .catch(() => {
        if (!cancelled) setError('Could not read this file');
      });

    return () => {
      cancelled = true;
    };
  }, [path, readFile, target]);

  const finishResize = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    onHeightCommit(heightRef.current);
  };

  return (
    <section
      data-no-drag
      className="my-5 flex min-h-[180px] flex-col overflow-hidden rounded-lg border border-border bg-bg"
      style={{ height: localHeight }}
    >
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border bg-surface px-3 text-xs">
        <Code2 size={14} strokeWidth={1.75} className="shrink-0 text-amber" />
        <span className="min-w-0 flex-1 truncate text-text">{path ? basename(path) : target}</span>
        {path && (
          <button
            type="button"
            onClick={() => onOpen(path)}
            className="flex items-center gap-1 rounded px-1.5 py-1 text-muted hover:bg-surface2 hover:text-text"
            title={`Open ${path}`}
          >
            <ExternalLink size={12} strokeWidth={1.75} />
            Open
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1">
        {error ? (
          <div className="flex h-full items-center justify-center gap-2 px-4 text-xs text-muted">
            <AlertCircle size={14} />
            {error}
          </div>
        ) : (
          <MonacoSurface
            key={path}
            height="100%"
            language={path ? languageForPath(path) : 'plaintext'}
            value={content}
            loading={<div className="h-full bg-bg" />}
            options={{
              readOnly: true,
              domReadOnly: true,
              editContext: false,
              contextmenu: false,
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: 12,
              lineNumbersMinChars: 3,
              minimap: { enabled: false },
              folding: false,
              wordWrap: 'off',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              overviewRulerLanes: 0,
              renderLineHighlight: 'none'
            }}
          />
        )}
      </div>

      <div
        role="separator"
        aria-label="Resize embedded file"
        aria-orientation="horizontal"
        className="group flex h-2 shrink-0 cursor-row-resize items-center justify-center bg-surface"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          dragRef.current = {
            pointerId: e.pointerId,
            startY: e.clientY,
            startHeight: localHeight
          };
          e.currentTarget.setPointerCapture(e.pointerId);
          e.preventDefault();
        }}
        onPointerMove={(e) => {
          const drag = dragRef.current;
          if (!drag || drag.pointerId !== e.pointerId) return;
          const nextHeight = Math.min(
            MAX_FILE_EMBED_HEIGHT,
            Math.max(MIN_FILE_EMBED_HEIGHT, drag.startHeight + e.clientY - drag.startY)
          );
          heightRef.current = nextHeight;
          setLocalHeight(nextHeight);
          e.preventDefault();
        }}
        onPointerUp={finishResize}
        onPointerCancel={finishResize}
      >
        <span className="h-px w-8 rounded bg-border group-hover:bg-muted" />
      </div>
    </section>
  );
}
