'use client';

import { isHtmlPath, isMarkdownLikePath } from '@/lib/fileKind';
import HtmlPreview from '@/components/HtmlPreview';
import MarkdownPreview from '@/components/MarkdownPreview';

export default function FilePreview({
  path,
  source,
  readFile,
  onWikiNavigate
}: {
  path: string;
  source: string;
  readFile: (path: string) => Promise<string>;
  onWikiNavigate?: (target: string) => void;
}) {
  if (isMarkdownLikePath(path)) {
    return <MarkdownPreview source={source} onWikiNavigate={onWikiNavigate} mode="reading" />;
  }

  if (isHtmlPath(path)) {
    return <HtmlPreview path={path} source={source} readFile={readFile} />;
  }

  return (
    <div className="h-full flex items-center justify-center px-6 text-sm text-muted">
      No preview available for this file type.
    </div>
  );
}
