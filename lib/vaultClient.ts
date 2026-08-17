import type { TreeNode } from '@/lib/vault';
import { findWikiLinks, resolveWikiTarget } from '@/lib/wikiLinks';
import { isProbablyText } from '@/lib/fileKind';
import { searchVaultFiles } from '@/lib/vaultSearch';

export type BacklinksData = {
  tags: string[];
  backlinks: string[];
  outgoing: { label: string; path: string | null }[];
};

const TAG_RE = /#([a-zA-Z][\w-]{1,40})/g;

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
  return tauriInvoke<T>(cmd, args);
}

async function jsonOrThrow(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data;
}

export async function getVaultPath(): Promise<string> {
  if (isTauri()) return invoke<string>('get_vault_path');
  const data = await jsonOrThrow(await fetch('/api/vault'));
  return data.path;
}

export async function setVaultPath(path: string): Promise<string> {
  if (isTauri()) return invoke<string>('set_vault_path', { path });
  throw new Error('Changing vault path is only supported in the desktop app');
}

export async function pickVaultFolder(): Promise<string | null> {
  if (isTauri()) return invoke<string | null>('pick_vault_folder');
  return null;
}

export async function revealPath(path: string): Promise<void> {
  if (isTauri()) {
    await invoke('reveal_path', { path });
    return;
  }
  throw new Error('Reveal in Finder is only supported in the desktop app');
}

export async function absPath(path: string): Promise<string> {
  if (isTauri()) return invoke<string>('abs_path', { path });
  const data = await jsonOrThrow(await fetch(`/api/vault?abs=${encodeURIComponent(path)}`));
  return data.abs;
}

export async function getAssetUrl(path: string): Promise<string> {
  if (isTauri()) {
    const abs = await absPath(path);
    const { convertFileSrc } = await import('@tauri-apps/api/core');
    return convertFileSrc(abs);
  }
  return `/api/asset?path=${encodeURIComponent(path)}`;
}

export async function loadTree(): Promise<TreeNode[]> {
  if (isTauri()) return invoke<TreeNode[]>('list_tree');
  const data = await jsonOrThrow(await fetch('/api/tree'));
  return data.tree;
}

export async function readFile(path: string): Promise<string> {
  if (isTauri()) return invoke<string>('read_file', { path });
  const data = await jsonOrThrow(await fetch(`/api/file?path=${encodeURIComponent(path)}`));
  return data.content;
}

export async function writeFile(path: string, content: string): Promise<{ created: boolean }> {
  if (isTauri()) return invoke<{ created: boolean }>('write_file', { path, content });
  const data = await jsonOrThrow(
    await fetch('/api/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content })
    })
  );
  return { created: Boolean(data.created) };
}

export async function deletePath(path: string): Promise<void> {
  if (isTauri()) {
    await invoke('delete_path', { path });
    return;
  }
  await jsonOrThrow(await fetch(`/api/file?path=${encodeURIComponent(path)}`, { method: 'DELETE' }));
}

export async function movePath(from: string, to: string): Promise<string> {
  if (isTauri()) return invoke<string>('move_path', { from, to });
  const data = await jsonOrThrow(
    await fetch('/api/file', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to })
    })
  );
  return data.to;
}

export async function listFiles(): Promise<string[]> {
  if (isTauri()) return invoke<string[]>('list_files');
  const tree = await loadTree();
  return flattenFiles(tree);
}

export async function searchVault(query: string, limit = 30) {
  const files = await listFiles();
  return searchVaultFiles(query, files, readFile, limit);
}

export async function loadBacklinks(path: string): Promise<BacklinksData> {
  if (!isTauri()) {
    return jsonOrThrow(await fetch(`/api/backlinks?path=${encodeURIComponent(path)}`));
  }

  const files = await listFiles();
  const entries: { path: string; content: string }[] = [];
  for (const f of files) {
    if (!isProbablyText(f)) continue;
    try {
      entries.push({ path: f, content: await readFile(f) });
    } catch {
      // skip unreadable files
    }
  }

  const current = entries.find((e) => e.path === path);
  const tags = current
    ? Array.from(new Set(Array.from(current.content.matchAll(TAG_RE)).map((m) => m[1])))
    : [];
  const outgoing = (current ? findWikiLinks(current.content) : []).map((link) => ({
    label: link.target,
    path: resolveWikiTarget(link.target, files)
  }));

  const backlinks: string[] = [];
  for (const entry of entries) {
    if (entry.path === path) continue;
    for (const link of findWikiLinks(entry.content)) {
      if (resolveWikiTarget(link.target, files) === path && !backlinks.includes(entry.path)) {
        backlinks.push(entry.path);
      }
    }
  }

  return { tags, backlinks, outgoing };
}

function flattenFiles(nodes: TreeNode[]): string[] {
  const out: string[] = [];
  for (const n of nodes) {
    if (n.type === 'file') out.push(n.path);
    if (n.children) out.push(...flattenFiles(n.children));
  }
  return out;
}
