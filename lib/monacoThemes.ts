import type { ThemeColors } from '@/lib/themeColors';
import { stripAlpha, withAlpha } from '@/lib/themeColors';

type Monaco = typeof import('monaco-editor');

const FLAG = '__leaflyteMonacoThemes';

function hexNoHash(hex: string) {
  return stripAlpha(hex).slice(1);
}

const CFML_DARK = [
  { token: 'tag.cfml', foreground: 'C97A4A' },
  { token: 'keyword.cfml', foreground: 'B07AC9' },
  { token: 'variable.hash', foreground: '6FA8A0' }
];

const CFML_LIGHT = [
  { token: 'tag.cfml', foreground: 'B8612C' },
  { token: 'keyword.cfml', foreground: '7A3D9A' },
  { token: 'variable.hash', foreground: '3D7A72' }
];

export function ensureMonacoThemes(monaco: Monaco) {
  const g = monaco as Monaco & { [FLAG]?: boolean };
  if (g[FLAG]) return;
  g[FLAG] = true;

  monaco.editor.defineTheme('leaflyte-carbon', {
    base: 'vs-dark',
    inherit: true,
    rules: CFML_DARK,
    colors: {
      'editor.background': '#1D1F24',
      'editor.foreground': '#E8E6E1',
      'editor.lineHighlightBackground': '#25272E',
      'editor.selectionBackground': '#C97A4A40',
      'editorCursor.foreground': '#C97A4A',
      'editorLineNumber.foreground': '#8B8D93',
      'editorLineNumber.activeForeground': '#E8E6E1',
      'editorGutter.background': '#1D1F24',
      'editorWidget.background': '#25272E',
      'editorWidget.border': '#2C2F37'
    }
  });

  monaco.editor.defineTheme('leaflyte-midnight', {
    base: 'vs-dark',
    inherit: true,
    rules: CFML_DARK,
    colors: {
      'editor.background': '#151A22',
      'editor.foreground': '#E7ECF3',
      'editor.lineHighlightBackground': '#1C2430',
      'editor.selectionBackground': '#E09A5A40',
      'editorCursor.foreground': '#E09A5A',
      'editorLineNumber.foreground': '#8B97A8',
      'editorLineNumber.activeForeground': '#E7ECF3',
      'editorGutter.background': '#151A22',
      'editorWidget.background': '#1C2430',
      'editorWidget.border': '#2A3444'
    }
  });

  monaco.editor.defineTheme('leaflyte-paper', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '7A7468', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'B8612C' },
      { token: 'string', foreground: '3D7A72' },
      ...CFML_LIGHT
    ],
    colors: {
      'editor.background': '#FFFcf7',
      'editor.foreground': '#2A2722',
      'editor.lineHighlightBackground': '#EDE8DC',
      'editor.selectionBackground': '#D9D2C380',
      'editorCursor.foreground': '#B8612C',
      'editorLineNumber.foreground': '#7A7468',
      'editorLineNumber.activeForeground': '#2A2722',
      'editorGutter.background': '#FFFcf7',
      'editorWidget.background': '#F4F1EA',
      'editorWidget.border': '#D9D2C3'
    }
  });

  monaco.editor.defineTheme('leaflyte-sepia', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8A7054', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'A6531C' },
      { token: 'string', foreground: '5A7A62' },
      { token: 'number', foreground: 'A6531C' },
      ...CFML_LIGHT
    ],
    colors: {
      'editor.background': '#F8EEDC',
      'editor.foreground': '#3F2E1E',
      'editor.lineHighlightBackground': '#E8D7B8',
      'editor.selectionBackground': '#D4C09A99',
      'editorCursor.foreground': '#A6531C',
      'editorLineNumber.foreground': '#8A7054',
      'editorLineNumber.activeForeground': '#3F2E1E',
      'editorGutter.background': '#F8EEDC',
      'editorWidget.background': '#F2E6D0',
      'editorWidget.border': '#D4C09A',
      'editorIndentGuide.background': '#D4C09A',
      'editorIndentGuide.activeBackground': '#A6531C66'
    }
  });
}

export function registerCustomMonacoTheme(monaco: Monaco, colors: ThemeColors, dark: boolean) {
  const amber = hexNoHash(colors.amber);
  const teal = hexNoHash(colors.teal);
  const muted = hexNoHash(colors.muted);
  const text = hexNoHash(colors.text);

  monaco.editor.defineTheme('leaflyte-custom', {
    base: dark ? 'vs-dark' : 'vs',
    inherit: true,
    rules: dark
      ? [
          { token: 'tag.cfml', foreground: amber },
          { token: 'keyword.cfml', foreground: 'B07AC9' },
          { token: 'variable.hash', foreground: teal }
        ]
      : [
          { token: 'comment', foreground: muted, fontStyle: 'italic' },
          { token: 'keyword', foreground: amber },
          { token: 'string', foreground: teal },
          { token: 'tag.cfml', foreground: amber },
          { token: 'keyword.cfml', foreground: '7A3D9A' },
          { token: 'variable.hash', foreground: teal }
        ],
    colors: {
      'editor.background': colors.surface,
      'editor.foreground': colors.text,
      'editor.lineHighlightBackground': colors.surface2,
      'editor.selectionBackground': withAlpha(colors.amber, dark ? '40' : '80'),
      'editorCursor.foreground': colors.amber,
      'editorLineNumber.foreground': colors.muted,
      'editorLineNumber.activeForeground': colors.text,
      'editorGutter.background': colors.surface,
      'editorWidget.background': colors.surface2,
      'editorWidget.border': colors.border,
      ...(dark
        ? {}
        : {
            'editorIndentGuide.background': colors.border,
            'editorIndentGuide.activeBackground': withAlpha(colors.amber, '66')
          })
    }
  });
}
