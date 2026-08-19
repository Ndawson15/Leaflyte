'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { TopNav } from '@/components/docs/TopNav';
import { Sidebar } from '@/components/docs/Sidebar';
import { SearchDialog } from '@/components/docs/SearchDialog';

type DocsUiContextValue = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
};

const DocsUiContext = createContext<DocsUiContextValue | null>(null);

export function useDocsUi() {
  const ctx = useContext(DocsUiContext);
  if (!ctx) throw new Error('useDocsUi must be used within DocsShell');
  return ctx;
}

export function DocsShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      if (event.key === '/' && !isTyping && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        openSearch();
      }

      if (event.key === 'Escape') {
        setSearchOpen(false);
        setSidebarOpen(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openSearch]);

  return (
    <DocsUiContext.Provider
      value={{ sidebarOpen, setSidebarOpen, searchOpen, openSearch, closeSearch }}
    >
      <div className="min-h-screen bg-bg">
        <TopNav />
        <div className="docs-layout">
          <Sidebar />
          <div className="min-w-0 flex-1 px-6 py-8 lg:px-10 xl:px-12">{children}</div>
        </div>
        {sidebarOpen ? (
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-black/20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}
        <SearchDialog open={searchOpen} onClose={closeSearch} />
      </div>
    </DocsUiContext.Provider>
  );
}
