import { listAllFiles, readFile } from './vault';
import { findWikiLinks, resolveWikiTarget } from './wikiLinks';

export interface FileIndexEntry {
  path: string;
  basename: string; // filename without extension, lowercased
  links: string[]; // raw [[targets]] found in this file
  tags: string[];
}

export interface VaultIndex {
  files: FileIndexEntry[];
  // resolved-target-basename (lowercase) -> file path, for link resolution
  byBasename: Map<string, string>;
  // file path -> list of file paths that link to it
  backlinks: Map<string, string[]>;
}

const TAG_RE = /#([a-zA-Z][\w-]{1,40})/g;

const BINARY_EXT = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'pdf', 'zip', 'woff', 'woff2', 'ttf'
]);

function isProbablyText(p: string): boolean {
  const ext = p.split('.').pop()?.toLowerCase() ?? '';
  return !BINARY_EXT.has(ext);
}

export function buildIndex(): VaultIndex {
  const files = listAllFiles();
  const entries: FileIndexEntry[] = [];
  const byBasename = new Map<string, string>();

  for (const f of files) {
    if (!isProbablyText(f)) continue;
    let content = '';
    try {
      content = readFile(f);
    } catch {
      continue;
    }

    const links = findWikiLinks(content).map((l) => l.target);
    const tags = Array.from(new Set(Array.from(content.matchAll(TAG_RE)).map((m) => m[1])));

    const base = f.split('/').pop()!.replace(/\.[^.]+$/, '').toLowerCase();
    entries.push({ path: f, basename: base, links, tags });

    // First file with a given basename wins the resolution slot.
    if (!byBasename.has(base)) byBasename.set(base, f);
  }

  const backlinks = new Map<string, string[]>();
  for (const entry of entries) {
    for (const rawLink of entry.links) {
      const target = resolveWikiTarget(rawLink, files);
      if (!target || target === entry.path) continue;
      const existing = backlinks.get(target) ?? [];
      if (!existing.includes(entry.path)) existing.push(entry.path);
      backlinks.set(target, existing);
    }
  }

  return { files: entries, byBasename, backlinks };
}

export function searchVault(query: string, limit = 30) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const files = listAllFiles();
  const results: { path: string; snippet: string }[] = [];

  for (const f of files) {
    if (!isProbablyText(f)) continue;
    const nameMatch = f.toLowerCase().includes(q);
    let content = '';
    try {
      content = readFile(f);
    } catch {
      continue;
    }
    const idx = content.toLowerCase().indexOf(q);

    if (nameMatch || idx !== -1) {
      let snippet = '';
      if (idx !== -1) {
        const start = Math.max(0, idx - 40);
        const end = Math.min(content.length, idx + q.length + 40);
        snippet = (start > 0 ? '…' : '') + content.slice(start, end).replace(/\n/g, ' ') + (end < content.length ? '…' : '');
      }
      results.push({ path: f, snippet });
      if (results.length >= limit) break;
    }
  }

  return results;
}
