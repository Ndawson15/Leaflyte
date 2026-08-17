'use client';

import { useEffect, useState } from 'react';
import * as vault from '@/lib/vaultClient';

export default function ImageViewer({ path }: { path: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    setError(false);
    vault.getAssetUrl(path).then((url) => {
      if (!cancelled) setSrc(url);
    }).catch(() => {
      if (!cancelled) setError(true);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-muted text-sm">
        Could not load image.
      </div>
    );
  }

  if (!src) {
    return <div className="h-full bg-bg" />;
  }

  return (
    <div className="h-full overflow-auto flex items-center justify-center p-6 bg-bg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={path} className="max-w-full max-h-full object-contain" />
    </div>
  );
}
