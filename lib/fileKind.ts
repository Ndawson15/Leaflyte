const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico']);
const BINARY_EXT = new Set([...IMAGE_EXT, 'pdf', 'zip', 'woff', 'woff2', 'ttf']);
const HTML_EXT = new Set(['html', 'htm', 'xhtml']);
const MARKDOWN_EXT = new Set(['md', 'mdx']);

export function ext(path: string): string {
  return path.split('.').pop()?.toLowerCase() ?? '';
}

export function isImagePath(path: string): boolean {
  return IMAGE_EXT.has(ext(path));
}

export function isMarkdownPath(path: string): boolean {
  return ext(path) === 'md';
}

export function isHtmlPath(path: string): boolean {
  return HTML_EXT.has(ext(path));
}

export function isMarkdownLikePath(path: string): boolean {
  return isMarkdownPath(path) || MARKDOWN_EXT.has(ext(path));
}

export function supportsReadView(path: string): boolean {
  return isMarkdownLikePath(path) || isHtmlPath(path);
}

export function defaultFileViewMode(_path: string): 'read' | 'edit' {
  return 'edit';
}

export function isProbablyText(path: string): boolean {
  return !BINARY_EXT.has(ext(path));
}

export function isEditableInMonaco(path: string): boolean {
  return isProbablyText(path) && !isImagePath(path);
}
