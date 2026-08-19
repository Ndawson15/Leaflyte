import { normalizeCompatibleBaseUrl } from '@/lib/ai/config';

const BLOCKED_HOSTNAMES = new Set([
  'metadata.google.internal',
  'metadata.goog',
  'metadata',
]);

/** Reject openai-compatible base URLs that are unsafe to fetch from the server (SSRF). */
export function assertSafeCompatibleBaseUrl(url: string): string {
  const normalized = normalizeCompatibleBaseUrl(url);
  if (!normalized) throw new Error('Base URL is required');

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error('Invalid base URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Base URL must use http or https');
  }

  if (parsed.username || parsed.password) {
    throw new Error('Base URL must not include credentials');
  }

  const host = parsed.hostname.toLowerCase();
  if (!host) throw new Error('Invalid base URL host');

  if (BLOCKED_HOSTNAMES.has(host)) {
    throw new Error('Base URL host is not allowed');
  }

  // Cloud metadata and link-local (169.254.0.0/16) — common SSRF targets.
  if (host === '169.254.169.254' || host === '169.254.170.2' || /^169\.254\./.test(host)) {
    throw new Error('Base URL host is not allowed');
  }

  // Block bare wildcard / unspecified addresses.
  if (host === '0.0.0.0' || host === '[::]' || host === '::') {
    throw new Error('Base URL host is not allowed');
  }

  return normalized;
}
