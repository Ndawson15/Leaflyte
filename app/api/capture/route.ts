import { NextRequest, NextResponse } from 'next/server';
import { isCaptureAuthorized, unauthorizedCaptureResponse } from '@/lib/captureAuth';
import { exists, getVaultDir, writeFile } from '@/lib/vault';
import { extensionForLanguage } from '@/lib/languageMap';

const LANG_TO_EXT: Record<string, string> = {
  typescript: 'ts',
  typescriptreact: 'tsx',
  javascript: 'js',
  javascriptreact: 'jsx',
  python: 'py',
  sql: 'sql',
  html: 'html',
  css: 'css',
  json: 'json',
  markdown: 'md',
  shellscript: 'sh',
  yaml: 'yaml',
  rust: 'rs',
  go: 'go',
  java: 'java',
  php: 'php',
  ruby: 'rb',
  csharp: 'cs',
  c: 'c',
  cpp: 'cpp',
  plaintext: 'txt'
};

function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || 'capture';
}

function uniquePath(folder: string, stem: string, ext: string): string {
  const prefix = folder ? `${folder.replace(/\/+$/, '')}/` : '';
  let candidate = `${prefix}${stem}.${ext}`;
  if (!exists(candidate)) return candidate;
  for (let i = 2; i < 200; i++) {
    candidate = `${prefix}${stem}-${i}.${ext}`;
    if (!exists(candidate)) return candidate;
  }
  return `${prefix}${stem}-${Date.now()}.${ext}`;
}

export async function GET(req: NextRequest) {
  if (!isCaptureAuthorized(req)) return unauthorizedCaptureResponse();
  return NextResponse.json({
    ok: true,
    message: 'Leaflyte capture is ready'
  });
}

export async function POST(req: NextRequest) {
  if (!isCaptureAuthorized(req)) return unauthorizedCaptureResponse();

  try {
    const body = await req.json();
    const content = typeof body?.content === 'string' ? body.content : '';
    if (!content.trim()) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    const languageId =
      typeof body?.languageId === 'string' ? body.languageId.trim().toLowerCase() : '';
    const title = typeof body?.title === 'string' ? body.title : '';
    const folder =
      typeof body?.folder === 'string'
        ? body.folder.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
        : 'captures';

    let ext =
      (typeof body?.extension === 'string' && body.extension.replace(/^\./, '')) ||
      (languageId ? LANG_TO_EXT[languageId] : '') ||
      (languageId ? extensionForLanguage(languageId) : '') ||
      'md';

    const stem = slugify(title || `capture-${new Date().toISOString().slice(0, 10)}`);
    const path = uniquePath(folder, stem, ext);

    writeFile(path, content.endsWith('\n') ? content : `${content}\n`);
    return NextResponse.json({ path, vaultPath: getVaultDir(), created: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Capture failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
