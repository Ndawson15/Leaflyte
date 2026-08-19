'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

type CodeBlockProps = React.ComponentPropsWithoutRef<'pre'>;

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    const element = node as React.ReactElement<{ children?: React.ReactNode }>;
    return extractText(element.props.children);
  }
  return '';
}

function detectLanguage(className?: string): string {
  const match = className?.match(/language-([\w-]+)/);
  return match?.[1] ?? 'code';
}

export function CodeBlock({ children, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const codeElement = Array.isArray(children) ? children[0] : children;
  const codeProps =
    codeElement && typeof codeElement === 'object' && 'props' in codeElement
      ? (codeElement as React.ReactElement<{ className?: string; children?: React.ReactNode }>).props
      : undefined;

  const language = detectLanguage(codeProps?.className);
  const code = extractText(codeProps?.children ?? children);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code.trim());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="group relative my-6">
      <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-border bg-[#161b22] px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-white/50">{language}</span>
        <button
          type="button"
          onClick={copyCode}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre {...props} className="!mt-0 rounded-t-none rounded-b-xl">
        {children}
      </pre>
    </div>
  );
}
