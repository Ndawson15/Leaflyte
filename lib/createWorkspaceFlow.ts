import { createWorkspace, defaultWorkspaceName } from '@/lib/workspaces';
import * as vault from '@/lib/vaultClient';

export async function createWorkspaceFromPicker(
  onNotice?: (message: string) => void
): Promise<ReturnType<typeof createWorkspace> | null> {
  let picked: string | null = null;
  if (vault.isTauri()) {
    picked = await vault.pickVaultFolder();
    if (!picked) return null;
  } else {
    picked = (await vault.getVaultPath()) || 'vault';
    onNotice?.('Dev mode adds a workspace label; use the desktop app to pick separate folders.');
  }
  return createWorkspace(defaultWorkspaceName(picked), picked);
}
