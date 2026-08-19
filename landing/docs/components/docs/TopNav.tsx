'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search } from 'lucide-react';
import { GITHUB_URL, GET_STARTED_URL, TOP_NAV_TABS } from '@/lib/nav';
import { useDocsUi } from '@/components/docs/DocsShell';

export function TopNav() {
  const pathname = usePathname();
  const { openSearch, setSidebarOpen } = useDocsUi();

  return (
    <header className="sticky top-0 z-50 h-[var(--nav-height)] border-b border-border bg-surface">
      <div className="mx-auto flex h-full max-w-[1400px] items-center gap-6 px-5 lg:px-8">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-gray-50 lg:hidden"
          aria-label="Open navigation"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={20} />
        </button>

        <a href="/" className="inline-flex shrink-0 items-center gap-2 font-semibold text-forest">
          <img src="/docs/assets/leaflyte.png" alt="" width={24} height={24} className="rounded" />
          <span>Leaflyte</span>
        </a>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Documentation sections">
          {TOP_NAV_TABS.map((tab) => {
            const active =
              tab.matchPrefix === '__docs__'
                ? !pathname.startsWith('/guides') &&
                  !pathname.startsWith('/changelog') &&
                  !pathname.startsWith('/troubleshooting/faq')
                : tab.matchPrefix
                  ? pathname.startsWith(tab.matchPrefix)
                  : pathname === tab.href;
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={`text-sm transition ${
                  active ? 'font-semibold text-forest' : 'text-muted hover:text-forest'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={openSearch}
            className="hidden min-w-[240px] items-center gap-2 rounded-full border border-border bg-[#f9fafb] px-4 py-2 text-left text-sm text-muted transition hover:border-gray-300 md:flex"
          >
            <Search size={15} className="shrink-0" />
            <span className="flex-1 truncate">Search or jump to..</span>
            <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[11px] font-medium text-muted">
              /
            </kbd>
          </button>

          <button
            type="button"
            onClick={openSearch}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-gray-50 md:hidden"
            aria-label="Search documentation"
          >
            <Search size={18} />
          </button>

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden text-sm text-muted hover:text-forest sm:inline"
          >
            GitHub
          </a>

          <Link
            href={GET_STARTED_URL}
            className="inline-flex h-9 items-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
