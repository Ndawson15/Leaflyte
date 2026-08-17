'use client';

import { useEffect, useRef } from 'react';

export default function VaultTextEditor({
  path,
  value,
  onChange
}: {
  path: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [path]);

  return (
    <textarea
      ref={ref}
      className="leaflyte-text-editor h-full w-full resize-none bg-bg text-text outline-none border-0 p-4 font-mono text-[13px] leading-relaxed"
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
