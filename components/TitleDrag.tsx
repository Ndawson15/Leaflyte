'use client';

import { isTauri } from '@/lib/vaultClient';

const INTERACTIVE =
  'button, a, input, select, textarea, [contenteditable="true"], .leaflyte-text-editor, [data-no-drag]';

export default function TitleDrag({ className = '' }: { className?: string }) {
  return (
    <div
      data-no-drag
      className={className}
      onMouseDown={(e) => {
        if (!isTauri() || e.button !== 0) return;
        if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
        void (async () => {
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          const win = getCurrentWindow();
          if (e.detail === 2) await win.toggleMaximize();
          else await win.startDragging();
        })();
      }}
    />
  );
}
