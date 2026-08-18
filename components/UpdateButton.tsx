'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDownCircle } from 'lucide-react';
import type { Update } from '@tauri-apps/plugin-updater';
import FloatingPopover from '@/components/FloatingPopover';
import { useAppVersion } from '@/hooks/useAppVersion';
import { checkForAppUpdate, installAppUpdate } from '@/lib/updater';
import { isTauri } from '@/lib/vaultClient';

export default function UpdateButton({
  variant = 'inline',
  onNotice
}: {
  variant?: 'inline' | 'rail';
  onNotice?: (message: string) => void;
}) {
  const [update, setUpdate] = useState<Update | null>(null);
  const [open, setOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const appVersion = useAppVersion();

  useEffect(() => {
    if (!isTauri()) return;
    const timer = window.setTimeout(async () => {
      try {
        const found = await checkForAppUpdate();
        if (found) setUpdate(found);
      } catch {
        /* offline or manifest unavailable */
      }
    }, 5000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!update) return null;

  const notes = update.body?.trim() || 'Bug fixes and improvements.';

  const runInstall = async () => {
    setInstalling(true);
    try {
      await installAppUpdate(update);
    } catch (err) {
      onNotice?.(err instanceof Error ? err.message : 'Update failed.');
      setInstalling(false);
    }
  };

  return (
    <div className="relative shrink-0 titlebar-update">
      <button
        ref={buttonRef}
        type="button"
        data-no-drag
        title={`Update available: v${update.version}`}
        aria-label={`Update available: version ${update.version}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`relative flex items-center justify-center rounded-md text-amber hover:bg-surface2 transition-colors ${
          variant === 'rail' ? 'w-7 h-7' : 'w-7 h-7'
        }`}
      >
        <ArrowDownCircle size={16} strokeWidth={1.75} />
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-amber ring-2 ring-surface" />
      </button>

      <FloatingPopover
        anchorRef={buttonRef}
        open={open}
        onClose={() => setOpen(false)}
        placement={variant === 'rail' ? 'right-start' : 'bottom-start'}
        offset={8}
        className="w-72 rounded-lg border border-border bg-surface shadow-xl"
      >
        <div className="px-3 py-2.5 border-b border-border">
          <div className="text-[10px] uppercase tracking-wider text-muted">Update available</div>
          <div className="text-sm text-text font-medium mt-0.5">
            v{update.version}
            <span className="text-muted font-normal"> · you're on v{appVersion}</span>
          </div>
        </div>
        <p className="px-3 py-2.5 text-xs text-muted leading-relaxed">{notes}</p>
        <div className="flex items-center justify-end gap-2 px-3 py-2.5 border-t border-border">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-2.5 py-1 rounded text-xs text-muted hover:text-text hover:bg-surface2"
          >
            Later
          </button>
          <button
            type="button"
            disabled={installing}
            onClick={() => void runInstall()}
            className="px-2.5 py-1 rounded bg-amber text-bg text-xs font-medium hover:opacity-90 disabled:opacity-50"
          >
            {installing ? 'Installing…' : 'Update & restart'}
          </button>
        </div>
      </FloatingPopover>
    </div>
  );
}
