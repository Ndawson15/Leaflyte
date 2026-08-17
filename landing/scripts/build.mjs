import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist');

const staticPaths = ['index.html', 'styles.css', 'assets', 'downloads'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const path of staticPaths) {
  cpSync(join(root, path), join(out, path), { recursive: true });
}

console.log(`Built static site → ${out}`);
