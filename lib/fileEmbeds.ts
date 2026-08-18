import { resolveRelativePath } from '@/lib/htmlPreview';
import { resolveWikiTarget } from '@/lib/wikiLinks';

export const DEFAULT_FILE_EMBED_HEIGHT = 360;
export const MIN_FILE_EMBED_HEIGHT = 180;
export const MAX_FILE_EMBED_HEIGHT = 900;

export interface FileEmbedMatch {
  raw: string;
  target: string;
  options: string[];
  height: number;
  index: number;
  length: number;
}

function clampHeight(height: number): number {
  return Math.min(MAX_FILE_EMBED_HEIGHT, Math.max(MIN_FILE_EMBED_HEIGHT, Math.round(height)));
}

function parseHeight(options: string[]): number {
  const option = options.find((item) => /^height\s*=/i.test(item));
  const value = option ? Number(option.split('=').slice(1).join('=').trim()) : NaN;
  return Number.isFinite(value) ? clampHeight(value) : DEFAULT_FILE_EMBED_HEIGHT;
}

/** Find file embeds anywhere in Markdown while ignoring fenced code blocks. */
export function findFileEmbeds(source: string): FileEmbedMatch[] {
  const embeds: FileEmbedMatch[] = [];
  const lines = source.match(/.*(?:\n|$)/g) ?? [];
  let offset = 0;
  let inFence = false;

  for (const lineWithEnding of lines) {
    const line = lineWithEnding.replace(/\r?\n$/, '');
    if (line.trimStart().startsWith('```')) {
      inFence = !inFence;
      offset += lineWithEnding.length;
      continue;
    }

    if (!inFence) {
      const embedPattern = /!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
      for (const match of line.matchAll(embedPattern)) {
        const raw = match[0];
        const options = (match[2] ?? '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
        embeds.push({
          raw,
          target: match[1].trim(),
          options,
          height: parseHeight(options),
          index: offset + (match.index ?? 0),
          length: raw.length
        });
      }
    }

    offset += lineWithEnding.length;
  }

  return embeds;
}

export function resolveFileEmbedPath(
  hostPath: string,
  target: string,
  files: string[]
): string | null {
  const normalized = target.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized) return null;

  if (!target.startsWith('./') && !target.startsWith('../')) {
    const exact = files.find((file) => file.toLowerCase() === normalized.toLowerCase());
    if (exact) return exact;
  }

  const relative = resolveRelativePath(hostPath, target);
  if (relative) {
    const match = files.find((file) => file.toLowerCase() === relative.toLowerCase());
    if (match) return match;
  }

  return resolveWikiTarget(normalized, files);
}

export function formatFileEmbed(target: string, options: string[]): string {
  return options.length ? `![[${target}|${options.join(',')}]]` : `![[${target}]]`;
}

export function updateFileEmbedHeight(
  source: string,
  embed: FileEmbedMatch,
  height: number
): string {
  const nextHeight = clampHeight(height);
  const options = embed.options.filter((item) => !/^height\s*=/i.test(item));
  options.unshift(`height=${nextHeight}`);
  const token = formatFileEmbed(embed.target, options);
  return source.slice(0, embed.index) + token + source.slice(embed.index + embed.length);
}

export function rewriteFileEmbedsForMove(
  source: string,
  hostPath: string,
  filesBefore: string[],
  remap: (resolvedPath: string) => string | null
): string {
  const embeds = findFileEmbeds(source);
  if (!embeds.length) return source;

  let next = source;
  for (const embed of [...embeds].reverse()) {
    const resolved = resolveFileEmbedPath(hostPath, embed.target, filesBefore);
    const mapped = resolved ? remap(resolved) : null;
    if (!mapped) continue;
    const token = formatFileEmbed(mapped, embed.options);
    next = next.slice(0, embed.index) + token + next.slice(embed.index + embed.length);
  }
  return next;
}
