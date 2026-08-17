'use client';

import { useEffect, useState } from 'react';
import {
  THEME_COLOR_DEFAULTS,
  THEME_COLOR_FIELDS,
  hexForColorInput,
  normalizeHex,
  type ThemeColorKey,
  type ThemeColors
} from '@/lib/themeColors';
import { useTheme } from '@/components/ThemeProvider';
import type { ThemeId } from '@/lib/themes';

function ColorField({
  label,
  hint,
  value,
  defaultValue,
  customized,
  onChange
}: {
  label: string;
  hint?: string;
  value: string;
  defaultValue: string;
  customized: boolean;
  onChange: (hex: string) => void;
}) {
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const commit = (raw: string) => {
    const normalized = normalizeHex(raw);
    if (normalized) {
      setText(normalized);
      onChange(normalized);
    } else {
      setText(value);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm text-text">{label}</label>
        {customized && <span className="text-[10px] uppercase tracking-wider text-amber">Custom</span>}
      </div>
      {hint && <p className="text-[11px] text-muted -mt-0.5">{hint}</p>}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hexForColorInput(value)}
          onChange={(e) => commit(e.target.value)}
          aria-label={`${label} color picker`}
          className="h-9 w-10 shrink-0 cursor-pointer rounded border border-border bg-bg p-0.5"
        />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => commit(text)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit(text);
            }
          }}
          spellCheck={false}
          className="min-w-0 flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text font-mono outline-none focus:border-muted"
        />
        {customized && (
          <button
            type="button"
            onClick={() => onChange(defaultValue)}
            title="Reset to template default"
            className="shrink-0 rounded-md border border-border px-2 py-2 text-[11px] text-muted hover:text-text hover:border-muted"
          >
            ↺
          </button>
        )}
      </div>
    </div>
  );
}

export default function ThemeColorEditor() {
  const { themeId, theme, themeColors, hasCustomColors, setThemeColor, resetThemeColors } = useTheme();
  const defaults = THEME_COLOR_DEFAULTS[themeId as ThemeId];

  return (
    <div className="border border-border rounded-lg bg-surface">
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border">
        <div>
          <div className="text-sm text-text">Customize {theme.name}</div>
          <p className="text-[11px] text-muted mt-0.5">
            Override individual colors with a picker or hex value. Saved per template.
          </p>
        </div>
        {hasCustomColors && (
          <button
            type="button"
            onClick={resetThemeColors}
            className="shrink-0 text-[11px] px-2.5 py-1.5 rounded border border-border text-muted hover:text-text hover:border-muted"
          >
            Reset all
          </button>
        )}
      </div>
      <div className="p-4 grid gap-4 sm:grid-cols-2">
        {THEME_COLOR_FIELDS.map((field) => (
          <ColorField
            key={field.key}
            label={field.label}
            hint={field.hint}
            value={themeColors[field.key]}
            defaultValue={defaults[field.key]}
            customized={themeColors[field.key] !== defaults[field.key]}
            onChange={(hex) => setThemeColor(field.key as ThemeColorKey, hex)}
          />
        ))}
      </div>
      <div className="px-4 pb-4">
        <div className="rounded-md border border-border overflow-hidden">
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted border-b border-border bg-bg">
            Preview
          </div>
          <PreviewStrip colors={themeColors} />
        </div>
      </div>
    </div>
  );
}

function PreviewStrip({ colors }: { colors: ThemeColors }) {
  return (
    <div className="grid grid-cols-4 text-xs" style={{ background: colors.bg, color: colors.text }}>
      <div className="p-3 border-r" style={{ background: colors.surface, borderColor: colors.border }}>
        <div className="font-medium">Sidebar</div>
        <div style={{ color: colors.muted }}>muted label</div>
      </div>
      <div className="col-span-2 p-3 border-r" style={{ borderColor: colors.border }}>
        <div>Editor text</div>
        <div style={{ color: colors.amber }}>accent link</div>
        <div
          className="mt-2 inline-block px-2 py-0.5 rounded"
          style={{ background: colors.surface2, color: colors.teal }}
        >
          chip
        </div>
      </div>
      <div className="p-3" style={{ background: colors.surface2 }}>
        <div style={{ color: colors.teal }}>saved</div>
        <div className="mt-2 h-2 rounded" style={{ background: colors.border }} />
      </div>
    </div>
  );
}
