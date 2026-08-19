import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

const APP_CONFIG_DIR = 'com.leaflyte.desktop';
const TOKEN_FILE = 'capture-token.txt';

export function desktopConfigDir(): string {
  const home = os.homedir();
  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', APP_CONFIG_DIR);
  }
  if (process.platform === 'win32') {
    return path.join(
      process.env.APPDATA || path.join(home, 'AppData', 'Roaming'),
      APP_CONFIG_DIR
    );
  }
  return path.join(home, '.local', 'share', APP_CONFIG_DIR);
}

export function captureTokenPath(): string {
  return path.join(desktopConfigDir(), TOKEN_FILE);
}

export function getOrCreateCaptureToken(): string {
  const file = captureTokenPath();
  try {
    const existing = fs.readFileSync(file, 'utf8').trim();
    if (existing) return existing;
  } catch {
    // generate below
  }

  const token = crypto.randomBytes(32).toString('hex');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${token}\n`, { mode: 0o600 });
  return token;
}

export function readCaptureToken(): string | null {
  try {
    const token = fs.readFileSync(captureTokenPath(), 'utf8').trim();
    return token || null;
  } catch {
    return null;
  }
}

export function isCaptureAuthorized(req: Request): boolean {
  const expected = getOrCreateCaptureToken();
  const header = req.headers.get('authorization');
  return header === `Bearer ${expected}`;
}

export function unauthorizedCaptureResponse() {
  return Response.json({ error: 'Unauthorized capture request' }, { status: 401 });
}
