'use client';

import { isTauri } from '@/lib/vaultClient';

export default function TitleDrag({ className = '' }: { className?: string }) {
  return (
    <div
      data-tauri-drag-region
      className={className}
      onDoubleClick={async () => {
        if (!isTauri()) return;
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().toggleMaximize();
      }}
    />
  );
}
