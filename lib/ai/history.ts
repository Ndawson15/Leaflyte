import type { ChatMessage } from '@/lib/ai/chat';
import { readLocal, writeLocal } from '@/lib/storage';

export interface AiChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface AiChatStore {
  activeId: string | null;
  sessions: AiChatSession[];
}

export const AI_CHATS_STORAGE_KEY = 'leaflyte.aiChats';
const MAX_SESSIONS = 80;

export function createChatId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function chatTitleFromMessages(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === 'user');
  if (!first?.content.trim()) return 'New chat';
  const line = first.content.trim().split('\n')[0];
  return line.length > 56 ? `${line.slice(0, 53)}…` : line;
}

export function formatChatWhen(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function loadChatStore(): AiChatStore {
  try {
    const raw = readLocal(AI_CHATS_STORAGE_KEY);
    if (!raw) return { activeId: null, sessions: [] };
    const parsed = JSON.parse(raw) as Partial<AiChatStore>;
    const sessions = Array.isArray(parsed.sessions)
      ? parsed.sessions.filter(
          (s): s is AiChatSession =>
            Boolean(s?.id && Array.isArray(s.messages) && typeof s.updatedAt === 'number')
        )
      : [];
    return {
      activeId: typeof parsed.activeId === 'string' ? parsed.activeId : null,
      sessions: sessions.sort((a, b) => b.updatedAt - a.updatedAt)
    };
  } catch {
    return { activeId: null, sessions: [] };
  }
}

export function saveChatStore(store: AiChatStore) {
  writeLocal(AI_CHATS_STORAGE_KEY, JSON.stringify(store));
}

export function upsertSession(store: AiChatStore, session: AiChatSession): AiChatStore {
  const sessions = [session, ...store.sessions.filter((s) => s.id !== session.id)].sort(
    (a, b) => b.updatedAt - a.updatedAt
  );
  const trimmed = sessions.slice(0, MAX_SESSIONS);
  return { activeId: session.id, sessions: trimmed };
}

export function deleteSession(store: AiChatStore, id: string): AiChatStore {
  const sessions = store.sessions.filter((s) => s.id !== id);
  const activeId = store.activeId === id ? null : store.activeId;
  return { activeId, sessions };
}

export function buildSession(id: string, messages: ChatMessage[], existing?: AiChatSession): AiChatSession {
  const now = Date.now();
  return {
    id,
    title: chatTitleFromMessages(messages),
    messages,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
}
