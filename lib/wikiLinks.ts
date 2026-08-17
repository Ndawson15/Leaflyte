export const WIKI_LINK_RE = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

export interface WikiLinkMatch {
  raw: string;
  target: string;
  index: number;
  length: number;
}

export function findWikiLinks(text: string): WikiLinkMatch[] {
  const out: WikiLinkMatch[] = [];
  const re = new RegExp(WIKI_LINK_RE.source, 'g');
  for (const m of text.matchAll(re)) {
    out.push({
      raw: m[0],
      target: m[1].trim(),
      index: m.index ?? 0,
      length: m[0].length
    });
  }
  return out;
}

/** Resolve [[target]] to a vault path. First basename match wins, matching the server index. */
export function resolveWikiTarget(target: string, files: string[]): string | null {
  const needle = target.trim().toLowerCase().replace(/\\/g, '/');
  if (!needle) return null;

  const exact = files.find((f) => f.toLowerCase() === needle);
  if (exact) return exact;

  const withoutExt = files.find((f) => f.toLowerCase().replace(/\.[^.]+$/, '') === needle);
  if (withoutExt) return withoutExt;

  const byFilename = new Map<string, string>();
  const byBasename = new Map<string, string>();
  for (const f of files) {
    const filename = f.split('/').pop()!.toLowerCase();
    const base = filename.replace(/\.[^.]+$/, '');
    if (!byFilename.has(filename)) byFilename.set(filename, f);
    if (!byBasename.has(base)) byBasename.set(base, f);
  }

  const last = needle.split('/').pop()!;
  const lastBase = last.replace(/\.[^.]+$/, '');
  return byFilename.get(last) ?? byBasename.get(last) ?? byBasename.get(lastBase) ?? null;
}

export function suggestedPathForTarget(target: string, currentPath: string): string {
  let needle = target.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!needle) return '';
  const last = needle.split('/').pop() ?? needle;
  if (!/\.[a-zA-Z0-9]+$/.test(last)) needle += '.md';
  if (needle.includes('/')) return needle;
  const dir = currentPath.includes('/') ? currentPath.slice(0, currentPath.lastIndexOf('/')) : '';
  return dir ? `${dir}/${needle}` : needle;
}
