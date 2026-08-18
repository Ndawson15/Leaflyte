import type { editor } from 'monaco-editor';

const SOURCE = 'markdown-toolbar';

type EditorRange = {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
};

function getModel(editor: editor.IStandaloneCodeEditor) {
  return editor.getModel();
}

function getSelection(editor: editor.IStandaloneCodeEditor) {
  return editor.getSelection();
}

function getSelectionText(editor: editor.IStandaloneCodeEditor) {
  const model = getModel(editor);
  const selection = getSelection(editor);
  if (!model || !selection) return null;
  return { text: model.getValueInRange(selection), selection };
}

function setSelectionOnText(
  editor: editor.IStandaloneCodeEditor,
  startOffset: number,
  length: number
) {
  const model = getModel(editor);
  if (!model) return;
  const start = model.getPositionAt(startOffset);
  const end = model.getPositionAt(startOffset + length);
  editor.setSelection({
    startLineNumber: start.lineNumber,
    startColumn: start.column,
    endLineNumber: end.lineNumber,
    endColumn: end.column
  });
}

function replaceSelection(
  editor: editor.IStandaloneCodeEditor,
  selection: EditorRange,
  text: string
) {
  editor.executeEdits(SOURCE, [{ range: selection, text, forceMoveMarkers: true }]);
}

function lineRange(editor: editor.IStandaloneCodeEditor) {
  const selection = getSelection(editor);
  if (!selection) return { startLine: 1, endLine: 1 };
  return {
    startLine: selection.startLineNumber,
    endLine: selection.endLineNumber
  };
}

function mapSelectedLines(
  editor: editor.IStandaloneCodeEditor,
  transform: (line: string) => string
) {
  const model = getModel(editor);
  if (!model) return;
  const { startLine, endLine } = lineRange(editor);
  const edits: editor.IIdentifiedSingleEditOperation[] = [];

  for (let lineNumber = startLine; lineNumber <= endLine; lineNumber += 1) {
    const line = model.getLineContent(lineNumber);
    const next = transform(line);
    if (next === line) continue;
    edits.push({
      range: {
        startLineNumber: lineNumber,
        startColumn: 1,
        endLineNumber: lineNumber,
        endColumn: line.length + 1
      },
      text: next,
      forceMoveMarkers: true
    });
  }

  if (edits.length === 0) return;
  editor.executeEdits(SOURCE, edits);
  editor.focus();
}

export function wrapSelection(editor: editor.IStandaloneCodeEditor, before: string, after = before) {
  const model = getModel(editor);
  const picked = getSelectionText(editor);
  if (!model || !picked) return;
  const { text, selection } = picked;
  const startOffset = model.getOffsetAt({
    lineNumber: selection.startLineNumber,
    column: selection.startColumn
  });

  if (
    text.length >= before.length + after.length &&
    text.startsWith(before) &&
    text.endsWith(after)
  ) {
    const inner = text.slice(before.length, text.length - after.length);
    replaceSelection(editor, selection, inner);
    setSelectionOnText(editor, startOffset, inner.length);
    editor.focus();
    return;
  }

  const wrapped = text ? `${before}${text}${after}` : `${before}${after}`;
  replaceSelection(editor, selection, wrapped);

  if (!text) {
    setSelectionOnText(editor, startOffset + before.length, 0);
  } else {
    setSelectionOnText(editor, startOffset + before.length, text.length);
  }
  editor.focus();
}

export function toggleBold(editor: editor.IStandaloneCodeEditor) {
  wrapSelection(editor, '**');
}

export function toggleItalic(editor: editor.IStandaloneCodeEditor) {
  wrapSelection(editor, '*');
}

export function toggleStrikethrough(editor: editor.IStandaloneCodeEditor) {
  wrapSelection(editor, '~~');
}

export function toggleInlineCode(editor: editor.IStandaloneCodeEditor) {
  wrapSelection(editor, '`');
}

export function insertLink(editor: editor.IStandaloneCodeEditor) {
  const model = getModel(editor);
  const picked = getSelectionText(editor);
  if (!model || !picked) return;
  const { text, selection } = picked;
  const label = text || 'link text';
  const inserted = `[${label}](url)`;
  const startOffset = model.getOffsetAt({
    lineNumber: selection.startLineNumber,
    column: selection.startColumn
  });
  replaceSelection(editor, selection, inserted);
  const urlStart = startOffset + label.length + 3;
  setSelectionOnText(editor, urlStart, 3);
  editor.focus();
}

export function insertWikiLink(editor: editor.IStandaloneCodeEditor) {
  const model = getModel(editor);
  const picked = getSelectionText(editor);
  if (!model || !picked) return;
  const { text, selection } = picked;
  const target = text || 'Note title';
  const inserted = `[[${target}]]`;
  const startOffset = model.getOffsetAt({
    lineNumber: selection.startLineNumber,
    column: selection.startColumn
  });
  replaceSelection(editor, selection, inserted);
  if (!text) {
    setSelectionOnText(editor, startOffset + 2, target.length);
  }
  editor.focus();
}

export function setHeading(editor: editor.IStandaloneCodeEditor, level: 0 | 1 | 2 | 3) {
  mapSelectedLines(editor, (line) => {
    const stripped = line.replace(/^#{1,6}\s+/, '');
    if (level === 0) return stripped;
    return `${'#'.repeat(level)} ${stripped}`;
  });
}

export function toggleBulletList(editor: editor.IStandaloneCodeEditor) {
  mapSelectedLines(editor, (line) => {
    if (/^[-*+]\s+\[[ xX]\]\s+/.test(line)) {
      return line.replace(/^[-*+]\s+\[[ xX]\]\s+/, '- ');
    }
    if (/^[-*+]\s+/.test(line)) {
      return line.replace(/^[-*+]\s+/, '');
    }
    if (/^\d+\.\s+/.test(line)) {
      return line.replace(/^\d+\.\s+/, '- ');
    }
    return `- ${line}`;
  });
}

export function toggleNumberedList(editor: editor.IStandaloneCodeEditor) {
  mapSelectedLines(editor, (line) => {
    const stripped = line
      .replace(/^[-*+]\s+\[[ xX]\]\s+/, '')
      .replace(/^[-*+]\s+/, '')
      .replace(/^\d+\.\s+/, '');
    if (/^\d+\.\s+/.test(line)) return stripped;
    return `1. ${stripped}`;
  });
}

export function toggleTaskList(editor: editor.IStandaloneCodeEditor) {
  mapSelectedLines(editor, (line) => {
    if (/^[-*+]\s+\[[ xX]\]\s+/.test(line)) {
      return line.replace(/^[-*+]\s+\[[ xX]\]\s+/, '');
    }
    const stripped = line.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '');
    return `- [ ] ${stripped}`;
  });
}

export function toggleBlockquote(editor: editor.IStandaloneCodeEditor) {
  mapSelectedLines(editor, (line) => {
    if (/^>\s?/.test(line)) return line.replace(/^>\s?/, '');
    return `> ${line}`;
  });
}

export function insertCodeBlock(editor: editor.IStandaloneCodeEditor) {
  const model = getModel(editor);
  const picked = getSelectionText(editor);
  if (!model || !picked) return;
  const { text, selection } = picked;
  const block = text.trim() ? `\`\`\`\n${text}\n\`\`\`` : '```\n\n```';
  const startOffset = model.getOffsetAt({
    lineNumber: selection.startLineNumber,
    column: selection.startColumn
  });
  replaceSelection(editor, selection, block);
  if (!text.trim()) {
    setSelectionOnText(editor, startOffset + 4, 0);
  }
  editor.focus();
}

export function insertHorizontalRule(editor: editor.IStandaloneCodeEditor) {
  const picked = getSelectionText(editor);
  if (!picked) return;
  const { selection } = picked;
  replaceSelection(editor, selection, '\n---\n');
  editor.focus();
}
