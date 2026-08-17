import { basename } from '@/lib/paths';
import { resolveWikiTarget, WIKI_LINK_RE } from '@/lib/wikiLinks';

function stripExt(name: string): string {
  return name.replace(/\.[^.]+$/, '');
}

/** Preferred [[wiki]] label after a file lands at `path`. */
export function linkTargetForPath(path: string, previousTarget?: string): string {
  const hadPath = previousTarget?.includes('/');
  if (hadPath) return stripExt(path);
  return stripExt(basename(path));
}

export function rewriteContentLinksForMove(
  content: string,
  filesBefore: string[],
  remap: (resolvedPath: string) => string | null
): string {
  return content.replace(WIKI_LINK_RE, (full, rawTarget: string) => {
    const resolved = resolveWikiTarget(rawTarget, filesBefore);
    if (!resolved) return full;
    const mapped = remap(resolved);
    if (!mapped) return full;
    const newTarget = linkTargetForPath(mapped, rawTarget.trim());
    const pipe = full.indexOf('|');
    if (pipe !== -1) return `[[${newTarget}${full.slice(pipe)}`;
    return `[[${newTarget}]]`;
  });
}

export async function rewriteLinksAfterMove(
  from: string,
  to: string,
  filesBefore: string[],
  readFile: (p: string) => Promise<string>,
  writeFile: (p: string, c: string) => Promise<unknown>
): Promise<number> {
  const isFolder =
    filesBefore.some((f) => f.startsWith(from + '/')) ||
    (!filesBefore.includes(from) && from.indexOf('.') === -1);

  const remap = (resolved: string): string | null => {
    if (resolved === from) return to;
    if (isFolder && resolved.startsWith(from + '/')) {
      return to + resolved.slice(from.length);
    }
    return null;
  };

  let updated = 0;
  for (const file of filesBefore) {
    if (!/\.(md|txt|cfm|cfc|sql|json|js|ts|tsx|jsx|html|css|yaml|yml|xml|sh|py|rb|php|csv|log)$/i.test(file)) {
      continue;
    }
    let content: string;
    try {
      content = await readFile(file);
    } catch {
      continue;
    }
    const next = rewriteContentLinksForMove(content, filesBefore, remap);
    if (next !== content) {
      await writeFile(file, next);
      updated += 1;
    }
  }
  return updated;
}
