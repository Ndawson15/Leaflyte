import { readLocal, writeLocal } from '@/lib/storage';
import { VAULT_PATH_STORAGE_KEY } from '@/lib/themes';

export interface WorkspaceSession {
  tabs: string[];
  activePath: string | null;
  previewPath: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  vaultPath: string;
  session: WorkspaceSession;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceStore {
  activeId: string | null;
  workspaces: Workspace[];
}

export const WORKSPACES_STORAGE_KEY = 'leaflyte.workspaces';

export const EMPTY_SESSION: WorkspaceSession = {
  tabs: [],
  activePath: null,
  previewPath: null
};

export function createWorkspaceId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `ws-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function defaultWorkspaceName(vaultPath: string): string {
  const parts = vaultPath.replace(/\\/g, '/').split('/').filter(Boolean);
  return parts[parts.length - 1] || 'Workspace';
}

export function createWorkspace(name: string, vaultPath: string): Workspace {
  const now = Date.now();
  return {
    id: createWorkspaceId(),
    name: name.trim() || defaultWorkspaceName(vaultPath),
    vaultPath,
    session: { ...EMPTY_SESSION },
    createdAt: now,
    updatedAt: now
  };
}

export function loadWorkspaces(): WorkspaceStore {
  try {
    const raw = readLocal(WORKSPACES_STORAGE_KEY);
    if (!raw) return { activeId: null, workspaces: [] };
    const parsed = JSON.parse(raw) as Partial<WorkspaceStore>;
    const workspaces = (parsed.workspaces ?? [])
      .filter((w): w is Workspace => Boolean(w?.id && w?.vaultPath && w?.name))
      .map((w) => ({
        ...w,
        session: w.session ?? { ...EMPTY_SESSION }
      }));
    const activeId =
      typeof parsed.activeId === 'string' && workspaces.some((w) => w.id === parsed.activeId)
        ? parsed.activeId
        : workspaces[0]?.id ?? null;
    return { activeId, workspaces };
  } catch {
    return { activeId: null, workspaces: [] };
  }
}

export function saveWorkspaces(store: WorkspaceStore) {
  writeLocal(WORKSPACES_STORAGE_KEY, JSON.stringify(store));
}

export function hasLegacyVaultPath(): boolean {
  return Boolean(readLocal(VAULT_PATH_STORAGE_KEY));
}

export function resetWorkspaceData() {
  try {
    localStorage.removeItem(WORKSPACES_STORAGE_KEY);
    localStorage.removeItem(VAULT_PATH_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function migrateWorkspaces(store: WorkspaceStore, fallbackVaultPath: string): WorkspaceStore {
  if (store.workspaces.length > 0) return store;
  const legacy = readLocal(VAULT_PATH_STORAGE_KEY);
  const vaultPath = legacy || fallbackVaultPath;
  const workspace = createWorkspace(defaultWorkspaceName(vaultPath), vaultPath);
  return { activeId: workspace.id, workspaces: [workspace] };
}

export function upsertWorkspace(store: WorkspaceStore, workspace: Workspace): WorkspaceStore {
  const workspaces = [
    workspace,
    ...store.workspaces.filter((w) => w.id !== workspace.id)
  ].sort((a, b) => a.name.localeCompare(b.name));
  return { ...store, workspaces };
}

export function removeWorkspace(store: WorkspaceStore, id: string): WorkspaceStore {
  const workspaces = store.workspaces.filter((w) => w.id !== id);
  const activeId =
    store.activeId === id ? workspaces[0]?.id ?? null : store.activeId;
  return { activeId, workspaces };
}

export function activeWorkspace(store: WorkspaceStore): Workspace | null {
  if (!store.activeId) return store.workspaces[0] ?? null;
  return store.workspaces.find((w) => w.id === store.activeId) ?? store.workspaces[0] ?? null;
}
