export function normalizeVaultPath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/+$/, '');
}

export function vaultPathsMatch(a: string, b: string): boolean {
  return normalizeVaultPath(a) === normalizeVaultPath(b);
}
