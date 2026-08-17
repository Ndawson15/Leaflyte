'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Send, X } from 'lucide-react';
import { basename } from '@/lib/paths';
import {
  AI_DROP_HOVER_EVENT,
  filterMentionFiles,
  mentionQueryAt,
  removeMentionTrigger,
  VAULT_PATH_MIME
} from '@/lib/ai/mentions';
import { isProbablyText } from '@/lib/fileKind';
import FileTypeIcon from '@/components/FileTypeIcon';

export default function AiChatInput({
  value,
  onChange,
  taggedPaths,
  onTaggedPathsChange,
  files,
  loading,
  configured,
  pendingTags,
  onPendingTagsConsumed,
  onSubmit,
  onKeyDownExtra,
  requestFocus
}: {
  value: string;
  onChange: (value: string) => void;
  taggedPaths: string[];
  onTaggedPathsChange: (paths: string[]) => void;
  files: string[];
  loading: boolean;
  configured: boolean;
  pendingTags?: string[];
  onPendingTagsConsumed?: () => void;
  onSubmit: () => void;
  onKeyDownExtra?: (e: React.KeyboardEvent) => boolean | void;
  requestFocus?: boolean;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPos, setCursorPos] = useState(0);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (requestFocus) inputRef.current?.focus();
  }, [requestFocus]);

  const syncCursor = useCallback(() => {
    if (inputRef.current) setCursorPos(inputRef.current.selectionStart);
  }, []);

  const addTag = useCallback(
    (path: string) => {
      if (!files.includes(path) || !isProbablyText(path)) return;
      if (taggedPaths.includes(path)) return;
      onTaggedPathsChange([...taggedPaths, path]);
    },
    [files, onTaggedPathsChange, taggedPaths]
  );

  const removeTag = useCallback(
    (path: string) => {
      onTaggedPathsChange(taggedPaths.filter((p) => p !== path));
    },
    [onTaggedPathsChange, taggedPaths]
  );

  useEffect(() => {
    if (!pendingTags?.length) return;
    const next = [...taggedPaths];
    for (const path of pendingTags) {
      if (files.includes(path) && isProbablyText(path) && !next.includes(path)) next.push(path);
    }
    if (next.length !== taggedPaths.length) onTaggedPathsChange(next);
    onPendingTagsConsumed?.();
    inputRef.current?.focus();
  }, [pendingTags, files, taggedPaths, onTaggedPathsChange, onPendingTagsConsumed]);

  useEffect(() => {
    const onHover = (e: Event) => {
      setDragOver(!!(e as CustomEvent<{ active: boolean }>).detail?.active);
    };
    window.addEventListener(AI_DROP_HOVER_EVENT, onHover);
    return () => window.removeEventListener(AI_DROP_HOVER_EVENT, onHover);
  }, []);

  const mention = mentionQueryAt(value, cursorPos);
  const candidates = useMemo(
    () => (mention ? filterMentionFiles(mention.query, files) : []),
    [mention, files]
  );
  const mentionOpen = mention !== null && candidates.length > 0;

  useEffect(() => {
    setMentionIndex(0);
  }, [mention?.query]);

  const selectMention = (path: string) => {
    if (!mention) return;
    addTag(path);
    const next = removeMentionTrigger(value, mention.at, cursorPos);
    onChange(next.text);
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(next.cursor, next.cursor);
      setCursorPos(next.cursor);
      inputRef.current?.focus();
    });
  };

  const readVaultPath = (dt: DataTransfer): string | null => {
    const path = dt.getData(VAULT_PATH_MIME) || dt.getData('text/plain');
    if (!path || !files.includes(path)) return null;
    return path;
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const path = readVaultPath(e.dataTransfer);
    if (path) addTag(path);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (onKeyDownExtra?.(e)) return;

    if (mentionOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % candidates.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + candidates.length) % candidates.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectMention(candidates[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        if (mention) {
          const next = removeMentionTrigger(value, mention.at, cursorPos);
          onChange(next.text);
          setCursorPos(next.cursor);
        }
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div
      data-ai-drop
      className={`shrink-0 border-t border-border p-3 transition-colors ${
        dragOver ? 'bg-amber/5 ring-1 ring-inset ring-amber/30' : ''
      }`}
      onDragEnter={(e) => {
        if (readVaultPath(e.dataTransfer)) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragOver={(e) => {
        if (readVaultPath(e.dataTransfer)) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          setDragOver(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
      }}
      onDrop={onDrop}
    >
      {taggedPaths.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {taggedPaths.map((path) => (
            <span
              key={path}
              className="inline-flex items-center gap-1 max-w-full pl-1.5 pr-1 py-0.5 rounded-full bg-surface2 border border-border text-[10px] text-text"
              title={path}
            >
              <FileTypeIcon name={basename(path)} size={12} />
              <span className="font-mono truncate max-w-[160px]">{basename(path)}</span>
              <button
                type="button"
                onClick={() => removeTag(path)}
                className="w-4 h-4 flex items-center justify-center rounded-full text-muted hover:text-text hover:bg-bg shrink-0"
                title="Remove"
              >
                <X size={10} strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative flex gap-2 items-end">
        {mentionOpen && (
          <div className="absolute bottom-full left-0 right-12 mb-1 max-h-44 overflow-y-auto rounded-md border border-border bg-surface shadow-xl z-30">
            <div className="px-3 py-1.5 border-b border-border text-[10px] uppercase tracking-wider text-muted">
              Vault files
            </div>
            <ul className="py-1">
              {candidates.map((path, i) => (
                <li key={path}>
                  <button
                    type="button"
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs ${
                      i === mentionIndex ? 'bg-surface2 text-text' : 'text-muted hover:bg-surface2 hover:text-text'
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectMention(path);
                    }}
                  >
                    <FileTypeIcon name={basename(path)} size={14} />
                    <span className="font-mono truncate">{path}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setCursorPos(e.target.selectionStart);
          }}
          onSelect={syncCursor}
          onKeyUp={syncCursor}
          onClick={syncCursor}
          onKeyDown={onKeyDown}
          rows={2}
          placeholder={
            configured
              ? 'Ask about your notes… type @ to tag a file, or drag one here'
              : 'Add an API key in Settings → AI first'
          }
          disabled={loading}
          className="flex-1 resize-none rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-muted disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading || (!value.trim() && taggedPaths.length === 0)}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-md bg-amber text-bg disabled:opacity-40 hover:opacity-90"
          title="Send (Enter)"
        >
          <Send size={15} strokeWidth={1.75} />
        </button>
      </div>
      {dragOver && (
        <p className="mt-2 text-[10px] text-amber flex items-center gap-1">
          <FileText size={12} />
          Drop to tag file for AI context
        </p>
      )}
    </div>
  );
}
