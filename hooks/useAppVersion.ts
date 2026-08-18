'use client';

import { useEffect, useState } from 'react';
import { APP_VERSION } from '@/lib/appInfo';
import { isTauri } from '@/lib/vaultClient';

export function useAppVersion() {
  const [version, setVersion] = useState(APP_VERSION);

  useEffect(() => {
    if (!isTauri()) return;
    void import('@tauri-apps/api/app')
      .then(({ getVersion }) => getVersion())
      .then(setVersion)
      .catch(() => {
        /* keep build-time fallback */
      });
  }, []);

  return version;
}
