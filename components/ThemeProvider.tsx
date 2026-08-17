'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  COLOR_ICONS_STORAGE_KEY,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  isThemeId,
  themeById,
  type Theme,
  type ThemeId
} from '@/lib/themes';
import {
  applyThemeColors,
  clearAppliedThemeColors,
  hasThemeOverrides,
  loadThemeOverrides,
  mergeThemeColors,
  normalizeHex,
  saveThemeOverrides,
  THEME_COLOR_DEFAULTS,
  type ThemeColorKey,
  type ThemeColors,
  type ThemeOverridesMap
} from '@/lib/themeColors';
import { readLocal, writeLocal } from '@/lib/storage';

interface ThemeContextValue {
  themeId: ThemeId;
  theme: Theme;
  setThemeId: (id: ThemeId) => void;
  themeColors: ThemeColors;
  hasCustomColors: boolean;
  monacoTheme: string;
  setThemeColor: (key: ThemeColorKey, value: string) => void;
  resetThemeColors: () => void;
  colorIcons: boolean;
  setColorIcons: (on: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME);
  const [overridesMap, setOverridesMap] = useState<ThemeOverridesMap>({});
  const [colorIcons, setColorIconsState] = useState(false);

  useEffect(() => {
    const storedTheme = readLocal(THEME_STORAGE_KEY);
    if (isThemeId(storedTheme)) setThemeIdState(storedTheme);
    setColorIconsState(readLocal(COLOR_ICONS_STORAGE_KEY) === '1');
    setOverridesMap(loadThemeOverrides());
  }, []);

  const overrides = overridesMap[themeId];
  const themeColors = useMemo(() => mergeThemeColors(themeId, overrides), [themeId, overrides]);
  const hasCustomColors = hasThemeOverrides(overrides);
  const monacoTheme = hasCustomColors ? 'leaflyte-custom' : themeById(themeId).monaco;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId);
    document.documentElement.style.colorScheme = themeById(themeId).colorScheme;
    if (hasCustomColors) {
      applyThemeColors(themeColors);
    } else {
      clearAppliedThemeColors();
    }
  }, [themeId, themeColors, hasCustomColors]);

  useEffect(() => {
    const overlay =
      '__TAURI_INTERNALS__' in window && /Mac/i.test(navigator.userAgent || navigator.platform);
    document.documentElement.classList.toggle('tauri-overlay', overlay);
  }, []);

  const setThemeId = (id: ThemeId) => {
    setThemeIdState(id);
    writeLocal(THEME_STORAGE_KEY, id);
  };

  const setThemeColor = useCallback(
    (key: ThemeColorKey, value: string) => {
      const normalized = normalizeHex(value);
      if (!normalized) return;
      const defaultColor = THEME_COLOR_DEFAULTS[themeId][key];
      setOverridesMap((prev) => {
        const current = { ...(prev[themeId] ?? {}) };
        if (normalized === defaultColor) {
          delete current[key];
        } else {
          current[key] = normalized;
        }
        const next = { ...prev };
        if (Object.keys(current).length === 0) {
          delete next[themeId];
        } else {
          next[themeId] = current;
        }
        saveThemeOverrides(next);
        return next;
      });
    },
    [themeId]
  );

  const resetThemeColors = useCallback(() => {
    setOverridesMap((prev) => {
      if (!prev[themeId]) return prev;
      const next = { ...prev };
      delete next[themeId];
      saveThemeOverrides(next);
      return next;
    });
  }, [themeId]);

  const setColorIcons = (on: boolean) => {
    setColorIconsState(on);
    writeLocal(COLOR_ICONS_STORAGE_KEY, on ? '1' : '0');
  };

  const value = useMemo(
    () => ({
      themeId,
      theme: themeById(themeId),
      setThemeId,
      themeColors,
      hasCustomColors,
      monacoTheme,
      setThemeColor,
      resetThemeColors,
      colorIcons,
      setColorIcons
    }),
    [
      themeId,
      themeColors,
      hasCustomColors,
      monacoTheme,
      setThemeColor,
      resetThemeColors,
      colorIcons
    ]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
