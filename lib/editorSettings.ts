import { readLocal, writeLocal } from '@/lib/storage';

export const MARKDOWN_TOOLBAR_STORAGE_KEY = 'leaflyte.markdownToolbar';

export function loadMarkdownToolbarEnabled(): boolean {
  return readLocal(MARKDOWN_TOOLBAR_STORAGE_KEY) !== '0';
}

export function saveMarkdownToolbarEnabled(on: boolean) {
  writeLocal(MARKDOWN_TOOLBAR_STORAGE_KEY, on ? '1' : '0');
}
