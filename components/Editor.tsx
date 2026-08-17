'use client';

import { Eye, Pencil } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import MonacoSurface from '@/components/MonacoSurface';
import { languageForPath } from '@/lib/languageMap';
import { attachWikiLinkDecorations, ensureWikiLinkSupport } from '@/lib/wikiLinkMonaco';
import { ensureMonacoThemes, registerCustomMonacoTheme } from '@/lib/monacoThemes';
import { useTheme } from '@/components/ThemeProvider';
import { ensureCfmlLanguage } from '@/lib/cfmlMonaco';
import { supportsReadView } from '@/lib/fileKind';
import { resolveWikiTarget } from '@/lib/wikiLinks';
import type { MarkdownViewMode } from '@/lib/themes';
import FilePreview from '@/components/FilePreview';
import VaultTextEditor from '@/components/VaultTextEditor';
import { useShortcut } from './KeymapProvider';
import TitleDrag from '@/components/TitleDrag';
import * as vault from '@/lib/vaultClient';
import { isTauri } from '@/lib/vaultClient';

interface EditorProps {
  path: string;
  content: string;
  allFiles: string[];
  fileContents: Record<string, string>;
  fileViewMode?: MarkdownViewMode;
  onFileViewModeChange?: (mode: MarkdownViewMode) => void;
  onSave: (path: string, content: string) => Promise<void>;
  onLiveChange: (path: string, content: string) => void;
  onNavigate: (path: string) => void;
  onCreateLink: (path: string) => void;
}

export default function Editor({
  path,
  content,
  allFiles,
  fileContents,
  fileViewMode = 'edit',
  onFileViewModeChange,
  onSave,
  onLiveChange,
  onNavigate,
  onCreateLink
}: EditorProps) {
  const useNativeTextEditor = isTauri();
  const { themeColors, hasCustomColors, monacoTheme, theme } = useTheme();
  const [value, setValue] = useState(content);
  const [status, setStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allFilesRef = useRef(allFiles);
  const fileContentsRef = useRef(fileContents);
  const onNavigateRef = useRef(onNavigate);
  const onCreateLinkRef = useRef(onCreateLink);
  const pathRef = useRef(path);
  const valueRef = useRef(value);
  const wikiLinksRef = useRef<{ refresh: () => void; dispose: () => void } | null>(null);
  const canRead = supportsReadView(path);
  const reading = canRead && fileViewMode === 'read';

  allFilesRef.current = allFiles;
  fileContentsRef.current = fileContents;
  onNavigateRef.current = onNavigate;
  onCreateLinkRef.current = onCreateLink;
  pathRef.current = path;
  valueRef.current = value;

  const readVaultFile = useCallback(async (filePath: string) => {
    const cached = fileContentsRef.current[filePath];
    if (cached !== undefined) return cached;
    return vault.readFile(filePath);
  }, []);

  useEffect(() => {
    setValue(content);
    setStatus('saved');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  useEffect(() => {
    wikiLinksRef.current?.refresh();
  }, [allFiles]);

  useEffect(() => {
    if (!hasCustomColors) return;
    void import('monaco-editor').then((monaco) => {
      registerCustomMonacoTheme(monaco, themeColors, theme.colorScheme === 'dark');
      monaco.editor.setTheme('leaflyte-custom');
    });
  }, [hasCustomColors, themeColors, theme.colorScheme]);

  useEffect(() => {
    return () => wikiLinksRef.current?.dispose();
  }, [path]);

  const scheduleSave = (next: string) => {
    setStatus('unsaved');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(next), 1500);
  };

  const doSave = async (next: string) => {
    setStatus('saving');
    await onSave(path, next);
    setStatus('saved');
  };

  const saveNow = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    doSave(valueRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, onSave]);

  useShortcut('save', saveNow);

  const wikiContext = () => ({
    files: allFilesRef.current,
    currentPath: pathRef.current,
    navigate: (p: string) => onNavigateRef.current(p),
    createAndOpen: (p: string) => onCreateLinkRef.current(p)
  });

  const handleWikiNavigate = (target: string) => {
    const resolved = resolveWikiTarget(target, allFilesRef.current);
    if (resolved) onNavigateRef.current(resolved);
  };

  const toggleViewMode = () => {
    if (!canRead || !onFileViewModeChange) return;
    onFileViewModeChange(reading ? 'edit' : 'read');
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center h-9 px-4 border-b border-border bg-surface text-xs gap-2 shrink-0">
        <span className="text-muted truncate pointer-events-none min-w-0">{path}</span>
        <TitleDrag className="flex-1 self-stretch min-w-[12px]" />
        {canRead && onFileViewModeChange && (
          <button
            type="button"
            onClick={toggleViewMode}
            title={reading ? 'Switch to edit mode (⌘⇧E)' : 'Switch to read mode (⌘⇧E)'}
            aria-label={reading ? 'Switch to edit mode' : 'Switch to read mode'}
            className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-md ${
              reading
                ? 'text-amber bg-surface2'
                : 'text-muted hover:text-text hover:bg-surface2'
            }`}
          >
            {reading ? <Pencil size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
          </button>
        )}
        {!reading && (
          <span className={status === 'saved' ? 'text-teal' : status === 'saving' ? 'text-muted' : 'text-amber'}>
            {status === 'saved' ? 'saved' : status === 'saving' ? 'saving…' : 'unsaved'}
          </span>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {reading ? (
          <FilePreview
            path={path}
            source={value}
            readFile={readVaultFile}
            onWikiNavigate={handleWikiNavigate}
          />
        ) : useNativeTextEditor ? (
          <div className="min-h-0 h-full">
            <VaultTextEditor
              key={path}
              path={path}
              value={value}
              onChange={(next) => {
                setValue(next);
                onLiveChange(path, next);
                scheduleSave(next);
              }}
            />
          </div>
        ) : (
          <div className="min-h-0 h-full">
            <MonacoSurface
              key={path}
              height="100%"
              theme={monacoTheme}
              language={languageForPath(path)}
              value={value}
              beforeMount={(monaco) => {
                ensureMonacoThemes(monaco);
                ensureCfmlLanguage(monaco);
                ensureWikiLinkSupport(monaco, wikiContext);
                if (hasCustomColors) {
                  registerCustomMonacoTheme(monaco, themeColors, theme.colorScheme === 'dark');
                }
              }}
              onMount={(editor, monaco) => {
                if (hasCustomColors) {
                  registerCustomMonacoTheme(monaco, themeColors, theme.colorScheme === 'dark');
                  monaco.editor.setTheme('leaflyte-custom');
                }
                wikiLinksRef.current?.dispose();
                wikiLinksRef.current = attachWikiLinkDecorations(monaco, editor, wikiContext);
                editor.updateOptions({ readOnly: false, domReadOnly: false });
                const focus = () => editor.focus();
                focus();
                requestAnimationFrame(focus);
                editor.getContainerDomNode().addEventListener('mousedown', focus);
              }}
              onChange={(v) => {
                const next = v ?? '';
                setValue(next);
                onLiveChange(path, next);
                scheduleSave(next);
              }}
              loading={<div className="h-full bg-bg" />}
              options={{
                fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                fontSize: 13,
                minimap: { enabled: false },
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                links: true,
                readOnly: false
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
