import { isProbablyText } from '@/lib/fileKind';

export type SearchHit = {
  path: string;
  snippet: string;
  score: number;
};

const TAG_RE = /#([a-zA-Z][\w-]{1,40})/g;

function snippetAround(content: string, q: string): string {
  const lower = content.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return '';
  const start = Math.max(0, idx - 48);
  const end = Math.min(content.length, idx + q.length + 48);
  return (
    (start > 0 ? '…' : '') +
    content.slice(start, end).replace(/\s+/g, ' ').trim() +
    (end < content.length ? '…' : '')
  );
}

export async function searchVaultFiles(
  query: string,
  files: string[],
  readFile: (path: string) => Promise<string>,
  limit = 30
): Promise<SearchHit[]> {
  const q = query.trim().toLowerCase();
  if (!q) {
    return files.slice(0, limit).map((path) => ({ path, snippet: '', score: 0 }));
  }

  const hits: SearchHit[] = [];

  for (const path of files) {
    if (!isProbablyText(path)) continue;
    const pathLower = path.toLowerCase();
    let score = 0;
    if (pathLower === q) score += 100;
    else if (pathLower.endsWith('/' + q) || pathLower.endsWith(q)) score += 80;
    else if (basename(pathLower) === q) score += 70;
    else if (pathLower.includes(q)) score += 40;

    let snippet = '';
    try {
      const content = await readFile(path);
      const contentLower = content.toLowerCase();
      if (contentLower.includes(q)) score += 25;
      for (const m of content.matchAll(TAG_RE)) {
        if (m[1].toLowerCase().includes(q.replace(/^#/, ''))) score += 30;
      }
      if (score > 0 && contentLower.includes(q)) {
        snippet = snippetAround(content, q);
      }
    } catch {
      continue;
    }

    if (score > 0) hits.push({ path, snippet, score });
  }

  hits.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
  return hits.slice(0, limit);
}

function basename(p: string): string {
  return p.split('/').pop() ?? p;
}
