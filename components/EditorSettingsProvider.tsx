'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  loadMarkdownToolbarEnabled,
  saveMarkdownToolbarEnabled
} from '@/lib/editorSettings';

interface EditorSettingsContextValue {
  markdownToolbar: boolean;
  setMarkdownToolbar: (on: boolean) => void;
}

const EditorSettingsContext = createContext<EditorSettingsContextValue | null>(null);

export function EditorSettingsProvider({ children }: { children: React.ReactNode }) {
  const [markdownToolbar, setMarkdownToolbarState] = useState(true);

  useEffect(() => {
    setMarkdownToolbarState(loadMarkdownToolbarEnabled());
  }, []);

  const setMarkdownToolbar = (on: boolean) => {
    setMarkdownToolbarState(on);
    saveMarkdownToolbarEnabled(on);
  };

  const value = useMemo(
    () => ({ markdownToolbar, setMarkdownToolbar }),
    [markdownToolbar]
  );

  return (
    <EditorSettingsContext.Provider value={value}>{children}</EditorSettingsContext.Provider>
  );
}

export function useEditorSettings() {
  const ctx = useContext(EditorSettingsContext);
  if (!ctx) throw new Error('useEditorSettings must be used within EditorSettingsProvider');
  return ctx;
}
