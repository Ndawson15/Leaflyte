import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const landingRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(landingRoot, 'build');

const staticPaths = ['downloads', 'updates'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

console.log('Building React landing with Vite…');
const vite = spawnSync('npx', ['vite', 'build'], {
  cwd: landingRoot,
  stdio: 'inherit',
  shell: true,
});

if (vite.status !== 0) {
  console.error('Vite build failed');
  process.exit(vite.status || 1);
}

console.log('Building documentation site…');
const docsRoot = join(landingRoot, 'docs');
const docsBuild = spawnSync('npm', ['run', 'build'], {
  cwd: docsRoot,
  stdio: 'inherit',
  shell: true,
});

if (docsBuild.status !== 0) {
  console.error('Docs build failed');
  process.exit(docsBuild.status || 1);
}

const docsOut = join(docsRoot, 'out');
if (existsSync(docsOut)) {
  cpSync(docsOut, join(out, 'docs'), { recursive: true });
  console.log('Copied docs export → build/docs/');
}

for (const path of staticPaths) {
  const source = join(landingRoot, path);
  if (!existsSync(source)) continue;
  cpSync(source, join(out, path), { recursive: true });
}

if (!existsSync(join(out, 'index.html'))) {
  console.error('Build failed: index.html missing from output');
  process.exit(1);
}

console.log(`Built static site → ${out}`);
