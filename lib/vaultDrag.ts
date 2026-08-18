export const VAULT_FILE_DROP_EVENT = 'leaflyte:vault-file-drop';

export interface VaultFileDropDetail {
  sourcePath: string;
  hostPath: string;
  clientX: number;
  clientY: number;
}

export function dispatchVaultFileDrop(detail: VaultFileDropDetail) {
  window.dispatchEvent(new CustomEvent(VAULT_FILE_DROP_EVENT, { detail }));
}
