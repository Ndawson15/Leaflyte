import fs from 'fs';
import os from 'os';
import path from 'path';

const APP_CONFIG_DIR = 'com.leaflyte.desktop';

function desktopConfigDir(): string {
  const home = os.homedir();
  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', APP_CONFIG_DIR);
  }
  if (process.platform === 'win32') {
    return path.join(
      process.env.APPDATA || path.join(home, 'AppData', 'Roaming'),
      APP_CONFIG_DIR
    );
  }
  return path.join(home, '.local', 'share', APP_CONFIG_DIR);
}

/** Same persisted path the Tauri desktop app uses (Application Support/com.leaflyte.desktop/vault-path.txt). */
function loadPersistedVaultPath(): string | null {
  try {
    const raw = fs.readFileSync(path.join(desktopConfigDir(), 'vault-path.txt'), 'utf8').trim();
    if (!raw) return null;
    const resolved = path.resolve(raw);
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      return resolved;
    }
  } catch {
    // no persisted vault yet
  }
  return null;
}

/** Active vault root for Next.js API routes (capture, dev file APIs). */
export function getVaultDir(): string {
  if (process.env.VAULT_DIR) {
    return path.resolve(process.env.VAULT_DIR);
  }
  const persisted = loadPersistedVaultPath();
  if (persisted) return persisted;
  return path.join(process.cwd(), 'vault');
}

/** @deprecated Prefer getVaultDir() — capture and file APIs resolve dynamically. */
export const VAULT_DIR = getVaultDir();

const IGNORE = new Set(['.git', 'node_modules', '.DS_Store', '.leaflyte-index']);

function loadGitignore(): string[] {
  const vaultDir = getVaultDir();
  try {
    const raw = fs.readFileSync(path.join(vaultDir, '.gitignore'), 'utf8');
    return raw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .map((l) => l.replace(/^\//, ''));
  } catch {
    return [];
  }
}

function gitignoreMatch(rel: string, pattern: string): boolean {
  const normalized = rel.replace(/^\/+/, '');
  if (pattern.includes('*')) {
    if (pattern.startsWith('*')) return normalized.endsWith(pattern.slice(1));
    if (pattern.endsWith('*')) return normalized.startsWith(pattern.slice(0, -1));
  }
  if (normalized === pattern || normalized.endsWith(`/${pattern}`)) return true;
  return normalized.split('/').some((seg) => seg === pattern);
}

function isGitignored(rel: string, patterns: string[]): boolean {
  return patterns.some((p) => gitignoreMatch(rel, p));
}

export interface TreeNode {
  name: string;
  path: string; // relative to vault root, posix-style
  type: 'file' | 'folder';
  children?: TreeNode[];
}

/** Resolve a relative vault path safely, refusing to escape the vault root. */
export function resolveSafe(relPath: string): string {
  const vaultDir = getVaultDir();
  const cleaned = relPath.replace(/^\/+/, '');
  const abs = path.resolve(vaultDir, cleaned);
  if (abs !== vaultDir && !abs.startsWith(vaultDir + path.sep)) {
    throw new Error('Path escapes vault directory');
  }
  return abs;
}

export function ensureVault() {
  const vaultDir = getVaultDir();
  if (!fs.existsSync(vaultDir)) {
    fs.mkdirSync(vaultDir, { recursive: true });
  }
}

function toPosix(p: string) {
  return p.split(path.sep).join('/');
}

export function listTree(dir?: string, gitignore?: string[]): TreeNode[] {
  const vaultDir = getVaultDir();
  const root = dir ?? vaultDir;
  const ignore = gitignore ?? loadGitignore();
  ensureVault();
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const nodes: TreeNode[] = [];

  for (const entry of entries) {
    if (IGNORE.has(entry.name) || entry.name.startsWith('.')) continue;
    const abs = path.join(root, entry.name);
    const rel = toPosix(path.relative(vaultDir, abs));
    if (isGitignored(rel, ignore)) continue;

    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: rel,
        type: 'folder',
        children: listTree(abs, ignore)
      });
    } else {
      nodes.push({ name: entry.name, path: rel, type: 'file' });
    }
  }

  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return nodes;
}

export function readFile(relPath: string): string {
  const abs = resolveSafe(relPath);
  return fs.readFileSync(abs, 'utf8');
}

export function writeFile(relPath: string, content: string) {
  const abs = resolveSafe(relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
}

export function deleteFile(relPath: string) {
  const abs = resolveSafe(relPath);
  const stat = fs.statSync(abs);
  if (stat.isDirectory()) {
    fs.rmSync(abs, { recursive: true, force: true });
  } else {
    fs.rmSync(abs);
  }
}

export function exists(relPath: string): boolean {
  try {
    return fs.existsSync(resolveSafe(relPath));
  } catch {
    return false;
  }
}

function toPosixRel(relPath: string) {
  return relPath.replace(/^\/+/, '').split(path.sep).join('/');
}

/** Move a file or folder to a new vault-relative path. */
export function movePath(fromRel: string, toRel: string) {
  const from = toPosixRel(fromRel);
  const to = toPosixRel(toRel);
  if (!from || !to) throw new Error('from and to are required');
  if (from === to) return to;

  const fromAbs = resolveSafe(from);
  const toAbs = resolveSafe(to);

  if (!fs.existsSync(fromAbs)) throw new Error('Source not found');
  if (fs.existsSync(toAbs)) throw new Error('A file or folder already exists at the destination');
  if (toAbs === fromAbs || toAbs.startsWith(fromAbs + path.sep)) {
    throw new Error('Cannot move a folder into itself');
  }

  fs.mkdirSync(path.dirname(toAbs), { recursive: true });
  const isDir = fs.statSync(fromAbs).isDirectory();
  try {
    fs.renameSync(fromAbs, toAbs);
  } catch (err) {
    if (!isDir) throw err;
    fs.cpSync(fromAbs, toAbs, { recursive: true, errorOnExist: true });
    fs.rmSync(fromAbs, { recursive: true, force: true });
  }
  return to;
}

/** Flat list of every file (not folders) in the vault, relative posix paths. */
export function listAllFiles(dir?: string): string[] {
  const vaultDir = getVaultDir();
  const root = dir ?? vaultDir;
  const gitignore = loadGitignore();
  const out: string[] = [];
  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (IGNORE.has(entry.name) || entry.name.startsWith('.')) continue;
      const abs = path.join(d, entry.name);
      const rel = toPosix(path.relative(vaultDir, abs));
      if (isGitignored(rel, gitignore)) continue;
      if (entry.isDirectory()) {
        walk(abs);
      } else {
        out.push(rel);
      }
    }
  };
  ensureVault();
  walk(root);
  return out;
}
