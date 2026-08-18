import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const cargoTarget = process.env.CARGO_TARGET_DIR ?? join(root, 'src-tauri', 'target');
const bundleRoot = join(cargoTarget, 'release', 'bundle');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const version = arg('--version') ?? JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const notes = arg('--notes') ?? '';
const baseUrl =
  arg('--base-url') ??
  `https://github.com/Ndawson15/Leaflyte/releases/download/v${version}`;

/** @type {Record<string, { url: string; signature: string }>} */
const platforms = {};

function addPlatform(key, artifactPath) {
  const sigPath = `${artifactPath}.sig`;
  if (!existsSync(artifactPath) || !existsSync(sigPath)) {
    console.warn(`Skip ${key}: missing ${basename(artifactPath)} or .sig`);
    return;
  }
  platforms[key] = {
    url: `${baseUrl}/${basename(artifactPath)}`,
    signature: readFileSync(sigPath, 'utf8').trim()
  };
  console.log(`+ ${key} → ${basename(artifactPath)}`);
}

const macDir = join(bundleRoot, 'macos');
if (existsSync(macDir)) {
  const tar = readdirSync(macDir).find((f) => f.endsWith('.app.tar.gz'));
  if (tar) addPlatform('darwin-aarch64', join(macDir, tar));
}

const nsisDir = join(bundleRoot, 'nsis');
if (existsSync(nsisDir)) {
  const exe =
    readdirSync(nsisDir).find((f) => f.endsWith('-setup.exe')) ??
    readdirSync(nsisDir).find((f) => f.endsWith('setup.exe'));
  if (exe) addPlatform('windows-x86_64', join(nsisDir, exe));
}

if (Object.keys(platforms).length === 0) {
  console.error('No signed updater artifacts found. Run a signed `npm run tauri:build` first.');
  process.exit(1);
}

const manifest = {
  version,
  notes,
  pub_date: new Date().toISOString(),
  platforms
};

const outPath = join(root, 'landing', 'updates', 'latest.json');
writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`\nWrote ${outPath}`);
console.log('Deploy landing/updates/latest.json (and release assets at the URLs above).');
