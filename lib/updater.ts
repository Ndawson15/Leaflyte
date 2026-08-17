import { isTauri } from '@/lib/vaultClient';

export type UpdateProgress = {
  phase: 'started' | 'progress' | 'finished';
  downloaded?: number;
  total?: number;
};

export async function checkForAppUpdate() {
  if (!isTauri()) return null;
  const { check } = await import('@tauri-apps/plugin-updater');
  return check({ timeout: 30_000 });
}

export async function installAppUpdate(
  update: Awaited<ReturnType<typeof checkForAppUpdate>>,
  onProgress?: (progress: UpdateProgress) => void
) {
  if (!update) return;
  await update.downloadAndInstall((event) => {
    if (event.event === 'Started') {
      onProgress?.({ phase: 'started', total: event.data.contentLength });
    } else if (event.event === 'Progress') {
      onProgress?.({ phase: 'progress', downloaded: event.data.chunkLength });
    } else {
      onProgress?.({ phase: 'finished' });
    }
  });
  const { relaunch } = await import('@tauri-apps/plugin-process');
  await relaunch();
}
