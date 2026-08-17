import { readLocal, writeLocal } from '@/lib/storage';

export type ActionId =
  | 'quickSwitcher'
  | 'commandPalette'
  | 'nextTab'
  | 'prevTab'
  | 'closeTab'
  | 'toggleVault'
  | 'toggleLinks'
  | 'settings'
  | 'save'
  | 'newFile'
  | 'newFolder'
  | 'togglePreview'
  | 'revealInFinder'
  | 'copyPath'
  | 'toggleAiChat';

export interface Chord {
  code: string;
  meta: boolean;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
}

export interface ShortcutAction {
  id: ActionId;
  label: string;
  group: 'Navigation' | 'View' | 'Files' | 'AI';
}

export const SHORTCUT_ACTIONS: ShortcutAction[] = [
  { id: 'quickSwitcher', label: 'Jump to note', group: 'Navigation' },
  { id: 'commandPalette', label: 'Command palette', group: 'Navigation' },
  { id: 'nextTab', label: 'Next tab', group: 'Navigation' },
  { id: 'prevTab', label: 'Previous tab', group: 'Navigation' },
  { id: 'closeTab', label: 'Close tab', group: 'Navigation' },
  { id: 'toggleVault', label: 'Toggle vault sidebar', group: 'View' },
  { id: 'toggleLinks', label: 'Toggle links sidebar', group: 'View' },
  { id: 'togglePreview', label: 'Toggle read/edit mode', group: 'View' },
  { id: 'settings', label: 'Open settings', group: 'View' },
  { id: 'save', label: 'Save file', group: 'Files' },
  { id: 'newFile', label: 'New file', group: 'Files' },
  { id: 'newFolder', label: 'New folder', group: 'Files' },
  { id: 'revealInFinder', label: 'Reveal in Finder', group: 'Files' },
  { id: 'copyPath', label: 'Copy file path', group: 'Files' },
  { id: 'toggleAiChat', label: 'Toggle AI chat', group: 'AI' }
];

export const DEFAULT_SHORTCUTS: Record<ActionId, Chord> = {
  quickSwitcher: { code: 'KeyK', meta: true, ctrl: false, alt: false, shift: false },
  commandPalette: { code: 'KeyP', meta: true, ctrl: false, alt: false, shift: false },
  nextTab: { code: 'BracketRight', meta: true, ctrl: false, alt: false, shift: true },
  prevTab: { code: 'BracketLeft', meta: true, ctrl: false, alt: false, shift: true },
  closeTab: { code: 'KeyW', meta: true, ctrl: false, alt: false, shift: false },
  toggleVault: { code: 'KeyB', meta: true, ctrl: false, alt: false, shift: false },
  toggleLinks: { code: 'KeyB', meta: true, ctrl: false, alt: false, shift: true },
  togglePreview: { code: 'KeyE', meta: true, ctrl: false, alt: false, shift: true },
  settings: { code: 'Comma', meta: true, ctrl: false, alt: false, shift: false },
  save: { code: 'KeyS', meta: true, ctrl: false, alt: false, shift: false },
  newFile: { code: 'KeyN', meta: true, ctrl: false, alt: false, shift: false },
  newFolder: { code: 'KeyN', meta: true, ctrl: false, alt: false, shift: true },
  revealInFinder: { code: 'KeyR', meta: true, ctrl: false, alt: false, shift: true },
  copyPath: { code: 'KeyC', meta: true, ctrl: false, alt: true, shift: false },
  toggleAiChat: { code: 'KeyJ', meta: true, ctrl: false, alt: false, shift: false }
};

export const SHORTCUTS_STORAGE_KEY = 'leaflyte.shortcuts';

const MODIFIER_CODES = new Set([
  'MetaLeft',
  'MetaRight',
  'ControlLeft',
  'ControlRight',
  'ShiftLeft',
  'ShiftRight',
  'AltLeft',
  'AltRight'
]);

export function isModifierCode(code: string) {
  return MODIFIER_CODES.has(code);
}

export function chordFromEvent(e: KeyboardEvent): Chord {
  return {
    code: e.code,
    meta: e.metaKey,
    ctrl: e.ctrlKey,
    alt: e.altKey,
    shift: e.shiftKey
  };
}

export function chordsEqual(a: Chord, b: Chord) {
  return (
    a.code === b.code &&
    a.meta === b.meta &&
    a.ctrl === b.ctrl &&
    a.alt === b.alt &&
    a.shift === b.shift
  );
}

export function matchesChord(e: KeyboardEvent, chord: Chord) {
  if (e.code !== chord.code) return false;
  if (e.altKey !== chord.alt || e.shiftKey !== chord.shift) return false;
  if (chord.meta && chord.ctrl) return e.metaKey && e.ctrlKey;
  if (chord.meta && !chord.ctrl) return e.metaKey || e.ctrlKey;
  if (!chord.meta && chord.ctrl) return e.ctrlKey && !e.metaKey;
  return !e.metaKey && !e.ctrlKey;
}

const CODE_LABELS: Record<string, string> = {
  Comma: ',',
  Period: '.',
  Slash: '/',
  Backslash: '\\',
  BracketLeft: '[',
  BracketRight: ']',
  Minus: '-',
  Equal: '=',
  Semicolon: ';',
  Quote: "'",
  Backquote: '`',
  Space: 'Space',
  Enter: 'Enter',
  Escape: 'Esc',
  Tab: 'Tab',
  Backspace: '⌫'
};

function keyLabel(code: string) {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Arrow')) return code.slice(5);
  return CODE_LABELS[code] ?? code;
}

export function formatChord(chord: Chord) {
  const parts: string[] = [];
  if (chord.ctrl) parts.push('Ctrl');
  if (chord.alt) parts.push('⌥');
  if (chord.shift) parts.push('⇧');
  if (chord.meta) parts.push('⌘');
  parts.push(keyLabel(chord.code));
  return parts.join('');
}

export function loadShortcuts(): Record<ActionId, Chord> {
  const merged = { ...DEFAULT_SHORTCUTS };
  try {
    const raw = readLocal(SHORTCUTS_STORAGE_KEY);
    if (!raw) return merged;
    const parsed = JSON.parse(raw) as Partial<Record<ActionId, Chord>>;
    for (const action of SHORTCUT_ACTIONS) {
      const chord = parsed[action.id];
      if (chord?.code) merged[action.id] = chord;
    }
  } catch {
    /* keep defaults */
  }
  return merged;
}

export function saveShortcuts(map: Record<ActionId, Chord>) {
  writeLocal(SHORTCUTS_STORAGE_KEY, JSON.stringify(map));
}

export function conflictFor(
  map: Record<ActionId, Chord>,
  id: ActionId,
  chord: Chord
): ActionId | null {
  for (const action of SHORTCUT_ACTIONS) {
    if (action.id === id) continue;
    if (chordsEqual(map[action.id], chord)) return action.id;
  }
  return null;
}
