import { rename, access } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const api = path.join(root, 'app', 'api');
const hidden = path.join(root, '.api-hidden');
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function runNextBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [nextBin, 'build'], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, TAURI: '1' }
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`next build exited ${code}`));
    });
  });
}

const moved = await exists(api);
if (moved) await rename(api, hidden);
try {
  const copy = spawnSync(process.execPath, [path.join(root, 'scripts', 'copy-monaco.mjs')], {
    cwd: root,
    stdio: 'inherit'
  });
  if (copy.status !== 0) throw new Error('copy-monaco failed');
  await runNextBuild();
} finally {
  if (moved && (await exists(hidden))) await rename(hidden, api);
}
