import { NextRequest, NextResponse } from 'next/server';
import { buildIndex } from '@/lib/index';
import { resolveWikiTarget } from '@/lib/wikiLinks';

export async function GET(req: NextRequest) {
  const relPath = req.nextUrl.searchParams.get('path');
  if (!relPath) return NextResponse.json({ error: 'path is required' }, { status: 400 });

  const idx = buildIndex();
  const entry = idx.files.find((f) => f.path === relPath);
  const backlinkPaths = idx.backlinks.get(relPath) ?? [];

  const paths = idx.files.map((f) => f.path);
  const outgoing = (entry?.links ?? []).map((raw) => {
    const resolved = resolveWikiTarget(raw, paths);
    return { label: raw, path: resolved ?? null };
  });

  return NextResponse.json({
    tags: entry?.tags ?? [],
    backlinks: backlinkPaths,
    outgoing
  });
}
