'use client';

import { useEffect, useState } from 'react';
import { buildHtmlPreviewDocument } from '@/lib/htmlPreview';
import * as vault from '@/lib/vaultClient';

export default function HtmlPreview({
  path,
  source,
  readFile
}: {
  path: string;
  source: string;
  readFile: (path: string) => Promise<string>;
}) {
  const [doc, setDoc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDoc(null);
    setError(null);
    void buildHtmlPreviewDocument(source, path, readFile, vault.getAssetUrl)
      .then((next) => {
        if (!cancelled) setDoc(next);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Preview failed');
      });
    return () => {
      cancelled = true;
    };
  }, [path, source, readFile]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-sm text-red-400">{error}</div>
    );
  }

  if (!doc) {
    return <div className="h-full bg-bg" />;
  }

  return (
    <iframe
      title={`Preview of ${path}`}
      sandbox=""
      srcDoc={doc}
      className="h-full w-full border-0 bg-white"
    />
  );
}
