import { NextRequest, NextResponse } from 'next/server';
import { resolveSafe } from '@/lib/vault';
import fs from 'fs';
import path from 'path';

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon'
};

export async function GET(req: NextRequest) {
  const relPath = req.nextUrl.searchParams.get('path');
  if (!relPath) return NextResponse.json({ error: 'path is required' }, { status: 400 });

  try {
    const abs = resolveSafe(relPath);
    if (!fs.existsSync(abs)) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const ext = path.extname(abs).slice(1).toLowerCase();
    const type = MIME[ext] ?? 'application/octet-stream';
    const buf = fs.readFileSync(abs);
    return new NextResponse(buf, {
      headers: {
        'Content-Type': type,
        'Cache-Control': 'no-store'
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'invalid path';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
