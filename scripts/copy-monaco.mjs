import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'node_modules', 'monaco-editor', 'min', 'vs');
const dest = path.join(root, 'public', 'monaco', 'vs');

if (!existsSync(src)) {
  console.error('monaco-editor not installed — run npm install first');
  process.exit(1);
}

rmSync(path.join(root, 'public', 'monaco'), { recursive: true, force: true });
mkdirSync(path.dirname(dest), { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`Copied Monaco → public/monaco/vs (${dest})`);
