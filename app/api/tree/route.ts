import { NextResponse } from 'next/server';
import { listTree } from '@/lib/vault';

export async function GET() {
  const tree = listTree();
  return NextResponse.json({ tree });
}
