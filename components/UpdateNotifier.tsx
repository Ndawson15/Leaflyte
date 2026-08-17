'use client';

import { useCallback, useState } from 'react';
import type { Update } from '@tauri-apps/plugin-updater';
import { APP_VERSION } from '@/lib/appInfo';
import { checkForAppUpdate, installAppUpdate } from '@/lib/updater';
import { isTauri } from '@/lib/vaultClient';

export function UpdateSettingsRow({ onNotice }: { onNotice?: (message: string) => void }) {
  const [checking, setChecking] = useState(false);
  const [update, setUpdate] = useState<Update | null>(null);
  const [installing, setInstalling] = useState(false);

  const runCheck = useCallback(async () => {
    if (!isTauri()) {
      onNotice?.('Updates are only available in the desktop app.');
      return;
    }
    setChecking(true);
    try {
      const found = await checkForAppUpdate();
      setUpdate(found);
      if (!found) onNotice?.(`You're on the latest version (v${APP_VERSION}).`);
    } catch (err) {
      onNotice?.(err instanceof Error ? err.message : 'Could not check for updates.');
    } finally {
      setChecking(false);
    }
  }, [onNotice]);

  const runInstall = async () => {
    if (!update) return;
    setInstalling(true);
    try {
      await installAppUpdate(update);
    } catch (err) {
      onNotice?.(err instanceof Error ? err.message : 'Update failed.');
      setInstalling(false);
    }
  };

  return (
    <div className="border border-border rounded-lg bg-surface px-4 py-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-text">App updates</div>
          <p className="text-[11px] text-muted mt-0.5">
            Checks leaflyte.app for signed updates. Installed apps update in place.
          </p>
        </div>
        <button
          type="button"
          onClick={runCheck}
          disabled={checking || installing}
          className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs text-text hover:bg-surface2 disabled:opacity-50"
        >
          {checking ? 'Checking…' : 'Check for updates'}
        </button>
      </div>
      {update && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-amber/30 bg-amber/10 px-3 py-2">
          <div className="min-w-0">
            <div className="text-xs text-text font-medium">v{update.version} available</div>
            {update.body && <p className="text-[11px] text-muted mt-0.5 line-clamp-2">{update.body}</p>}
          </div>
          <button
            type="button"
            onClick={runInstall}
            disabled={installing}
            className="shrink-0 rounded-md bg-amber px-3 py-1.5 text-xs font-medium text-bg hover:opacity-90 disabled:opacity-50"
          >
            {installing ? 'Installing…' : 'Update & restart'}
          </button>
        </div>
      )}
    </div>
  );
}
