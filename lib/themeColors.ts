import type { ThemeId } from '@/lib/themes';
import { readLocal, writeLocal } from '@/lib/storage';

export interface ThemeColors {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  muted: string;
  amber: string;
  teal: string;
}

export type ThemeColorKey = keyof ThemeColors;
export type ThemeOverrides = Partial<ThemeColors>;
export type ThemeOverridesMap = Partial<Record<ThemeId, ThemeOverrides>>;

export const THEME_OVERRIDES_STORAGE_KEY = 'leaflyte.themeOverrides';

export const THEME_COLOR_FIELDS: { key: ThemeColorKey; label: string; hint?: string }[] = [
  { key: 'bg', label: 'Background' },
  { key: 'surface', label: 'Surface', hint: 'Panels and sidebars' },
  { key: 'surface2', label: 'Surface elevated', hint: 'Hover and selection' },
  { key: 'border', label: 'Border' },
  { key: 'text', label: 'Text' },
  { key: 'muted', label: 'Muted text' },
  { key: 'amber', label: 'Accent', hint: 'Links, cursor, highlights' },
  { key: 'teal', label: 'Secondary accent', hint: 'Status and strings' }
];

export const THEME_COLOR_DEFAULTS: Record<ThemeId, ThemeColors> = {
  carbon: {
    bg: '#16171B',
    surface: '#1D1F24',
    surface2: '#25272E',
    border: '#2C2F37',
    text: '#E8E6E1',
    muted: '#8B8D93',
    amber: '#C97A4A',
    teal: '#6FA8A0'
  },
  midnight: {
    bg: '#0E1116',
    surface: '#151A22',
    surface2: '#1C2430',
    border: '#2A3444',
    text: '#E7ECF3',
    muted: '#8B97A8',
    amber: '#E09A5A',
    teal: '#7EC4BB'
  },
  paper: {
    bg: '#F4F1EA',
    surface: '#FFFCF7',
    surface2: '#EDE8DC',
    border: '#D9D2C3',
    text: '#2A2722',
    muted: '#7A7468',
    amber: '#B8612C',
    teal: '#3D7A72'
  },
  sepia: {
    bg: '#F2E6D0',
    surface: '#F8EEDC',
    surface2: '#E8D7B8',
    border: '#D4C09A',
    text: '#3F2E1E',
    muted: '#8A7054',
    amber: '#A6531C',
    teal: '#5A7A62'
  }
};

const CSS_VAR: Record<ThemeColorKey, string> = {
  bg: '--cv-bg',
  surface: '--cv-surface',
  surface2: '--cv-surface2',
  border: '--cv-border',
  text: '--cv-text',
  muted: '--cv-muted',
  amber: '--cv-amber',
  teal: '--cv-teal'
};

export function mergeThemeColors(themeId: ThemeId, overrides?: ThemeOverrides): ThemeColors {
  return { ...THEME_COLOR_DEFAULTS[themeId], ...overrides };
}

export function hasThemeOverrides(overrides?: ThemeOverrides): boolean {
  return Boolean(overrides && Object.keys(overrides).length > 0);
}

export function applyThemeColors(colors: ThemeColors) {
  const root = document.documentElement;
  for (const field of THEME_COLOR_FIELDS) {
    root.style.setProperty(CSS_VAR[field.key], colors[field.key]);
  }
}

export function clearAppliedThemeColors() {
  const root = document.documentElement;
  for (const varName of Object.values(CSS_VAR)) {
    root.style.removeProperty(varName);
  }
}

export function normalizeHex(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const withHash = raw.startsWith('#') ? raw : `#${raw}`;
  if (!/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(withHash)) return null;
  if (withHash.length === 4) {
    const [, r, g, b] = withHash;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return withHash.toUpperCase();
}

export function hexForColorInput(hex: string): string {
  return normalizeHex(hex)?.toLowerCase() ?? '#000000';
}

export function loadThemeOverrides(): ThemeOverridesMap {
  try {
    const raw = readLocal(THEME_OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ThemeOverridesMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveThemeOverrides(map: ThemeOverridesMap) {
  writeLocal(THEME_OVERRIDES_STORAGE_KEY, JSON.stringify(map));
}

export function stripAlpha(hex: string): string {
  const normalized = normalizeHex(hex);
  return normalized ?? hex;
}

export function withAlpha(hex: string, alphaHex: string): string {
  const base = stripAlpha(hex);
  return `${base}${alphaHex}`;
}
