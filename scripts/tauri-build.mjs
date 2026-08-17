import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const keyPath = path.join(root, 'src-tauri', '.tauri-signing.key');

if (!existsSync(keyPath)) {
  console.error(`Missing signing key: ${keyPath}`);
  console.error('Run: CI=1 npm run tauri signer generate -- -w src-tauri/.tauri-signing.key -p "" --ci');
  process.exit(1);
}

const env = {
  ...process.env,
  TAURI_SIGNING_PRIVATE_KEY: readFileSync(keyPath, 'utf8').trim(),
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD: process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD ?? '',
  PATH: `${process.env.HOME}/.cargo/bin:${process.env.PATH ?? ''}`
};

const result = spawnSync('tauri', ['build'], {
  cwd: root,
  env,
  stdio: 'inherit',
  shell: false
});

process.exit(result.status ?? 1);
