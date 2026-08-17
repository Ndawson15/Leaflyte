'use client';

import { useEffect, useRef } from 'react';
import { markdownToHtml } from '@/lib/markdown';

export default function MarkdownPreview({
  source,
  onWikiNavigate,
  mode = 'reading'
}: {
  source: string;
  onWikiNavigate?: (target: string) => void;
  mode?: 'reading' | 'compact';
}) {
  const ref = useRef<HTMLDivElement>(null);

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
      dangerouslySetInnerHTML={{ __html: markdownToHtml(source) }}
    />
  );
}
