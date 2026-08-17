import { APP_NAME } from '@/lib/appInfo';
import * as vault from '@/lib/vaultClient';

export const WELCOME_NOTE_PATH = 'Welcome.md';

export function welcomeNoteContent(): string {
  return `# Welcome to ${APP_NAME}

Your notes live as **real files** on disk — \`.md\`, \`.sql\`, \`.ts\`, \`.cfm\`, and more. Syntax highlighting comes from Monaco (the same engine as VS Code), not from fenced code blocks inside markdown.

## Quick start

- Use the **sidebar** to browse, create, and organize notes and folders.
- **Click** a file to preview it; **click again** (or double-click a preview tab) to pin it open.
- Edits save automatically; **⌘S** saves immediately.
- Switch **workspaces** from the menu in the bottom-left corner of the sidebar — each workspace is its own vault folder.

## Link notes together

Type wiki-style links in any file:

\`\`\`
[[Another note]]
\`\`\`

Unresolved links appear dotted; click a resolved link to jump there. When you rename or move a file, ${APP_NAME} updates links across your vault.

Try linking to a new note: [[My first note]]

## Tags

Add \`#tags\` anywhere in a file (e.g. #ideas #project). Open a note and check the **Links** panel on the right for tags, backlinks, and outgoing links.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| ⌘K | Jump to note (quick switcher) |
| ⌘P | Command palette |
| ⌘J | AI chat |
| ⌘B | Toggle vault sidebar |
| ⌘⇧B | Toggle links sidebar |
| ⌘⇧E | Toggle read / edit (markdown & HTML) |
| ⌘, | Settings |
| ⌘N | New file |
| ⌘⇧N | New folder |

Customize shortcuts in **Settings → Shortcuts**.

## HTML notes

Create \`.html\` files in your vault. In **read mode**, Leaflyte renders them in a live preview. Link a stylesheet from the same folder:

\`\`\`html
<link rel="stylesheet" href="styles.css">
\`\`\`

Relative paths resolve from the HTML file's location. Use the **eye icon** (upper right) or **⌘⇧E** to switch between read and edit.

## AI chat

Press **⌘J** to ask questions about your vault — summaries, connections, where something is mentioned, or help drafting from existing notes. Add an API key under **Settings → AI**. Chat history is saved on this device.

When **Allow file edits** is on, the assistant can propose changes. Click **Preview** in chat to apply them temporarily in the editor, then **Approve** or **Revert** from the banner above the note.

Type **@** in the chat input to tag a file, or drag a note from the sidebar into the chat area. Tagged files are included as context for your question.

## Search & commands

- **⌘K** searches file names and note contents.
- **⌘P** opens the command palette for actions like creating files, switching workspaces, and opening settings.

## Themes

**Settings → Theme** offers several palettes and optional per-color overrides. Icons can reflect file types when enabled.

---

Delete this file anytime — it is yours. Your vault folder is plain files, so you can edit them outside ${APP_NAME} too; changes sync when you switch back to the app.
`;
}

export async function seedWelcomeNote(): Promise<{ created: boolean }> {
  try {
    await vault.readFile(WELCOME_NOTE_PATH);
    return { created: false };
  } catch {
    await vault.writeFile(WELCOME_NOTE_PATH, welcomeNoteContent());
    return { created: true };
  }
}
