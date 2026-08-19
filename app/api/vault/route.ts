import { NextRequest, NextResponse } from 'next/server';
import { isCaptureAuthorized, unauthorizedCaptureResponse } from '@/lib/captureAuth';
import { getVaultDir } from '@/lib/vault';

/** VS Code capture extension — discover the active vault path. */
export async function GET(req: NextRequest) {
  if (!isCaptureAuthorized(req)) return unauthorizedCaptureResponse();

  try {
    return NextResponse.json({ path: getVaultDir() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not read vault';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
