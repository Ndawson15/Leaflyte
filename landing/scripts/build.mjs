import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const landingRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(landingRoot, '..');

// Hostinger resolves the output directory from the repository root, not landing/.
const out = join(repoRoot, 'build');

const staticPaths = ['index.html', 'styles.css', 'assets', 'downloads'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const path of staticPaths) {
  cpSync(join(landingRoot, path), join(out, path), { recursive: true });
}

if (!existsSync(join(out, 'index.html'))) {
  console.error('Build failed: index.html missing from output');
  process.exit(1);
}

console.log(`Built static site → ${out}`);
