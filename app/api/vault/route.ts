import { NextResponse } from 'next/server';
import { getVaultDir } from '@/lib/vault';

/** Active vault path for local dev tools (VS Code capture extension). Desktop uses Tauri invoke instead. */
export async function GET() {
  return NextResponse.json({ path: getVaultDir() });
}
