'use client';

import type { editor } from 'monaco-editor';
import {
  Bold,
  Braces,
  ChevronDown,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  SquareCheck,
  Strikethrough
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import FloatingPopover from '@/components/FloatingPopover';
import {
  insertCodeBlock,
  insertHorizontalRule,
  insertLink,
  insertWikiLink,
  setHeading,
  toggleBlockquote,
  toggleBold,
  toggleBulletList,
  toggleInlineCode,
  toggleItalic,
  toggleNumberedList,
  toggleStrikethrough,
  toggleTaskList
} from '@/lib/markdownEdit';

function ToolbarButton({
  title,
  onClick,
  children,
  active = false
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`h-7 min-w-7 px-1.5 inline-flex items-center justify-center rounded-md transition-colors ${
        active
          ? 'text-amber bg-surface2'
          : 'text-muted hover:text-text hover:bg-surface2/80'
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="w-px h-4 bg-border mx-0.5 shrink-0" aria-hidden="true" />;
}

function InlineToolbar({
  editor,
  compact = false
}: {
  editor: editor.IStandaloneCodeEditor;
  compact?: boolean;
}) {
  const run = (action: () => void) => {
    action();
    editor.focus();
  };

  return (
    <>
      <ToolbarButton title="Bold (⌘B)" onClick={() => run(() => toggleBold(editor))}>
        <Bold size={compact ? 14 : 15} strokeWidth={1.75} />
      </ToolbarButton>
      <ToolbarButton title="Italic (⌘I)" onClick={() => run(() => toggleItalic(editor))}>
        <Italic size={compact ? 14 : 15} strokeWidth={1.75} />
      </ToolbarButton>
      <ToolbarButton title="Strikethrough" onClick={() => run(() => toggleStrikethrough(editor))}>
        <Strikethrough size={compact ? 14 : 15} strokeWidth={1.75} />
      </ToolbarButton>
      <ToolbarButton title="Inline code" onClick={() => run(() => toggleInlineCode(editor))}>
        <Code size={compact ? 14 : 15} strokeWidth={1.75} />
      </ToolbarButton>
      <ToolbarButton title="Link" onClick={() => run(() => insertLink(editor))}>
        <Link size={compact ? 14 : 15} strokeWidth={1.75} />
      </ToolbarButton>
    </>
  );
}

function HeadingMenu({ editor }: { editor: editor.IStandaloneCodeEditor }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const pick = (level: 0 | 1 | 2 | 3) => {
    setHeading(editor, level);
    editor.focus();
    setOpen(false);
  };

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        title="Heading"
        aria-label="Heading"
        aria-expanded={open}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((value) => !value)}
        className="h-7 px-1.5 inline-flex items-center gap-0.5 rounded-md text-muted hover:text-text hover:bg-surface2/80 transition-colors"
      >
        <Pilcrow size={15} strokeWidth={1.75} />
        <ChevronDown size={12} strokeWidth={2} />
      </button>
      <FloatingPopover
        anchorRef={anchorRef}
        open={open}
        onClose={() => setOpen(false)}
        placement="bottom-start"
        className="min-w-[148px] rounded-lg border border-border bg-surface shadow-lg py-1"
      >
        <HeadingMenuItem icon={<Pilcrow size={14} />} label="Normal text" onClick={() => pick(0)} />
        <HeadingMenuItem icon={<Heading1 size={14} />} label="Heading 1" onClick={() => pick(1)} />
        <HeadingMenuItem icon={<Heading2 size={14} />} label="Heading 2" onClick={() => pick(2)} />
        <HeadingMenuItem icon={<Heading3 size={14} />} label="Heading 3" onClick={() => pick(3)} />
      </FloatingPopover>
    </>
  );
}

function HeadingMenuItem({
  icon,
  label,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="w-full px-3 py-1.5 flex items-center gap-2 text-left text-xs text-text hover:bg-surface2 transition-colors"
    >
      <span className="text-muted">{icon}</span>
      {label}
    </button>
  );
}

export function MarkdownToolbar({ editor }: { editor: editor.IStandaloneCodeEditor | null }) {
  if (!editor) return null;

  const run = (action: () => void) => {
    action();
    editor.focus();
  };

  return (
    <div className="shrink-0 relative z-30 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="overflow-x-auto px-3 py-1.5">
        <div className="flex items-center gap-0.5 min-w-max">
        <HeadingMenu editor={editor} />
        <ToolbarDivider />
        <InlineToolbar editor={editor} />
        <ToolbarDivider />
        <ToolbarButton title="Bullet list" onClick={() => run(() => toggleBulletList(editor))}>
          <List size={15} strokeWidth={1.75} />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" onClick={() => run(() => toggleNumberedList(editor))}>
          <ListOrdered size={15} strokeWidth={1.75} />
        </ToolbarButton>
        <ToolbarButton title="Task list" onClick={() => run(() => toggleTaskList(editor))}>
          <SquareCheck size={15} strokeWidth={1.75} />
        </ToolbarButton>
        <ToolbarButton title="Quote" onClick={() => run(() => toggleBlockquote(editor))}>
          <Quote size={15} strokeWidth={1.75} />
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton title="Code block" onClick={() => run(() => insertCodeBlock(editor))}>
          <Braces size={15} strokeWidth={1.75} />
        </ToolbarButton>
        <ToolbarButton title="Wiki link" onClick={() => run(() => insertWikiLink(editor))}>
          <span className="text-[11px] font-medium tracking-tight">[[ ]]</span>
        </ToolbarButton>
        <ToolbarButton title="Divider" onClick={() => run(() => insertHorizontalRule(editor))}>
          <Minus size={15} strokeWidth={1.75} />
        </ToolbarButton>
      </div>
      </div>
    </div>
  );
}

export function MarkdownBubbleMenu({
  editor,
  containerRef
}: {
  editor: editor.IStandaloneCodeEditor | null;
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const selection = editor.getSelection();
      const model = editor.getModel();
      const container = containerRef.current;
      if (!selection || !model || selection.isEmpty() || !container) {
        setVisible(false);
        return;
      }

      const text = model.getValueInRange(selection);
      if (!text.trim()) {
        setVisible(false);
        return;
      }

      const anchor = editor.getScrolledVisiblePosition(selection.getEndPosition());
      if (!anchor) {
        setVisible(false);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const width = 220;
      const left = Math.max(8, Math.min(anchor.left - width / 2, containerRect.width - width - 8));
      setCoords({ top: Math.max(8, anchor.top - 44), left });
      setVisible(true);
    };

    const selectionSub = editor.onDidChangeCursorSelection(update);
    const scrollSub = editor.onDidScrollChange(update);
    update();

    return () => {
      selectionSub.dispose();
      scrollSub.dispose();
    };
  }, [editor, containerRef]);

  if (!editor || !visible) return null;

  return (
    <div
      className="absolute z-20 pointer-events-auto rounded-lg border border-border bg-surface shadow-lg px-1 py-1 flex items-center gap-0.5"
      style={{ top: coords.top, left: coords.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <InlineToolbar editor={editor} compact />
    </div>
  );
}
