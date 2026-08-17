'use client';

import { useEffect, useState } from 'react';
import { FolderOpen } from 'lucide-react';
import AppLogo from '@/components/AppLogo';
import { APP_NAME } from '@/lib/appInfo';
import { createWorkspace, type Workspace } from '@/lib/workspaces';
import { seedWelcomeNote, WELCOME_NOTE_PATH } from '@/lib/welcomeNote';
import * as vault from '@/lib/vaultClient';

export default function WorkspaceSetup({
  onComplete
}: {
  onComplete: (workspace: Workspace) => void | Promise<void>;
}) {
  const [name, setName] = useState('My notes');
  const [vaultPath, setVaultPath] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDesktop = vault.isTauri();

  useEffect(() => {
    if (isDesktop) return;
    void vault.getVaultPath().then((path) => setVaultPath(path || 'vault'));
  }, [isDesktop]);

  const pickFolder = async () => {
    setError(null);
    const picked = await vault.pickVaultFolder();
    if (picked) setVaultPath(picked);
  };

  const useDefaultLocation = async () => {
    setError(null);
    try {
      setVaultPath(await vault.getVaultPath());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resolve default location');
    }
  };

  const canSubmit = name.trim().length > 0 && vaultPath.trim().length > 0 && !busy;

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedPath = vaultPath.trim();
    if (!trimmedName || !trimmedPath) return;

    setBusy(true);
    setError(null);
    try {
      if (isDesktop) {
        await vault.setVaultPath(trimmedPath);
      }
      const { created } = await seedWelcomeNote();
      const workspace = createWorkspace(trimmedName, trimmedPath);
      if (created) {
        workspace.session = {
          tabs: [WELCOME_NOTE_PATH],
          activePath: WELCOME_NOTE_PATH,
          previewPath: null
        };
      }
      await onComplete(workspace);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create workspace');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center bg-bg text-text p-6 overflow-hidden">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-xl space-y-6">
        <div className="space-y-2 text-center">
          <AppLogo size={40} className="mx-auto" alt={APP_NAME} />
          <h1 className="text-lg font-medium">Welcome to {APP_NAME}</h1>
          <p className="text-sm text-muted">
            Name your workspace and choose where your notes are stored. You can add more workspaces later.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs text-muted">Workspace name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My notes"
              autoFocus
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-muted"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSubmit) void handleSubmit();
              }}
            />
          </label>

          <div className="space-y-1.5">
            <span className="text-xs text-muted">Vault location</span>
            {isDesktop ? (
              <div className="space-y-2">
                <div className="min-h-[2.5rem] rounded-md border border-border bg-bg px-3 py-2 text-[12px] text-muted break-all">
                  {vaultPath || 'No folder selected yet'}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void pickFolder()}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[12px] text-text hover:border-muted hover:bg-surface2"
                  >
                    <FolderOpen size={14} strokeWidth={1.75} />
                    Choose folder…
                  </button>
                  <button
                    type="button"
                    onClick={() => void useDefaultLocation()}
                    className="rounded-md border border-border px-3 py-1.5 text-[12px] text-muted hover:text-text hover:border-muted hover:bg-surface2"
                  >
                    Use default location
                  </button>
                </div>
              </div>
            ) : (
              <p className="rounded-md border border-border bg-bg px-3 py-2 text-[12px] text-muted">
                Browser dev mode uses the <code className="text-text">vault/</code> folder in this project.
                Use the desktop app to pick a custom folder on your Mac.
              </p>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => void handleSubmit()}
          className="w-full rounded-md bg-amber px-4 py-2.5 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Setting up…' : 'Get started'}
        </button>
      </div>
    </div>
  );
}
