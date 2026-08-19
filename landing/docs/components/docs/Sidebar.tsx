'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DOCS_NAV, isSectionActive, slugToHref } from '@/lib/nav';
import { useDocsUi } from '@/components/docs/DocsShell';

const STORAGE_KEY = 'leaflyte.docs.sidebar';

function getInitialExpanded(): Record<string, boolean> {
  const defaults: Record<string, boolean> = {};
  for (const section of DOCS_NAV) {
    defaults[section.title] = true;
  }
  if (typeof window === 'undefined') return defaults;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaults;
    return { ...defaults, ...JSON.parse(stored) };
  } catch {
    return defaults;
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useDocsUi();
  const currentSlug = pathname.replace(/^\//, '').replace(/\/$/, '') || 'home';

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(DOCS_NAV.map((s) => [s.title, true]))
  );

  useEffect(() => {
    setExpanded(getInitialExpanded());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expanded));
    } catch {
      /* ignore */
    }
  }, [expanded]);

  const activeParents = useMemo(() => {
    const parents = new Set<string>();
    for (const section of DOCS_NAV) {
      if (isSectionActive(section, currentSlug)) parents.add(section.title);
    }
    return parents;
  }, [currentSlug]);

  function toggleSection(title: string) {
    setExpanded((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  return (
    <aside
      className={`fixed inset-y-[var(--nav-height)] left-0 z-50 w-[var(--sidebar-width)] -translate-x-full overflow-y-auto border-r border-border bg-surface px-4 py-5 transition-transform lg:static lg:z-0 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : ''
      }`}
    >
      <button
        type="button"
        className="mb-5 flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm font-medium text-forest"
      >
        Documentation
        <ChevronDown size={14} className="text-muted" />
      </button>

      <nav aria-label="Documentation">
        <ul className="space-y-4">
          {DOCS_NAV.map((section) => {
            const isOpen = expanded[section.title] ?? true;
            const parentActive = activeParents.has(section.title);

            return (
              <li key={section.title}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className={`flex w-full items-center justify-between py-1 text-left text-sm font-medium transition ${
                    parentActive ? 'text-forest' : 'text-muted hover:text-forest'
                  }`}
                >
                  <span>{section.title}</span>
                  <ChevronDown
                    size={14}
                    className={`text-muted transition ${isOpen ? 'rotate-0' : '-rotate-90'}`}
                  />
                </button>

                {isOpen ? (
                  <ul className="mt-1 space-y-0.5 pl-1">
                    {(section.children ?? []).map((item) => {
                      if (!item.slug) return null;
                      const active = item.slug === currentSlug;
                      return (
                        <li key={item.slug}>
                          <Link
                            href={slugToHref(item.slug)}
                            onClick={() => setSidebarOpen(false)}
                            className={`block rounded-md px-2 py-1.5 text-sm transition ${
                              active
                                ? 'font-medium text-accent'
                                : 'text-muted hover:text-forest'
                            }`}
                          >
                            {item.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
