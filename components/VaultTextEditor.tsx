'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export type VaultTextEditorHandle = {
  getValue: () => string;
  setValue: (next: string) => void;
  focus: () => void;
};

const VaultTextEditor = forwardRef<
  VaultTextEditorHandle,
  {
    path: string;
    defaultValue: string;
    onChange: (next: string) => void;
  }
>(function VaultTextEditor({ path, defaultValue, onChange }, ref) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    getValue: () => textareaRef.current?.value ?? '',
    setValue: (next: string) => {
      if (textareaRef.current) textareaRef.current.value = next;
    },
    focus: () => textareaRef.current?.focus()
  }));

  useEffect(() => {
    textareaRef.current?.focus();
  }, [path]);

  return (
    <textarea
      ref={textareaRef}
      className="leaflyte-text-editor h-full w-full resize-none bg-bg text-text outline-none border-0 p-4 font-mono text-[13px] leading-relaxed"
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      defaultValue={defaultValue}
      onChange={(e) => onChange(e.target.value)}
    />
  );
});

export default VaultTextEditor;
