'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import FileEmbedBlock from '@/components/FileEmbedBlock';
import {
  findFileEmbeds,
  resolveFileEmbedPath,
  updateFileEmbedHeight
} from '@/lib/fileEmbeds';
import { markdownToHtml } from '@/lib/markdown';

export default function MarkdownPreview({
  path,
  source,
  files,
  readFile,
  onOpenFile,
  onSourceChange,
  onWikiNavigate,
  mode = 'reading'
}: {
  path: string;
  source: string;
  files: string[];
  readFile: (path: string) => Promise<string>;
  onOpenFile: (path: string) => void;
  onSourceChange: (source: string) => void;
  onWikiNavigate?: (target: string) => void;
  mode?: 'reading' | 'compact';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const embeds = findFileEmbeds(source);
  const content: ReactNode[] = [];
  let cursor = 0;

  for (const embed of embeds) {
    const markdown = source.slice(cursor, embed.index);
    if (markdown.trim()) {
      content.push(
        <div key={`markdown-${embed.index}`} dangerouslySetInnerHTML={{ __html: markdownToHtml(markdown) }} />
      );
    }
    const resolvedPath = resolveFileEmbedPath(path, embed.target, files);
    content.push(
      <FileEmbedBlock
        key={`embed-${embed.index}-${embed.target}`}
        target={embed.target}
        path={resolvedPath}
        height={embed.height}
        readFile={readFile}
        onOpen={onOpenFile}
        onHeightCommit={(height) => onSourceChange(updateFileEmbedHeight(source, embed, height))}
      />
    );
    cursor = embed.index + embed.length;
  }

  const remaining = source.slice(cursor);
  if (remaining.trim() || content.length === 0) {
    content.push(
      <div key="markdown-end" dangerouslySetInnerHTML={{ __html: markdownToHtml(remaining) }} />
    );
  }

  useEffect(() => {
    const el = ref.current;
    if (!el || !onWikiNavigate) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[data-wiki]') as HTMLAnchorElement | null;
      if (!a) return;
      e.preventDefault();
      const target = a.dataset.wiki;
      if (target) onWikiNavigate(target);
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [onWikiNavigate]);

  return (
    <div
      ref={ref}
      className={`markdown-preview h-full overflow-y-auto text-[15px] leading-relaxed text-text ${
        mode === 'reading' ? 'px-10 py-8 max-w-3xl mx-auto' : 'px-6 py-4 text-sm'
      }`}
    >
      {content}
    </div>
  );
}
