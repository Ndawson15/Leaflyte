'use client';

import { useEffect, useRef } from 'react';
import * as vault from '@/lib/vaultClient';

export function useVaultWatcher(onChange: () => void) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!vault.isTauri()) {
      const id = window.setInterval(() => onChangeRef.current(), 3000);
      return () => window.clearInterval(id);
    }

    let unlisten: (() => void) | undefined;
    (async () => {
      const { listen } = await import('@tauri-apps/api/event');
      unlisten = await listen('vault-changed', () => onChangeRef.current());
    })();

    return () => {
      unlisten?.();
    };
  }, []);
}
