import { parentDir } from '@/lib/paths';

const LINK_STYLESHEET_RE =
  /<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["'][^>]*>|<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["']stylesheet["'][^>]*>/gi;
const STYLE_IMPORT_RE = /@import\s+(?:url\()?["']?([^"')]+)["']?\)?/gi;
const IMG_SRC_RE = /(<img\b[^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi;

export function resolveRelativePath(fromPath: string, href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed || /^[#?]/.test(trimmed)) return null;
  if (/^(https?:|data:|mailto:|javascript:)/i.test(trimmed)) return null;
  if (trimmed.startsWith('/')) return trimmed.replace(/^\/+/, '');

  const baseParts = parentDir(fromPath).split('/').filter(Boolean);
  for (const part of trimmed.split('/')) {
    if (part === '.' || part === '') continue;
    if (part === '..') {
      baseParts.pop();
      continue;
    }
    baseParts.push(part);
  }
  return baseParts.join('/');
}

export function extractStylesheetRefs(html: string): string[] {
  const refs = new Set<string>();
  for (const match of html.matchAll(LINK_STYLESHEET_RE)) {
    const href = match[1] || match[2];
    if (href) refs.add(href);
  }
  for (const match of html.matchAll(STYLE_IMPORT_RE)) {
    if (match[1]) refs.add(match[1]);
  }
  return [...refs];
}

function injectIntoHead(html: string, injection: string): string {
  if (/<head[\s>]/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${injection}`);
  }
  if (/<html[\s>]/i.test(html)) {
    return html.replace(/<html([^>]*)>/i, `<html$1><head>${injection}</head>`);
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${injection}</head><body>${html}</body></html>`;
}

function stripLinkedStylesheets(html: string): string {
  return html.replace(LINK_STYLESHEET_RE, '');
}

async function rewriteImageSources(
  html: string,
  filePath: string,
  assetUrl: (path: string) => Promise<string>
): Promise<string> {
  let result = html;
  const matches = [...html.matchAll(IMG_SRC_RE)];
  for (const match of matches) {
    const href = match[2];
    if (/^(https?:|data:)/i.test(href)) continue;
    const resolved = resolveRelativePath(filePath, href);
    if (!resolved) continue;
    try {
      const url = await assetUrl(resolved);
      const next = `${match[1]}${url}${match[3]}`;
      result = result.replace(match[0], next);
    } catch {
      /* keep original */
    }
  }
  return result;
}

export async function buildHtmlPreviewDocument(
  html: string,
  filePath: string,
  readFile: (path: string) => Promise<string>,
  assetUrl: (path: string) => Promise<string>
): Promise<string> {
  const stylesheetRefs = extractStylesheetRefs(html);
  const cssBlocks: string[] = [];

  for (const href of stylesheetRefs) {
    if (/^https?:\/\//i.test(href)) {
      cssBlocks.push(`@import url("${href.replace(/"/g, '\\"')}");`);
      continue;
    }
    const resolved = resolveRelativePath(filePath, href);
    if (!resolved) continue;
    try {
      const css = await readFile(resolved);
      cssBlocks.push(`/* ${resolved} */\n${css}`);
    } catch {
      cssBlocks.push(`/* missing stylesheet: ${href} */`);
    }
  }

  let body = stripLinkedStylesheets(html);
  body = await rewriteImageSources(body, filePath, assetUrl);

  const injected = [
    '<meta charset="utf-8">',
    '<base target="_blank">',
    cssBlocks.length ? `<style>${cssBlocks.join('\n\n')}</style>` : ''
  ].join('');

  return injectIntoHead(body, injected);
}
