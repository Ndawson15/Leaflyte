import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const APP_CONFIG_DIR = 'com.leaflyte.desktop';
const TOKEN_FILE = 'capture-token.txt';

function desktopConfigDir() {
  const home = os.homedir();
  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', APP_CONFIG_DIR);
  }
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), APP_CONFIG_DIR);
  }
  return path.join(home, '.local', 'share', APP_CONFIG_DIR);
}

const file = path.join(desktopConfigDir(), TOKEN_FILE);

try {
  const existing = fs.readFileSync(file, 'utf8').trim();
  if (existing) {
    console.log('Capture token already present');
    process.exit(0);
  }
} catch {
  // create below
}

const token = crypto.randomBytes(32).toString('hex');
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, `${token}\n`, { mode: 0o600 });
console.log('Created capture token for VS Code extension');
