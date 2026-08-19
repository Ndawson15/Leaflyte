'use client';

import { useEffect, useState } from 'react';

type Heading = {
  id: string;
  text: string;
  level: 2 | 3;
};

type TableOfContentsProps = {
  headings: Heading[];
};

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: [0, 0.25, 0.5, 1] }
    );

    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  const list = (
    <ul className="space-y-2">
      {headings.map((heading) => (
        <li key={heading.id}>
          <a
            href={`#${heading.id}`}
            className={`block text-sm leading-snug transition ${
              heading.level === 3 ? 'pl-3' : ''
            } ${
              activeId === heading.id
                ? 'font-medium text-accent'
                : 'text-muted hover:text-forest'
            }`}
            onClick={() => setMobileOpen(false)}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <div className="mb-6 xl:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-medium text-forest"
        >
          Page Contents
          <span className="text-muted">{mobileOpen ? '−' : '+'}</span>
        </button>
        {mobileOpen ? <div className="mt-2 rounded-lg border border-border p-4">{list}</div> : null}
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-[calc(var(--nav-height)+2rem)] w-[var(--toc-width)]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Page Contents
          </p>
          {list}
        </div>
      </aside>
    </>
  );
}
