import { NextRequest, NextResponse } from 'next/server';
import { deleteFile, exists, movePath, readFile, writeFile } from '@/lib/vault';

export async function GET(req: NextRequest) {
  const relPath = req.nextUrl.searchParams.get('path');
  if (!relPath) return NextResponse.json({ error: 'path is required' }, { status: 400 });

  try {
    if (!exists(relPath)) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const content = readFile(relPath);
    return NextResponse.json({ path: relPath, content });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { path: relPath, content } = body ?? {};
  if (!relPath) return NextResponse.json({ error: 'path is required' }, { status: 400 });

  try {
    const isNew = !exists(relPath);
    writeFile(relPath, content ?? '');
    return NextResponse.json({ path: relPath, created: isNew });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const relPath = req.nextUrl.searchParams.get('path');
  if (!relPath) return NextResponse.json({ error: 'path is required' }, { status: 400 });

  try {
    deleteFile(relPath);
    return NextResponse.json({ deleted: relPath });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const from = typeof body?.from === 'string' ? body.from : '';
  const to = typeof body?.to === 'string' ? body.to : '';
  if (!from || !to) return NextResponse.json({ error: 'from and to are required' }, { status: 400 });

  try {
    const moved = movePath(from, to);
    return NextResponse.json({ from, to: moved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
