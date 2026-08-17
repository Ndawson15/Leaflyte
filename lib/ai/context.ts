import { isProbablyText } from '@/lib/fileKind';
import { searchVaultFiles } from '@/lib/vaultSearch';

const MAX_TOTAL = 72_000;
const MAX_PER_FILE = 6_000;

function trimContent(content: string, max: number): string {
  if (content.length <= max) return content;
  return content.slice(0, max) + '\n… [truncated]';
}

export async function buildVaultContext(opts: {
  query: string;
  files: string[];
  activePath: string | null;
  readFile: (path: string) => Promise<string>;
  cache?: Record<string, string>;
  allowEdits?: boolean;
  taggedPaths?: string[];
}): Promise<string> {
  const { query, files, activePath, readFile, cache = {}, allowEdits = false, taggedPaths = [] } = opts;
  const textFiles = files.filter(isProbablyText);
  const sections: string[] = [];
  const included = new Set<string>();
  let budget = MAX_TOTAL;

  const addFile = async (path: string, reason: string) => {
    if (included.has(path) || budget <= 0) return;
    let content = cache[path];
    if (content === undefined) {
      try {
        content = await readFile(path);
      } catch {
        return;
      }
    }
    const trimmed = trimContent(content, Math.min(MAX_PER_FILE, budget));
    budget -= trimmed.length;
    included.add(path);
    sections.push(`### ${path}\n_${reason}_\n\n${trimmed}`);
  };

  if (activePath && isProbablyText(activePath)) {
    await addFile(activePath, 'currently open');
  }

  for (const path of taggedPaths) {
    if (files.includes(path)) await addFile(path, 'tagged by you for this chat');
  }

  const hits = await searchVaultFiles(query, textFiles, readFile, 12);
  for (const hit of hits) {
    await addFile(hit.path, 'matched your question');
  }

  if (textFiles.length <= 24) {
    for (const path of textFiles) {
      await addFile(path, 'vault file');
    }
  }

  const index = textFiles.map((p) => `- ${p}`).join('\n');

  const access = allowEdits
    ? [
        'You can read and propose edits to the user\'s local notes vault. The user must approve every change before it is saved.',
        'To propose a file write or update, include a fenced block exactly like this (path is vault-relative):',
        '',
        '```leaflyte-write',
        '{"path": "folder/note.md", "content": "full new file contents here"}',
        '```',
        '',
        'For multiple files, use a JSON array inside the block. Always include the complete file content, not a diff.',
        'Explain what you changed in plain text outside the block. The user previews edits in the full editor and approves or reverts — never claim a file was saved until they approve.'
      ]
    : [
        'You have read-only access to the user\'s local notes vault. Answer using the note contents below.',
        'If the user asks you to edit files, explain that vault editing is disabled in Settings → AI, or tell them what to change.'
      ];

  return [
    ...access,
    'When referencing a note, mention its path. If the answer is not in the provided notes, say so.',
    taggedPaths.length
      ? `The user tagged these files for this message: ${taggedPaths.join(', ')}. Prioritize them.`
      : '',
    '',
    '## Vault index',
    index || '_No text files._',
    '',
    '## Relevant note contents',
    sections.length ? sections.join('\n\n---\n\n') : '_No note bodies loaded._'
  ].join('\n');
}
