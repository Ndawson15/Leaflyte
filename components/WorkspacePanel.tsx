'use client';

import { useState } from 'react';
import { Check, FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { createWorkspaceFromPicker } from '@/lib/createWorkspaceFlow';
import { useWorkspaces } from '@/components/WorkspaceProvider';
import * as vault from '@/lib/vaultClient';

const ICON = { size: 14, strokeWidth: 1.75, className: 'shrink-0' as const };

export default function WorkspacePanel({
  onSwitch,
  onNotice
}: {
  onSwitch: (workspaceId: string) => void | Promise<void>;
  onNotice?: (message: string) => void;
}) {
  const { store, workspace, addWorkspace, updateWorkspace, deleteWorkspace } = useWorkspaces();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [creating, setCreating] = useState(false);

  const startRename = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const commitRename = (id: string) => {
    const name = editName.trim();
    if (name) updateWorkspace(id, { name });
    setEditingId(null);
  };

  const createWorkspaceFlow = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const ws = await createWorkspaceFromPicker(onNotice);
      if (!ws) return;
      addWorkspace(ws);
      await onSwitch(ws.id);
    } catch (err) {
      onNotice?.(err instanceof Error ? err.message : 'Could not create workspace');
    } finally {
      setCreating(false);
    }
  };

  const changeVault = async (id: string) => {
    if (!vault.isTauri()) {
      onNotice?.('Changing vault folders is only supported in the desktop app.');
      return;
    }
    const picked = await vault.pickVaultFolder();
    if (!picked) return;
    updateWorkspace(id, { vaultPath: picked });
    if (workspace?.id === id) await onSwitch(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Each workspace is a separate vault folder with its own open tabs and notes.
        </p>
        <button
          type="button"
          onClick={createWorkspaceFlow}
          disabled={creating}
          className="shrink-0 inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded border border-border text-text hover:border-muted hover:bg-surface2 disabled:opacity-50"
        >
          <Plus {...ICON} />
          New workspace
        </button>
      </div>

      <div className="border border-border rounded-lg bg-surface divide-y divide-border">
        {store.workspaces.map((ws) => {
          const active = ws.id === workspace?.id;
          const editing = editingId === ws.id;
          return (
            <div key={ws.id} className={`px-4 py-3 space-y-2 ${active ? 'bg-surface2/40' : ''}`}>
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  {editing ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => commitRename(ws.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename(ws.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="w-full rounded-md border border-border bg-bg px-2 py-1 text-sm text-text outline-none focus:border-muted"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text font-medium">{ws.name}</span>
                      {active && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber">
                          <Check size={11} strokeWidth={2} />
                          Active
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-[11px] text-muted mt-1 break-all">{ws.vaultPath}</p>
                </div>
                {!active && (
                  <button
                    type="button"
                    onClick={() => onSwitch(ws.id)}
                    className="shrink-0 text-[11px] px-2.5 py-1 rounded border border-border text-text hover:bg-surface2"
                  >
                    Switch
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startRename(ws.id, ws.name)}
                  className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-text"
                >
                  <Pencil {...ICON} />
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => changeVault(ws.id)}
                  className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-text"
                >
                  <FolderOpen {...ICON} />
                  Change folder
                </button>
                {store.workspaces.length > 1 && !active && (
                  <button
                    type="button"
                    onClick={() => {
                      if (deleteWorkspace(ws.id)) onNotice?.('Workspace deleted');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-red-400"
                  >
                    <Trash2 {...ICON} />
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
