import { basename } from '@/lib/paths';
import { isProbablyText } from '@/lib/fileKind';
import type { ChatMessage } from '@/lib/ai/chat';

export const VAULT_PATH_MIME = 'application/x-leaflyte-vault-path';
export const AI_TAG_FILE_EVENT = 'leaflyte:ai-tag-file';
export const AI_DROP_HOVER_EVENT = 'leaflyte:ai-drop-hover';

export function mentionQueryAt(text: string, cursor: number): { query: string; at: number } | null {
  const before = text.slice(0, cursor);
  const match = /(?:^|[\s(])@([^\s@]*)$/.exec(before);
  if (!match) return null;
  const query = match[1];
  const at = before.length - query.length - 1;
  return { query, at };
}

export function filterMentionFiles(query: string, files: string[], limit = 10): string[] {
  const q = query.toLowerCase().trim();
  const scored = files
    .filter(isProbablyText)
    .map((path) => {
      const lower = path.toLowerCase();
      const name = basename(path).toLowerCase();
      let score = 0;
      if (!q) score = 1;
      else if (name.startsWith(q)) score = 100;
      else if (lower.startsWith(q)) score = 80;
      else if (name.includes(q)) score = 60;
      else if (lower.includes(q)) score = 40;
      else return null;
      return { path, score };
    })
    .filter((item): item is { path: string; score: number } => item !== null);

  scored.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
  return scored.slice(0, limit).map((item) => item.path);
}

export function removeMentionTrigger(
  text: string,
  at: number,
  cursor: number
): { text: string; cursor: number } {
  return {
    text: text.slice(0, at) + text.slice(cursor),
    cursor: at
  };
}

export function collectTaggedPaths(messages: ChatMessage[]): string[] {
  const paths: string[] = [];
  for (const message of messages) {
    if (message.attachments) paths.push(...message.attachments);
  }
  return [...new Set(paths)];
}

export function dispatchAiTagFile(path: string) {
  window.dispatchEvent(new CustomEvent(AI_TAG_FILE_EVENT, { detail: { path } }));
}

export function dispatchAiDropHover(active: boolean) {
  window.dispatchEvent(new CustomEvent(AI_DROP_HOVER_EVENT, { detail: { active } }));
}
