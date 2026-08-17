export interface AiFileEdit {
  path: string;
  content: string;
}

const EDIT_BLOCK_RE = /```leaflyte-write\s*\n([\s\S]*?)```/gi;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeVaultPath(path: string): string | null {
  const cleaned = path.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!cleaned || cleaned.includes('..') || cleaned.startsWith('.')) return null;
  return cleaned;
}

function parseEdit(value: unknown): AiFileEdit | null {
  if (!isRecord(value)) return null;
  if (typeof value.path !== 'string' || typeof value.content !== 'string') return null;
  const path = normalizeVaultPath(value.path);
  if (!path) return null;
  return { path, content: value.content };
}

function parseBlock(body: string): AiFileEdit[] {
  try {
    const parsed = JSON.parse(body.trim()) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map(parseEdit).filter((edit): edit is AiFileEdit => edit !== null);
    }
    const single = parseEdit(parsed);
    return single ? [single] : [];
  } catch {
    return [];
  }
}

export function parseAiEdits(content: string): { text: string; edits: AiFileEdit[] } {
  const edits: AiFileEdit[] = [];
  let text = content;

  for (const match of content.matchAll(EDIT_BLOCK_RE)) {
    edits.push(...parseBlock(match[1]));
    text = text.replace(match[0], '').trim();
  }

  return { text, edits };
}

export function splitAssistantContent(content: string): Array<
  | { kind: 'text'; text: string }
  | { kind: 'edit'; edit: AiFileEdit }
> {
  const parts: Array<{ kind: 'text'; text: string } | { kind: 'edit'; edit: AiFileEdit }> = [];
  let lastIndex = 0;

  for (const match of content.matchAll(EDIT_BLOCK_RE)) {
    const index = match.index ?? 0;
    const before = content.slice(lastIndex, index).trim();
    if (before) parts.push({ kind: 'text', text: before });
    for (const edit of parseBlock(match[1])) {
      parts.push({ kind: 'edit', edit });
    }
    lastIndex = index + match[0].length;
  }

  const tail = content.slice(lastIndex).trim();
  if (tail) parts.push({ kind: 'text', text: tail });
  return parts.length ? parts : [{ kind: 'text', text: content }];
}
