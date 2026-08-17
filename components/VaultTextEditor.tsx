'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';

export type VaultTextEditorHandle = {
  getValue: () => string;
  setValue: (next: string) => void;
  focus: () => void;
};

function placeCaretAtEnd(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

const VaultTextEditor = forwardRef<
  VaultTextEditorHandle,
  {
    path: string;
    defaultValue: string;
    onChange: (next: string) => void;
  }
>(function VaultTextEditor({ defaultValue, onChange }, ref) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => ({
    getValue: () => editorRef.current?.innerText ?? '',
    setValue: (next: string) => {
      if (editorRef.current) editorRef.current.innerText = next;
    },
    focus: () => {
      editorRef.current?.focus();
      if (editorRef.current) placeCaretAtEnd(editorRef.current);
    }
  }));

  const mountEditor = (el: HTMLDivElement | null) => {
    editorRef.current = el;
    if (!el) return;
    el.innerText = defaultValue;
    requestAnimationFrame(() => {
      if (!el.isConnected) return;
      el.focus();
      placeCaretAtEnd(el);
    });
  };

  return (
    <div
      ref={mountEditor}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      spellCheck={false}
      className="leaflyte-text-editor h-full w-full overflow-auto bg-bg text-text outline-none border-0 p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words"
      onInput={(e) => onChange(e.currentTarget.innerText)}
      onPaste={(e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
      }}
      onMouseDown={(e) => e.stopPropagation()}
    />
  );
});

export default VaultTextEditor;
