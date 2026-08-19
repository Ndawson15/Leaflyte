import { isProbablyText } from '@/lib/fileKind';

export type SearchHit = {
  path: string;
  snippet: string;
  score: number;
};

export type ParsedSearchQuery = {
  /** Free-text or regex source (without filters). */
  text: string;
  /** Lowercase extensions without dot, e.g. ['sql','ts'] */
  extensions: string[];
  /** Path substrings that must all match (case-insensitive). */
  pathIncludes: string[];
  /** When set, content/filename matching uses this regex. */
  regex: RegExp | null;
  /** True when the user asked for regex but it failed to compile. */
  regexError: string | null;
};

const TAG_RE = /#([a-zA-Z][\w-]{1,40})/g;
const FILTER_RE = /\b(ext|path|re|regex):(?:"([^"]+)"|(\S+))/gi;

export function parseSearchQuery(raw: string): ParsedSearchQuery {
  const extensions: string[] = [];
  const pathIncludes: string[] = [];
  let regex: RegExp | null = null;
  let regexError: string | null = null;
  let text = raw;

  text = text.replace(FILTER_RE, (_full, key: string, quoted?: string, bare?: string) => {
    const value = (quoted ?? bare ?? '').trim();
    if (!value) return '';
    const k = key.toLowerCase();
    if (k === 'ext') {
      for (const part of value.split(',')) {
        const ext = part.trim().replace(/^\./, '').toLowerCase();
        if (ext) extensions.push(ext);
      }
    } else if (k === 'path') {
      pathIncludes.push(value.toLowerCase());
    } else if (k === 're' || k === 'regex') {
      try {
        regex = new RegExp(value, 'i');
      } catch (e) {
        regexError = e instanceof Error ? e.message : 'Invalid regex';
      }
    }
    return ' ';
  });

  // Slash-delimited regex: /pattern/ or /pattern/i
  const slash = text.match(/(^|\s)\/((?:\\\/|[^/])+)\/([ims]*)?(?=\s|$)/);
  if (slash && !regex) {
    try {
      regex = new RegExp(slash[2], slash[3] || 'i');
      text = text.replace(slash[0], ' ');
    } catch (e) {
      regexError = e instanceof Error ? e.message : 'Invalid regex';
    }
  }

  return {
    text: text.replace(/\s+/g, ' ').trim(),
    extensions,
    pathIncludes,
    regex,
    regexError
  };
}

function extensionOf(path: string): string {
  const name = path.replace(/\\/g, '/').split('/').pop() ?? path;
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : '';
}

function passesFilters(path: string, parsed: ParsedSearchQuery): boolean {
  if (parsed.extensions.length > 0) {
    const ext = extensionOf(path);
    if (!parsed.extensions.includes(ext)) return false;
  }
  if (parsed.pathIncludes.length > 0) {
    const lower = path.toLowerCase();
    if (!parsed.pathIncludes.every((p) => lower.includes(p))) return false;
  }
  return true;
}

function snippetAround(content: string, start: number, length: number): string {
  const from = Math.max(0, start - 48);
  const to = Math.min(content.length, start + length + 48);
  return (
    (from > 0 ? '…' : '') +
    content.slice(from, to).replace(/\s+/g, ' ').trim() +
    (to < content.length ? '…' : '')
  );
}

function contentMatch(
  content: string,
  parsed: ParsedSearchQuery
): { score: number; snippet: string } | null {
  const q = parsed.text.toLowerCase();

  if (parsed.regex) {
    const m = parsed.regex.exec(content);
    if (!m) return null;
    return { score: 25, snippet: snippetAround(content, m.index, m[0].length) };
  }

  if (!q) return { score: 0, snippet: '' };

  const lower = content.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) {
    // tag-only boost handled by caller via score on tags
    return null;
  }
  return { score: 25, snippet: snippetAround(content, idx, q.length) };
}

export async function searchVaultFiles(
  query: string,
  files: string[],
  readFile: (path: string) => Promise<string>,
  limit = 30
): Promise<SearchHit[]> {
  const parsed = parseSearchQuery(query);
  if (parsed.regexError) {
    return [];
  }

  const filtered = files.filter((path) => isProbablyText(path) && passesFilters(path, parsed));
  const q = parsed.text.toLowerCase();
  const hasQuery = Boolean(q || parsed.regex);

  if (!hasQuery && parsed.extensions.length === 0 && parsed.pathIncludes.length === 0) {
    return filtered.slice(0, limit).map((path) => ({ path, snippet: '', score: 0 }));
  }

  if (!hasQuery) {
    return filtered.slice(0, limit).map((path) => ({ path, snippet: '', score: 10 }));
  }

  const hits: SearchHit[] = [];

  for (const path of filtered) {
    const pathLower = path.toLowerCase();
    let score = 0;
    let snippet = '';

    if (parsed.regex) {
      if (parsed.regex.test(path)) score += 40;
      parsed.regex.lastIndex = 0;
    } else if (q) {
      if (pathLower === q) score += 100;
      else if (pathLower.endsWith('/' + q) || pathLower.endsWith(q)) score += 80;
      else if (basename(pathLower) === q) score += 70;
      else if (pathLower.includes(q)) score += 40;
    }

    try {
      const content = await readFile(path);
      const match = contentMatch(content, parsed);
      if (match) {
        score += match.score;
        snippet = match.snippet;
      }
      if (q) {
        for (const m of content.matchAll(TAG_RE)) {
          if (m[1].toLowerCase().includes(q.replace(/^#/, ''))) score += 30;
        }
      }
    } catch {
      continue;
    }

    if (score > 0) hits.push({ path, snippet, score });
  }

  hits.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
  return hits.slice(0, limit);
}

export type ReplacePreview = {
  path: string;
  count: number;
  preview: string;
};

export async function previewVaultReplace(
  query: string,
  replacement: string,
  files: string[],
  readFile: (path: string) => Promise<string>,
  limit = 100
): Promise<{ previews: ReplacePreview[]; error: string | null }> {
  const parsed = parseSearchQuery(query);
  if (parsed.regexError) return { previews: [], error: parsed.regexError };
  if (!parsed.text && !parsed.regex) {
    return { previews: [], error: 'Enter text or a regex to replace' };
  }

  const filtered = files.filter((path) => isProbablyText(path) && passesFilters(path, parsed));
  const previews: ReplacePreview[] = [];

  for (const path of filtered) {
    if (previews.length >= limit) break;
    try {
      const content = await readFile(path);
      const { next, count } = applyReplace(content, parsed, replacement);
      if (count === 0) continue;
      const idx = next !== content ? findFirstChange(content, next) : 0;
      previews.push({
        path,
        count,
        preview: snippetAround(content, Math.max(0, idx), 24)
      });
    } catch {
      continue;
    }
  }

  return { previews, error: null };
}

export function applyReplace(
  content: string,
  parsed: ParsedSearchQuery,
  replacement: string
): { next: string; count: number } {
  if (parsed.regex) {
    const flags = parsed.regex.flags.includes('g')
      ? parsed.regex.flags
      : `${parsed.regex.flags}g`;
    const re = new RegExp(parsed.regex.source, flags);
    const matches = content.match(re);
    const count = matches?.length ?? 0;
    if (count === 0) return { next: content, count: 0 };
    return { next: content.replace(re, replacement), count };
  }

  const q = parsed.text;
  if (!q) return { next: content, count: 0 };
  let count = 0;
  let idx = 0;
  const lower = content.toLowerCase();
  const needle = q.toLowerCase();
  const parts: string[] = [];
  let last = 0;
  while ((idx = lower.indexOf(needle, last)) !== -1) {
    parts.push(content.slice(last, idx));
    parts.push(replacement);
    last = idx + q.length;
    count += 1;
  }
  if (count === 0) return { next: content, count: 0 };
  parts.push(content.slice(last));
  return { next: parts.join(''), count };
}

function findFirstChange(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (a[i] !== b[i]) return i;
  }
  return n;
}

function basename(p: string): string {
  return p.split('/').pop() ?? p;
}
