'use client';

import { Columns2, Eye, Pencil } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { editor } from 'monaco-editor';
import MonacoSurface from '@/components/MonacoSurface';
import { MarkdownBubbleMenu, MarkdownToolbar } from '@/components/MarkdownToolbar';
import { useEditorSettings } from '@/components/EditorSettingsProvider';
import { isMarkdownLikePath, supportsReadView } from '@/lib/fileKind';
import { resolveWikiTarget } from '@/lib/wikiLinks';
import type { MarkdownViewMode } from '@/lib/themes';
import FilePreview from '@/components/FilePreview';
import FileInsertPopover from '@/components/FileInsertPopover';
import { useShortcut } from './KeymapProvider';
import TitleDrag from '@/components/TitleDrag';
import * as vault from '@/lib/vaultClient';
import { languageForPath } from '@/lib/languageMap';
import {
  insertFileEmbedForPath,
  insertWikiLinkForPath
} from '@/lib/markdownEdit';
import { VAULT_FILE_DROP_EVENT, type VaultFileDropDetail } from '@/lib/vaultDrag';

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
  onNavigate
}: EditorProps) {
  const [value, setValue] = useState(content);
  const [readSource, setReadSource] = useState(content);
  const [status, setStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
  const statusRef = useRef(status);
  statusRef.current = status;
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allFilesRef = useRef(allFiles);
  const fileContentsRef = useRef(fileContents);
  const onNavigateRef = useRef(onNavigate);
  const valueRef = useRef(value);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [monacoEditor, setMonacoEditor] = useState<editor.IStandaloneCodeEditor | null>(null);
  const editorShellRef = useRef<HTMLDivElement | null>(null);
  const [insertMenu, setInsertMenu] = useState<{
    sourcePath: string;
    clientX: number;
    clientY: number;
  } | null>(null);
  const { markdownToolbar } = useEditorSettings();
  const canRead = supportsReadView(path);
  const isMarkdown = isMarkdownLikePath(path);
  const reading = canRead && fileViewMode === 'read';
  const split = canRead && isMarkdown && fileViewMode === 'split';
  const showEditor = !reading;
  const showPreview = reading || split;
  const showMarkdownToolbar = markdownToolbar && isMarkdown && showEditor;

  allFilesRef.current = allFiles;
  fileContentsRef.current = fileContents;
  onNavigateRef.current = onNavigate;
  valueRef.current = value;

  const readVaultFile = useCallback(async (filePath: string) => {
    const cached = fileContentsRef.current[filePath];
    if (cached !== undefined) return cached;
    return vault.readFile(filePath);
  }, []);

  useEffect(() => {
    setValue(content);
    setReadSource(content);
    valueRef.current = content;
    setStatus('saved');
    editorRef.current = null;
    setMonacoEditor(null);
    setInsertMenu(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  useEffect(() => {
    if (split) setReadSource(value);
  }, [value, split]);

  useEffect(() => {
    const onVaultFileDrop = (event: Event) => {
      const detail = (event as CustomEvent<VaultFileDropDetail>).detail;
      if (detail.hostPath !== path || reading || !isMarkdown) return;
      setInsertMenu({
        sourcePath: detail.sourcePath,
        clientX: detail.clientX,
        clientY: detail.clientY
      });
    };
    window.addEventListener(VAULT_FILE_DROP_EVENT, onVaultFileDrop);
    return () => window.removeEventListener(VAULT_FILE_DROP_EVENT, onVaultFileDrop);
  }, [path, reading, isMarkdown]);

  const applyInsert = (mode: 'link' | 'embed') => {
    if (!insertMenu || !monacoEditor) return;
    const { sourcePath, clientX, clientY } = insertMenu;
    if (mode === 'link') {
      insertWikiLinkForPath(monacoEditor, sourcePath, clientX, clientY);
    } else {
      insertFileEmbedForPath(monacoEditor, sourcePath, clientX, clientY);
    }
    setInsertMenu(null);
  };

  const scheduleSave = (next: string) => {
    if (statusRef.current !== 'unsaved') setStatus('unsaved');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(next), 1500);
  };

  const doSave = async (next: string) => {
    setStatus('saving');
    await onSave(path, next);
    setStatus('saved');
  };

  const updateReadSource = (next: string) => {
    valueRef.current = next;
    setValue(next);
    setReadSource(next);
    onLiveChange(path, next);
    scheduleSave(next);
  };

  const saveNow = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    doSave(valueRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, onSave]);

  useShortcut('save', saveNow);

  const handleWikiNavigate = (target: string) => {
    const resolved = resolveWikiTarget(target, allFilesRef.current);
    if (resolved) onNavigateRef.current(resolved);
  };

  const cycleViewMode = () => {
    if (!canRead || !onFileViewModeChange) return;
    if (fileViewMode === 'edit') {
      valueRef.current = value;
      setReadSource(value);
      onFileViewModeChange(isMarkdown ? 'split' : 'read');
    } else if (fileViewMode === 'split') {
      valueRef.current = value;
      setReadSource(value);
      onFileViewModeChange('read');
    } else {
      onFileViewModeChange('edit');
    }
  };

  const viewIcon =
    fileViewMode === 'read' ? (
      <Pencil size={15} strokeWidth={1.75} />
    ) : fileViewMode === 'split' ? (
      <Eye size={15} strokeWidth={1.75} />
    ) : isMarkdown ? (
      <Columns2 size={15} strokeWidth={1.75} />
    ) : (
      <Eye size={15} strokeWidth={1.75} />
    );

  const viewTitle =
    fileViewMode === 'read'
      ? 'Switch to edit mode (⌘⇧E)'
      : fileViewMode === 'split'
        ? 'Switch to read mode (⌘⇧E)'
        : isMarkdown
          ? 'Switch to split view (⌘⇧E)'
          : 'Switch to read mode (⌘⇧E)';

  const editorPane = (
    <div
      ref={editorShellRef}
      data-editor-drop-zone
      data-editor-path={path}
      className="relative min-h-0 h-full"
    >
      {showMarkdownToolbar && (
        <MarkdownBubbleMenu editor={monacoEditor} containerRef={editorShellRef} />
      )}
      {insertMenu && (
        <FileInsertPopover
          point={{ x: insertMenu.clientX, y: insertMenu.clientY }}
          sourcePath={insertMenu.sourcePath}
          onInsertLink={() => applyInsert('link')}
          onInsertEmbed={() => applyInsert('embed')}
          onClose={() => setInsertMenu(null)}
        />
      )}
      <MonacoSurface
        key={path}
        height="100%"
        language={languageForPath(path)}
        value={value}
        onMount={(ed) => {
          editorRef.current = ed;
          setMonacoEditor(ed);
          ed.focus();
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
          readOnly: false,
          editContext: false
        }}
      />
    </div>
  );

  const previewPane = (
    <FilePreview
      path={path}
      source={split ? value : readSource}
      files={allFiles}
      readFile={readVaultFile}
      onOpenFile={(filePath) => onNavigateRef.current(filePath)}
      onSourceChange={updateReadSource}
      onWikiNavigate={handleWikiNavigate}
    />
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center h-9 px-4 border-b border-border bg-surface text-xs gap-2 shrink-0">
        <span className="text-muted truncate pointer-events-none min-w-0">{path}</span>
        <TitleDrag className="flex-1 self-stretch min-w-[12px]" />
        {canRead && onFileViewModeChange && (
          <button
            type="button"
            onClick={cycleViewMode}
            title={viewTitle}
            aria-label={viewTitle}
            className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-md ${
              reading || split
                ? 'text-amber bg-surface2'
                : 'text-muted hover:text-text hover:bg-surface2'
            }`}
          >
            {viewIcon}
          </button>
        )}
        {showEditor && (
          <span className={status === 'saved' ? 'text-teal' : status === 'saving' ? 'text-muted' : 'text-amber'}>
            {status === 'saved' ? 'saved' : status === 'saving' ? 'saving…' : 'unsaved'}
          </span>
        )}
      </div>
      {showMarkdownToolbar && <MarkdownToolbar editor={monacoEditor} />}
      <div className="flex-1 min-h-0 overflow-hidden">
        {split ? (
          <div className="flex h-full min-h-0">
            <div className="flex-1 min-w-0 border-r border-border">{editorPane}</div>
            <div className="flex-1 min-w-0 overflow-hidden">{previewPane}</div>
          </div>
        ) : reading ? (
          previewPane
        ) : (
          editorPane
        )}
      </div>
    </div>
  );
}
