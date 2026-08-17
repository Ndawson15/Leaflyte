export function basename(p: string): string {
  return p.split('/').pop() ?? p;
}

export function parentDir(p: string): string {
  const i = p.lastIndexOf('/');
  return i === -1 ? '' : p.slice(0, i);
}

export function joinPath(folder: string, name: string): string {
  return folder ? `${folder}/${name}` : name;
}

/** Rewrite a path after a file/folder move. */
export function rewritePath(path: string, from: string, to: string): string {
  if (path === from) return to;
  if (path.startsWith(from + '/')) return to + path.slice(from.length);
  return path;
}

export type DropTarget = { path: string; type: 'file' | 'folder' } | 'root';

export function destinationForDrop(sourcePath: string, target: DropTarget): string {
  const name = basename(sourcePath);
  if (target === 'root') return name;
  if (target.type === 'folder') return joinPath(target.path, name);
  return joinPath(parentDir(target.path), name);
}

export function dropTargetFromEvent(e: { target: EventTarget | null }): DropTarget {
  const raw = e.target;
  const start =
    raw instanceof Element ? raw : raw instanceof Node ? raw.parentElement : null;
  if (start?.closest('[data-drop-root]')) return 'root';
  const el = start?.closest('[data-drop-path]') as HTMLElement | null;
  const path = el?.dataset.dropPath;
  const type = el?.dataset.dropKind;
  if (!path || (type !== 'file' && type !== 'folder')) return 'root';
  return { path, type };
}

export function isInvalidMove(sourcePath: string, dest: string, sourceIsFolder: boolean): boolean {
  if (!dest || dest === sourcePath) return true;
  if (sourceIsFolder && (dest === sourcePath || dest.startsWith(sourcePath + '/'))) return true;
  return false;
}
