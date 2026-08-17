'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import {
  activeWorkspace,
  createWorkspace,
  hasLegacyVaultPath,
  loadWorkspaces,
  migrateWorkspaces,
  saveWorkspaces,
  removeWorkspace,
  resetWorkspaceData,
  upsertWorkspace,
  type Workspace,
  type WorkspaceSession,
  type WorkspaceStore
} from '@/lib/workspaces';
import { readLocal, writeLocal } from '@/lib/storage';
import { VAULT_PATH_STORAGE_KEY } from '@/lib/themes';

interface WorkspaceContextValue {
  store: WorkspaceStore;
  workspace: Workspace | null;
  ready: boolean;
  needsSetup: boolean;
  setStore: (next: WorkspaceStore) => void;
  updateWorkspace: (id: string, patch: Partial<Workspace>) => void;
  saveSession: (id: string, session: WorkspaceSession) => void;
  addWorkspace: (workspace: Workspace) => void;
  deleteWorkspace: (id: string) => boolean;
  setActiveWorkspace: (id: string) => void;
  completeSetup: (workspace: Workspace) => void;
  resetFirstRunSetup: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [store, setStoreState] = useState<WorkspaceStore>({ activeId: null, workspaces: [] });
  const [ready, setReady] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const next = loadWorkspaces();

    if (next.workspaces.length > 0) {
      if (!cancelled) {
        setStoreState(next);
        setReady(true);
      }
      return;
    }

    if (hasLegacyVaultPath()) {
      const migrated = migrateWorkspaces(next, readLocal(VAULT_PATH_STORAGE_KEY)!);
      if (!cancelled) {
        saveWorkspaces(migrated);
        setStoreState(migrated);
        setReady(true);
      }
      return;
    }

    if (!cancelled) {
      setNeedsSetup(true);
      setReady(true);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: WorkspaceStore) => {
    setStoreState(next);
    saveWorkspaces(next);
    const active = activeWorkspace(next);
    if (active) writeLocal(VAULT_PATH_STORAGE_KEY, active.vaultPath);
  }, []);

  const setStore = useCallback(
    (next: WorkspaceStore) => {
      persist(next);
    },
    [persist]
  );

  const completeSetup = useCallback(
    (workspace: Workspace) => {
      const next = { activeId: workspace.id, workspaces: [workspace] };
      persist(next);
      setNeedsSetup(false);
    },
    [persist]
  );

  const resetFirstRunSetup = useCallback(() => {
    resetWorkspaceData();
    setStoreState({ activeId: null, workspaces: [] });
    setNeedsSetup(true);
  }, []);

  const updateWorkspace = useCallback(
    (id: string, patch: Partial<Workspace>) => {
      setStoreState((prev) => {
        const workspaces = prev.workspaces.map((w) =>
          w.id === id ? { ...w, ...patch, updatedAt: Date.now() } : w
        );
        const next = { ...prev, workspaces };
        saveWorkspaces(next);
        return next;
      });
    },
    []
  );

  const saveSession = useCallback(
    (id: string, session: WorkspaceSession) => {
      updateWorkspace(id, { session });
    },
    [updateWorkspace]
  );

  const addWorkspace = useCallback((workspace: Workspace) => {
    setStoreState((prev) => {
      const next = upsertWorkspace(prev, workspace);
      saveWorkspaces(next);
      return next;
    });
  }, []);

  const deleteWorkspace = useCallback((id: string) => {
    let deleted = false;
    setStoreState((prev) => {
      if (prev.workspaces.length <= 1) return prev;
      deleted = true;
      const next = removeWorkspace(prev, id);
      saveWorkspaces(next);
      return next;
    });
    return deleted;
  }, []);

  const setActiveWorkspace = useCallback((id: string) => {
    setStoreState((prev) => {
      if (!prev.workspaces.some((w) => w.id === id)) return prev;
      const next = { ...prev, activeId: id };
      saveWorkspaces(next);
      const active = activeWorkspace(next);
      if (active) writeLocal(VAULT_PATH_STORAGE_KEY, active.vaultPath);
      return next;
    });
  }, []);

  const workspace = useMemo(() => activeWorkspace(store), [store]);

  const value = useMemo(
    () => ({
      store,
      workspace,
      ready,
      needsSetup,
      setStore,
      updateWorkspace,
      saveSession,
      addWorkspace,
      deleteWorkspace,
      setActiveWorkspace,
      completeSetup,
      resetFirstRunSetup
    }),
    [
      store,
      workspace,
      ready,
      needsSetup,
      setStore,
      updateWorkspace,
      saveSession,
      addWorkspace,
      deleteWorkspace,
      setActiveWorkspace,
      completeSetup,
      resetFirstRunSetup
    ]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspaces() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspaces must be used within WorkspaceProvider');
  return ctx;
}

export { createWorkspace };
