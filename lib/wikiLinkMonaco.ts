import type { editor, IDisposable } from 'monaco-editor';
import { findWikiLinks, resolveWikiTarget, suggestedPathForTarget } from './wikiLinks';

type Monaco = typeof import('monaco-editor');

const FLAG = '__leaflyteWikiLinks';

export interface WikiLinkContext {
  files: string[];
  currentPath: string;
  navigate: (path: string) => void;
  createAndOpen: (path: string) => void;
}

function rangeForOffset(model: editor.ITextModel, start: number, length: number) {
  const from = model.getPositionAt(start);
  const to = model.getPositionAt(start + length);
  return {
    startLineNumber: from.lineNumber,
    startColumn: from.column,
    endLineNumber: to.lineNumber,
    endColumn: to.column
  };
}

export function ensureWikiLinkSupport(monaco: Monaco, getContext: () => WikiLinkContext) {
  const g = monaco as Monaco & { [FLAG]?: boolean };
  if (g[FLAG]) return;
  g[FLAG] = true;

  monaco.languages.registerLinkProvider('*', {
    provideLinks(model) {
      const { files } = getContext();
      const links = findWikiLinks(model.getValue())
        .map((link) => {
          const path = resolveWikiTarget(link.target, files);
          if (!path) return null;
          return {
            range: rangeForOffset(model, link.index, link.length),
            url: monaco.Uri.from({ scheme: 'vault', path: '/' + path }),
            tooltip: `Open ${path} (⌘/Ctrl-click)`
          };
        })
        .filter((l): l is NonNullable<typeof l> => l !== null);

      return { links };
    }
  });

  monaco.editor.registerLinkOpener({
    open(resource) {
      if (resource.scheme !== 'vault') return false;
      const path = decodeURIComponent(resource.path.replace(/^\//, ''));
      if (!path) return false;
      getContext().navigate(path);
      return true;
    }
  });
}

export function applyWikiLinkDecorations(
  monaco: Monaco,
  model: editor.ITextModel,
  collection: editor.IEditorDecorationsCollection,
  files: string[],
  currentPath: string
) {
  const decorations: editor.IModelDeltaDecoration[] = findWikiLinks(model.getValue()).map((link) => {
    const path = resolveWikiTarget(link.target, files);
    const dest = path ?? suggestedPathForTarget(link.target, currentPath);
    return {
      range: rangeForOffset(model, link.index, link.length),
      options: {
        inlineClassName: path ? 'wiki-link' : 'wiki-link-unresolved',
        hoverMessage: {
          value: path
            ? `Open **${path}**\n\n⌘/Ctrl-click to follow`
            : `Create **${dest}**\n\n⌘/Ctrl-click to create`
        },
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
      }
    };
  });
  collection.set(decorations);
}

export function attachWikiLinkDecorations(
  monaco: Monaco,
  ed: editor.IStandaloneCodeEditor,
  getContext: () => WikiLinkContext
): { refresh: () => void; dispose: () => void } {
  const collection = ed.createDecorationsCollection();
  const refresh = () => {
    const model = ed.getModel();
    if (!model) return;
    applyWikiLinkDecorations(monaco, model, collection, getContext().files, getContext().currentPath);
  };
  refresh();

  const contentSub: IDisposable = ed.onDidChangeModelContent(refresh);
  const mouseSub: IDisposable = ed.onMouseDown((e) => {
    if (!e.event.leftButton) return;
    if (!e.event.ctrlKey && !e.event.metaKey && !e.event.altKey) return;
    const pos = e.target.position;
    if (!pos) return;
    const model = ed.getModel();
    if (!model) return;
    const offset = model.getOffsetAt(pos);
    const link = findWikiLinks(model.getValue()).find(
      (l) => offset >= l.index && offset < l.index + l.length
    );
    if (!link) return;
    const path = resolveWikiTarget(link.target, getContext().files);
    const ctx = getContext();
    if (path) {
      e.event.preventDefault();
      e.event.stopPropagation();
      ctx.navigate(path);
      return;
    }
    const dest = suggestedPathForTarget(link.target, ctx.currentPath);
    if (!dest) return;
    e.event.preventDefault();
    e.event.stopPropagation();
    ctx.createAndOpen(dest);
  });

  return {
    refresh,
    dispose() {
      contentSub.dispose();
      mouseSub.dispose();
      collection.clear();
    }
  };
}
