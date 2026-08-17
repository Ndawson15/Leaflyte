'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, Loader2, MessageSquarePlus, Sparkles, Trash2, X } from 'lucide-react';
import { sendAiChat, type ChatMessage } from '@/lib/ai/chat';
import { buildVaultContext } from '@/lib/ai/context';
import {
  buildSession,
  createChatId,
  deleteSession,
  formatChatWhen,
  loadChatStore,
  saveChatStore,
  upsertSession,
  type AiChatSession
} from '@/lib/ai/history';
import { useAi } from '@/components/AiProvider';
import * as vault from '@/lib/vaultClient';
import { splitAssistantContent } from '@/lib/ai/edits';
import AiEditProposal from '@/components/AiEditProposal';
import AiChatInput from '@/components/AiChatInput';
import { collectTaggedPaths } from '@/lib/ai/mentions';
import type { AiEditStatus } from '@/lib/ai/preview';
import { basename } from '@/lib/paths';
import FileTypeIcon from '@/components/FileTypeIcon';

export default function AiChat({
  open,
  onClose,
  files,
  activePath,
  contents,
  onOpenSettings,
  onPreviewFileEdit,
  onOpenFile,
  pendingTags,
  onPendingTagsConsumed,
  editStates,
  onEditState
}: {
  open: boolean;
  onClose: () => void;
  files: string[];
  activePath: string | null;
  contents: Record<string, string>;
  onOpenSettings: () => void;
  onPreviewFileEdit: (editKey: string, path: string, content: string) => Promise<void>;
  onOpenFile?: (path: string) => void;
  pendingTags?: string[];
  onPendingTagsConsumed?: () => void;
  editStates: Record<string, AiEditStatus>;
  onEditState: (key: string, status: AiEditStatus) => void;
}) {
  const { config, configured } = useAi();
  const [input, setInput] = useState('');
  const [taggedPaths, setTaggedPaths] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<AiChatSession[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const hydratedRef = useRef(false);

  const persist = useCallback((id: string | null, nextMessages: ChatMessage[]) => {
    if (!id || nextMessages.length === 0) return;
    setSessions((list) => {
      const existing = list.find((s) => s.id === id);
      const session = buildSession(id, nextMessages, existing);
      const store = upsertSession({ activeId: id, sessions: list }, session);
      saveChatStore(store);
      setActiveId(id);
      return store.sessions;
    });
  }, []);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const store = loadChatStore();
    setSessions(store.sessions);
    if (store.activeId) {
      const session = store.sessions.find((s) => s.id === store.activeId);
      if (session) {
        setActiveId(session.id);
        setMessages(session.messages);
      }
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  useEffect(() => {
    if (!historyOpen) return;
    const close = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setHistoryOpen(false);
      }
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [historyOpen]);

  const startNewChat = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    setInput('');
    setTaggedPaths([]);
    setError(null);
    setHistoryOpen(false);
    saveChatStore({ activeId: null, sessions });
  }, [sessions]);

  const openSession = useCallback(
    (session: AiChatSession) => {
      setActiveId(session.id);
      setMessages(session.messages);
      setInput('');
      setTaggedPaths([]);
      setError(null);
      setHistoryOpen(false);
      saveChatStore({ activeId: session.id, sessions });
    },
    [sessions]
  );

  const removeSession = useCallback(
    (id: string) => {
      const store = deleteSession({ activeId, sessions }, id);
      saveChatStore(store);
      setSessions(store.sessions);
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
        setInput('');
      }
    },
    [activeId, sessions]
  );

  if (!open) return null;

  const submit = async () => {
    const text = input.trim();
    if ((!text && taggedPaths.length === 0) || loading) return;
    if (!configured) {
      setError('Configure a provider and API key in Settings → AI.');
      return;
    }

    setError(null);
    const attachments = taggedPaths.length ? [...taggedPaths] : undefined;
    setInput('');
    setTaggedPaths([]);
    const chatId = activeId ?? createChatId();
    if (!activeId) setActiveId(chatId);

    const userMsg: ChatMessage = { role: 'user', content: text || '(Tagged files)', attachments };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    persist(chatId, nextMessages);
    setLoading(true);

    try {
      const system = await buildVaultContext({
        query: text,
        files,
        activePath,
        readFile: vault.readFile,
        cache: contents,
        allowEdits: config.allowEdits,
        taggedPaths: collectTaggedPaths(nextMessages)
      });
      const reply = await sendAiChat(config, system, nextMessages);
      const withReply = [...nextMessages, { role: 'assistant' as const, content: reply }];
      setMessages(withReply);
      persist(chatId, withReply);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      setMessages((m) => m.slice(0, -1));
      setInput(text);
      if (attachments) setTaggedPaths(attachments);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDownExtra = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (historyOpen) {
        setHistoryOpen(false);
        return true;
      }
      onClose();
      return true;
    }
    return false;
  };

  const activeTitle = activeId ? sessions.find((s) => s.id === activeId)?.title : null;

  return (
    <div className="shrink-0 h-[min(380px,42vh)] border-t border-border bg-surface flex flex-col">
      <div className="flex items-center gap-2 h-9 px-3 border-b border-border shrink-0">
        <Sparkles size={14} className="text-amber shrink-0" strokeWidth={1.75} />
        <span className="text-[11px] uppercase tracking-wider text-muted shrink-0">Ask your vault</span>
        {activeTitle && (
          <span className="text-[11px] text-text truncate min-w-0" title={activeTitle}>
            · {activeTitle}
          </span>
        )}
        <span className="text-[10px] text-muted truncate hidden sm:inline">
          {configured ? (config.provider === 'anthropic' ? 'Anthropic' : 'OpenAI') : 'Not configured'}
        </span>
        <div className="flex-1" />
        {!configured && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-[11px] text-amber hover:underline shrink-0"
          >
            Set up AI
          </button>
        )}
        <div className="relative shrink-0" ref={historyRef}>
          <button
            type="button"
            onClick={() => setHistoryOpen((o) => !o)}
            className={`w-7 h-7 flex items-center justify-center rounded text-muted hover:text-text hover:bg-surface2 ${
              historyOpen ? 'bg-surface2 text-text' : ''
            }`}
            title="Chat history"
          >
            <Clock size={14} strokeWidth={1.75} />
          </button>
          {historyOpen && (
            <div className="absolute bottom-full right-0 mb-1 w-72 max-h-64 overflow-y-auto rounded-lg border border-border bg-surface shadow-xl z-20">
              <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted">Saved chats</span>
                <span className="text-[10px] text-muted">{sessions.length}</span>
              </div>
              {sessions.length === 0 ? (
                <p className="px-3 py-4 text-xs text-muted">No saved chats yet. Start a conversation to save it here.</p>
              ) : (
                <ul className="py-1">
                  {sessions.map((session) => {
                    const selected = session.id === activeId;
                    return (
                      <li key={session.id}>
                        <div
                          className={`group flex items-start gap-2 px-3 py-2 cursor-pointer ${
                            selected ? 'bg-surface2' : 'hover:bg-surface2/70'
                          }`}
                          onClick={() => openSession(session)}
                        >
                          <div className="min-w-0 flex-1">
                            <div className={`text-xs truncate ${selected ? 'text-text' : 'text-muted group-hover:text-text'}`}>
                              {session.title}
                            </div>
                            <div className="text-[10px] text-muted mt-0.5">
                              {formatChatWhen(session.updatedAt)}
                              {' · '}
                              {session.messages.filter((m) => m.role === 'user').length} questions
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSession(session.id);
                            }}
                            className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-muted opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-bg"
                            title="Delete chat"
                          >
                            <Trash2 size={12} strokeWidth={1.75} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={startNewChat}
          className="w-7 h-7 flex items-center justify-center rounded text-muted hover:text-text hover:bg-surface2 shrink-0"
          title="New chat"
        >
          <MessageSquarePlus size={14} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded text-muted hover:text-text hover:bg-surface2 shrink-0"
          title="Close (Esc)"
        >
          <X size={14} strokeWidth={1.75} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-muted leading-relaxed">
            Ask questions about your notes — summaries, connections, where something is mentioned, or help drafting
            from existing material.
            {config.allowEdits
              ? ' When you ask for changes, click Preview to open the edit in the editor — approve or revert from there.'
              : ''}{' '}
            Type <kbd className="px-1 py-0.5 bg-surface2 rounded text-[10px]">@</kbd> or drag files from the vault
            sidebar to tag them for context. Chats are saved on this device.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`text-sm ${m.role === 'user' ? 'text-text' : 'text-muted'}`}>
            <div className="text-[10px] uppercase tracking-wider mb-1 text-muted">
              {m.role === 'user' ? 'You' : 'Assistant'}
            </div>
            {m.role === 'assistant' ? (
              <AssistantMessage
                content={m.content}
                messageIndex={i}
                contents={contents}
                allowEdits={config.allowEdits}
                editStates={editStates}
                onEditState={onEditState}
                onPreviewFileEdit={onPreviewFileEdit}
                onOpenFile={onOpenFile}
              />
            ) : (
              <UserMessage content={m.content} attachments={m.attachments} onOpenFile={onOpenFile} />
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <Loader2 size={14} className="animate-spin" />
            Reading vault and thinking…
          </div>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      <AiChatInput
        value={input}
        onChange={setInput}
        taggedPaths={taggedPaths}
        onTaggedPathsChange={setTaggedPaths}
        files={files}
        loading={loading}
        configured={configured}
        pendingTags={pendingTags}
        onPendingTagsConsumed={onPendingTagsConsumed}
        onSubmit={submit}
        onKeyDownExtra={onKeyDownExtra}
        requestFocus={open}
      />
    </div>
  );
}

function UserMessage({
  content,
  attachments,
  onOpenFile
}: {
  content: string;
  attachments?: string[];
  onOpenFile?: (path: string) => void;
}) {
  return (
    <div className="leading-relaxed space-y-2">
      {attachments && attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {attachments.map((path) => (
            <button
              key={path}
              type="button"
              onClick={() => onOpenFile?.(path)}
              className="inline-flex items-center gap-1 max-w-full pl-1.5 pr-2 py-0.5 rounded-full bg-surface2 border border-border text-[10px] text-muted hover:text-text"
              title={path}
            >
              <FileTypeIcon name={basename(path)} size={12} />
              <span className="font-mono truncate max-w-[180px]">{basename(path)}</span>
            </button>
          ))}
        </div>
      )}
      <div className="whitespace-pre-wrap">{content}</div>
    </div>
  );
}

function AssistantMessage({
  content,
  messageIndex,
  contents,
  allowEdits,
  editStates,
  onEditState,
  onPreviewFileEdit,
  onOpenFile
}: {
  content: string;
  messageIndex: number;
  contents: Record<string, string>;
  allowEdits: boolean;
  editStates: Record<string, AiEditStatus>;
  onEditState: (key: string, status: AiEditStatus) => void;
  onPreviewFileEdit: (editKey: string, path: string, content: string) => Promise<void>;
  onOpenFile?: (path: string) => void;
}) {
  const parts = splitAssistantContent(content);
  let editIndex = 0;

  return (
    <div className="leading-relaxed space-y-1">
      {parts.map((part, pi) => {
        if (part.kind === 'text') {
          return (
            <div key={pi} className="whitespace-pre-wrap">
              {part.text}
            </div>
          );
        }

        const key = `${messageIndex}:${editIndex}:${part.edit.path}`;
        editIndex++;
        const status = editStates[key] ?? 'pending';

        if (!allowEdits) {
          return (
            <p key={pi} className="text-[11px] text-muted italic">
              File edit proposed for {part.edit.path}. Enable &quot;Allow file edits&quot; in Settings → AI to preview
              changes in the editor.
            </p>
          );
        }

        return (
          <AiEditProposal
            key={key}
            edit={part.edit}
            previousContent={contents[part.edit.path]}
            status={status}
            onPreview={async () => {
              await onPreviewFileEdit(key, part.edit.path, part.edit.content);
              onEditState(key, 'previewing');
            }}
            onDismiss={() => onEditState(key, 'declined')}
            onOpenFile={onOpenFile}
          />
        );
      })}
    </div>
  );
}
