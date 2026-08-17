'use client';

import MonacoEditor from '@monaco-editor/react';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { ensureMonacoLoader } from '@/lib/monacoSetup';
import { isTauri } from '@/lib/vaultClient';

type Props = ComponentProps<typeof MonacoEditor>;

/** Loads Monaco only after Tauri-local loader config (avoids CDN race). */
export default function MonacoSurface(props: Props) {
  const [ready, setReady] = useState(!isTauri());

  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;
    ensureMonacoLoader()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return <div className="h-full bg-bg" aria-hidden="true" />;
  }

  return <MonacoEditor {...props} />;
}
