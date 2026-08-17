export type ThemeId = 'carbon' | 'midnight' | 'paper' | 'sepia';

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  monaco: string;
  colorScheme: 'dark' | 'light';
  swatches: [string, string, string];
}

export const THEMES: Theme[] = [
  {
    id: 'carbon',
    name: 'Carbon',
    description: 'The original dark vault',
    monaco: 'leaflyte-carbon',
    colorScheme: 'dark',
    swatches: ['#16171B', '#25272E', '#C97A4A']
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Cooler, higher-contrast dark',
    monaco: 'leaflyte-midnight',
    colorScheme: 'dark',
    swatches: ['#0E1116', '#1C2430', '#E09A5A']
  },
  {
    id: 'paper',
    name: 'Paper',
    description: 'Light, like a printed page',
    monaco: 'leaflyte-paper',
    colorScheme: 'light',
    swatches: ['#F4F1EA', '#EDE8DC', '#B8612C']
  },
  {
    id: 'sepia',
    name: 'Sepia',
    description: 'Warm reading light',
    monaco: 'leaflyte-sepia',
    colorScheme: 'light',
    swatches: ['#F2E6D0', '#E8D7B8', '#A6531C']
  }
];

export const DEFAULT_THEME: ThemeId = 'carbon';
export const THEME_STORAGE_KEY = 'leaflyte.theme';
export const COLOR_ICONS_STORAGE_KEY = 'leaflyte.colorIcons';
export const VAULT_PATH_STORAGE_KEY = 'leaflyte.vaultPath';
export const SIDEBAR_STORAGE_KEY = 'leaflyte.sidebarCollapsed';
export const RIGHT_SIDEBAR_STORAGE_KEY = 'leaflyte.rightSidebarCollapsed';
export const LEFT_WIDTH_KEY = 'leaflyte.leftSidebarWidth';
export const RIGHT_WIDTH_KEY = 'leaflyte.rightSidebarWidth';
export const DEFAULT_LEFT_WIDTH = 240;
export const DEFAULT_RIGHT_WIDTH = 256;
export const RAIL_WIDTH = 40;
export const MIN_SIDEBAR_WIDTH = 180;
export const SNAP_COLLAPSE_WIDTH = 80;
export const MARKDOWN_VIEW_STORAGE_KEY = 'leaflyte.markdownView';

export type MarkdownViewMode = 'read' | 'edit';

export function isMarkdownViewMode(value: string | null): value is MarkdownViewMode {
  return value === 'read' || value === 'edit';
}

export function isThemeId(value: string | null): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

export function themeById(id: ThemeId): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
