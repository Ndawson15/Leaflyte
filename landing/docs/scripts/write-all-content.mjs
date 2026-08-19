import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const contentDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'content');

const pages = {
  'getting-started/what-is-leaflyte.mdx': `---
title: What is Leaflyte
description: A local-first notes app where every note is a real file — edited with Monaco, linked with wikilinks, and owned by you.
category: Guide
lastUpdated: August 19, 2026
---

## Overview

Leaflyte is a local-first notes app inspired by Obsidian, built for developers and power users who want **real files on disk** instead of a proprietary database. Your vault is a folder — markdown, SQL, HTML, Python, CFML, or anything else — edited with the same Monaco engine that powers VS Code.

Unlike cloud note apps, Leaflyte never uploads your vault. The desktop app reads and writes files directly through Tauri/Rust. In development mode, a local Next.js server on port **1420** exposes the same UI and HTTP APIs.

<Callout variant="note">
Leaflyte is actively developed (v0.2.x). Self-hosted sync and official Docker images are on the roadmap — today the primary experience is the **desktop app** plus optional local web dev.
</Callout>

## Who Leaflyte is for

- **Developers** who live in Monaco/VS Code and want notes beside code snippets with correct syntax highlighting
- **Technical writers** who need GFM markdown, Mermaid diagrams, and split preview
- **Obsidian refugees** who want wikilinks, backlinks, and tags without a subscription
- **Homelab users** planning to self-host a web UI behind a reverse proxy (see [Self-Hosting Requirements](/getting-started/self-hosting-requirements/))

## Core ideas

| Concept | What it means |
|---------|---------------|
| **Vault** | A folder on disk. Default \`./vault\` in dev; \`Documents/Leaflyte\` in packaged desktop builds |
| **Wikilinks** | \`[[note-name]]\` or \`[[path/note\\|label]]\` in any file type |
| **Tags** | \`#tag\` anywhere in a file — surfaced in the backlinks panel |
| **Workspaces** | Multiple vault folders, each with its own tabs and session state |
| **Real extensions** | \`.sql\`, \`.ts\`, \`.cfm\`, \`.py\` — not fenced code blocks in markdown |

## Desktop vs web

| Mode | How to run | File I/O |
|------|------------|----------|
| **Desktop (Tauri)** | Install from [leaflyte.app](https://leaflyte.app) or \`npm run tauri:dev\` | Rust commands — no Node at runtime |
| **Web dev** | \`npm run dev\` → \`http://127.0.0.1:1420\` | Next.js API routes under \`/api/*\` |
| **LAN dev** | \`npm run dev:lan\` | Same APIs, bound to \`0.0.0.0\` for capture from other machines |

## What's next

Leaflyte's roadmap includes optional self-hosted sync, Tailscale-friendly remote access, and SQLite FTS5 for very large vaults. See [Changelog](/changelog/) for release history.
`,

  'getting-started/quick-start.mdx': `---
title: Quick Start
description: Download Leaflyte, create your first vault, and start writing notes in under five minutes.
category: Tutorial
lastUpdated: August 19, 2026
---

## Overview

This guide walks you through installing Leaflyte, choosing a vault folder, and creating your first note. No account or cloud setup required.

## Install Leaflyte

1. **Download the installer** — Go to [leaflyte.app](https://leaflyte.app) and download the build for macOS (.dmg), Windows (.exe), or Linux (.AppImage / .deb).

2. **Open the app** — Launch Leaflyte from Applications or your Start menu.

3. **Choose a vault folder** — On first launch, select an empty folder or an existing notes directory. Everything Leaflyte creates is a plain file inside this folder.

<Callout variant="tip">
Already have markdown notes? Point Leaflyte at that folder — there is no import wizard. Your files appear in the sidebar immediately.
</Callout>

## Create your first note

1. **Create a note** — Press \`Cmd+N\` (macOS) or \`Ctrl+N\` (Windows/Linux), or use the sidebar **New file** action.

2. **Write content** — Type markdown, code, or any supported file type. Use \`[[wikilinks]]\` to connect ideas.

3. **Preview markdown** — Open a \`.md\` file and press \`Cmd+Shift+E\` to cycle **edit → split → read** view.

\`\`\`markdown
# Daily standup

- [ ] Review PRs
- [x] Ship docs update

Related: [[projects/leaflyte/roadmap]]
\`\`\`

## Optional — run from source

Developers can run Leaflyte locally without installing the desktop build:

\`\`\`bash
git clone https://github.com/Ndawson15/Leaflyte.git
cd Leaflyte
npm install
npm run dev
\`\`\`

Open \`http://127.0.0.1:1420\`. Notes are stored in \`./vault\`.

For the desktop shell during development:

\`\`\`bash
npm run tauri:dev
\`\`\`

## Connect VS Code capture

1. **Install** the [Leaflyte Capture](https://marketplace.visualstudio.com/items?itemName=Leaflyte.leaflyte-capture) extension.

2. **Start Leaflyte** with \`npm run dev\` or \`npm run tauri:dev\` so the capture API is available on port **1420**.

3. **Capture a selection** — Highlight code and press \`Cmd+Shift+L\`. A new file appears in your vault's \`captures/\` folder.

## Next steps

- [Creating & Organizing Notes](/core-features/creating-organizing-notes/) — Folders, wikilinks, workspaces
- [Markdown Support](/core-features/markdown-support/) — GFM, Mermaid, task lists
- [Themes](/customization/themes/) — Carbon, Midnight, Paper, Sepia
`,

  'getting-started/self-hosting-requirements.mdx': `---
title: Self-Hosting Requirements
description: Hardware, software, and network requirements for running Leaflyte as a local web service.
category: Reference
lastUpdated: August 19, 2026
---

## Overview

Leaflyte's **primary** distribution is the desktop app. Self-hosting means running the Next.js UI against a vault directory on a server you control — useful for always-on access on a home lab or NAS, typically behind a reverse proxy with authentication.

<Callout variant="warning">
Official Docker images and in-app sync are not released yet. Self-hosting today means building from source or containerizing the Next.js app yourself. See [Deployment](/deployment/docker/) for patterns.
</Callout>

## Minimum requirements

| Resource | Recommendation |
|----------|----------------|
| **CPU** | 1 vCPU (2+ for AI proxy workloads) |
| **RAM** | 512 MB idle; 1 GB+ with large vaults |
| **Storage** | Vault size + 500 MB for Node/build artifacts |
| **OS** | Linux (recommended), macOS, or Windows with Node 20+ |

## Software dependencies

- **Node.js** 20.x or 22.x
- **npm** (ships with Node)
- Optional: **Rust toolchain** only if you build the Tauri desktop app on the same machine

## Network

| Port | Purpose |
|------|---------|
| **1420** | Default dev server (\`npm run dev\`) |
| **4000** | Production \`next start\` (see \`package.json\`) |

<Callout variant="note">
The dev server binds to \`127.0.0.1\` by default. Use \`npm run dev:lan\` to bind \`0.0.0.0\` — only on networks you trust, or place authentication in front via [Reverse Proxy / SSL](/deployment/reverse-proxy-ssl/).
</Callout>

## Vault storage

- Use a **persistent volume** or bind mount for the vault path
- Set \`VAULT_DIR\` to an absolute path (see [Environment Variables](/deployment/environment-variables/))
- Leaflyte ignores \`.git\`, \`node_modules\`, dotfiles, and paths matched by \`.gitignore\`

## Security checklist

1. Do **not** expose port 1420/4000 to the public internet without auth
2. Terminate TLS at Caddy, nginx, or Traefik
3. AI API keys stay in **browser localStorage** — never in server env vars
4. Run the process as a non-root user with write access only to the vault directory

## Related

- [Docker](/deployment/docker/) — Container deployment patterns
- [Authentication](/accounts-access/authentication/) — Securing a self-hosted instance
- [Backups & Restore](/data-storage/backups-restore/) — Protecting vault data
`,

  'deployment/docker.mdx': `---
title: Docker
description: Run Leaflyte as a containerized Next.js service with a persistent vault volume.
category: Guide
lastUpdated: August 19, 2026
---

## Overview

Leaflyte does not ship an official Docker image yet. This guide shows how to containerize the Next.js app from source so you can run it on a home server, NAS, or cloud VM with a bind-mounted vault.

<Callout variant="note">
For daily use, the **desktop app** is the recommended experience. Docker is for operators who want a browser-accessible instance on their network.
</Callout>

## Prerequisites

- Docker Engine 24+ or Docker Desktop
- Git clone of the [Leaflyte repository](https://github.com/Ndawson15/Leaflyte)
- Host directory for vault data (e.g. \`/data/leaflyte/vault\`)

## Dockerfile example

Create \`Dockerfile\` in the repo root:

\`\`\`dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV VAULT_DIR=/vault
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 4000
CMD ["node", "server.js"]
\`\`\`

<Callout variant="warning">
You may need to enable \`output: 'standalone'\` in \`next.config.mjs\` for container builds. The default Tauri build uses static export instead.
</Callout>

## Run the container

1. **Create a vault directory** on the host:

\`\`\`bash
mkdir -p /data/leaflyte/vault
\`\`\`

2. **Build and start**:

\`\`\`bash
docker build -t leaflyte .
docker run -d \\
  --name leaflyte \\
  -p 4000:4000 \\
  -v /data/leaflyte/vault:/vault \\
  -e VAULT_DIR=/vault \\
  leaflyte
\`\`\`

3. **Open** \`http://localhost:4000\` on the host (or your reverse-proxy URL).

## Next steps

- [Docker Compose Reference](/deployment/docker-compose-reference/) — Production Compose file
- [Unraid](/deployment/unraid/) — Template for Unraid users
- [Reverse Proxy / SSL](/deployment/reverse-proxy-ssl/) — HTTPS and auth
`,

  'deployment/unraid.mdx': `---
title: Unraid
description: Deploy Leaflyte on Unraid using Docker Compose and a persistent vault share.
category: Guide
lastUpdated: August 19, 2026
---

## Overview

Run Leaflyte on Unraid by building the Docker image on your server (or pulling from a registry you maintain) and mapping a share to \`/vault\`.

## Steps

1. **Create a share** — e.g. \`/mnt/user/appdata/leaflyte/vault\` for note storage.

2. **Add a Docker Compose stack** in Unraid (Compose Plugin) using the file from [Docker Compose Reference](/deployment/docker-compose-reference/).

3. **Set environment** — \`VAULT_DIR=/vault\` and map the share:

\`\`\`yaml
volumes:
  - /mnt/user/appdata/leaflyte/vault:/vault
\`\`\`

4. **Publish port** \`4000:4000\` (or route through nginx Proxy Manager on 443).

5. **Add authentication** — Leaflyte has no built-in login for web mode. Put Authelia, Authentik, or NPM access lists in front. See [Authentication](/accounts-access/authentication/).

## Tips

- Pin a specific image tag instead of \`:latest\` when you maintain your own builds
- Schedule [Backups & Restore](/data-storage/backups-restore/) of the vault share with Unraid CA Backup or rsync
- Use Tailscale on Unraid for remote access without opening ports publicly
`,

  'deployment/docker-compose-reference.mdx': `---
title: Docker Compose Reference
description: Complete Docker Compose configuration for a self-hosted Leaflyte instance.
category: Reference
lastUpdated: August 19, 2026
---

## Overview

Reference Compose file for running Leaflyte with a persistent vault, restart policy, and optional health check.

## Basic stack

\`\`\`yaml
services:
  leaflyte:
    build: .
    image: leaflyte:local
    container_name: leaflyte
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      NODE_ENV: production
      VAULT_DIR: /vault
    volumes:
      - ./vault:/vault
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:4000/"]
      interval: 30s
      timeout: 5s
      retries: 3
\`\`\`

## With reverse proxy (Caddy sidecar)

\`\`\`yaml
services:
  leaflyte:
    build: .
    restart: unless-stopped
    environment:
      VAULT_DIR: /vault
    volumes:
      - ./vault:/vault
    expose:
      - "4000"

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on:
      - leaflyte

volumes:
  caddy_data:
\`\`\`

See [Reverse Proxy / SSL Setup](/deployment/reverse-proxy-ssl/) for Caddyfile examples.

## Resource limits (optional)

\`\`\`yaml
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 1G
\`\`\`

## Environment reference

All supported variables are listed in [Environment Variables](/deployment/environment-variables/).
`,

  'deployment/environment-variables.mdx': `---
title: Environment Variables
description: Environment variables for Leaflyte web/server deployments and build tooling.
category: Reference
lastUpdated: August 19, 2026
---

## Overview

Leaflyte stores user preferences and AI keys in **browser localStorage**, not server environment variables. Server env vars mainly control vault path and build behavior.

## Runtime variables

| Variable | Default | Description |
|----------|---------|-------------|
| \`VAULT_DIR\` | \`./vault\` | Absolute or relative path to the notes vault on disk |
| \`NODE_ENV\` | \`development\` | \`production\` for \`next start\` deployments |
| \`PORT\` | \`4000\` | Port for \`next start\` (see \`package.json\`) |

### Example \`.env.local\`

\`\`\`bash
VAULT_DIR=/data/leaflyte/vault
\`\`\`

Copy from \`.env.example\` at the repo root. Keep \`.env.local\` out of git.

## Build / Tauri variables

| Variable | Purpose |
|----------|---------|
| \`TAURI=1\` | Enables static export for Tauri desktop builds |
| \`NEXT_DIST_DIR\` | Custom Next.js output directory |
| \`TAURI_SIGNING_PRIVATE_KEY\` | Desktop updater signing (release builds) |
| \`TAURI_SIGNING_PRIVATE_KEY_PASSWORD\` | Password for signing key, if encrypted |

## What is NOT configured via env

<Callout variant="warning">
Never put AI API keys in server environment variables. Configure them in **Settings → AI** inside the app — they are stored in localStorage only.
</Callout>

- Anthropic / OpenAI / local LLM endpoints
- Theme and editor preferences
- Workspace list and tab state

## Docker mapping

\`\`\`yaml
environment:
  VAULT_DIR: /vault
volumes:
  - /host/path/to/vault:/vault
\`\`\`
`,

  'deployment/reverse-proxy-ssl.mdx': `---
title: Reverse Proxy / SSL Setup
description: Put Leaflyte behind Caddy, nginx, or Traefik for HTTPS and authentication.
category: Guide
lastUpdated: August 19, 2026
---

## Overview

Leaflyte's web/dev server has **no built-in authentication**. For any network beyond localhost, terminate TLS and enforce auth at the reverse proxy.

## Caddy (recommended)

\`\`\`caddy
notes.example.com {
  reverse_proxy leaflyte:4000
}
\`\`\`

Caddy obtains and renews Let's Encrypt certificates automatically.

### With basic auth

\`\`\`caddy
notes.example.com {
  basicauth {
    admin $2a$14$...  # caddy hash-password
  }
  reverse_proxy 127.0.0.1:4000
}
\`\`\`

## nginx

\`\`\`nginx
server {
  listen 443 ssl http2;
  server_name notes.example.com;

  ssl_certificate     /etc/letsencrypt/live/notes.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/notes.example.com/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
\`\`\`

## WebSocket / hot reload

Development (\`npm run dev\`) uses HMR WebSockets. Production \`next start\` serves static+SSR without HMR — standard reverse-proxy headers above are sufficient.

## Tailscale

For personal remote access, serve Leaflyte on your tailnet without public DNS:

\`\`\`bash
tailscale serve --bg --https=443 http://127.0.0.1:4000
\`\`\`

## Related

- [Authentication](/accounts-access/authentication/) — Auth strategies
- [Self-Hosting Requirements](/getting-started/self-hosting-requirements/)
`,

  'core-features/creating-organizing-notes.mdx': `---
title: Creating & Organizing Notes
description: Vault folders, wikilinks, workspaces, tabs, and file operations in Leaflyte.
category: Tutorial
lastUpdated: August 19, 2026
---

## Overview

Leaflyte mirrors your vault as a folder tree. Creating, renaming, and moving items updates real files on disk — compatible with git, Obsidian, or any file sync tool you add later.

## Vault layout

\`\`\`text
vault/
├── inbox/
├── projects/
│   └── leaflyte/
│       ├── roadmap.md
│       └── api-notes.ts
└── daily/
    └── 2026-08-19.md
\`\`\`

<Callout variant="note">
External edits are detected. The desktop app watches the filesystem; web dev polls every few seconds.
</Callout>

## Create files and folders

1. **New file** — \`Cmd+N\` / \`Ctrl+N\`, or sidebar actions. Files are created in the currently selected folder.

2. **New folder** — Use the sidebar folder action. Leaflyte creates the directory immediately on disk.

3. **Rename or move** — Context menu or drag in the sidebar. Wikilinks and embeds update when paths change.

## Wikilinks and backlinks

Link notes with \`[[target]]\` or \`[[folder/note|display label]]\` inside any file type — markdown, SQL comments, HTML, etc.

The **backlinks panel** (right side) shows:

- Notes that link **to** the open file
- Notes the open file links **out** to
- **Tags** extracted from the file

## Workspaces

**Settings → Workspaces** lets you register multiple vault folders. Each workspace keeps its own tabs and navigation state in localStorage.

1. **Add workspace** — Choose a folder path (desktop) or path string (web dev)
2. **Switch** — Workspace switcher in the sidebar header
3. **Remove** — Removes from Leaflyte only; does not delete files on disk

## Tabs and navigation

| Action | Shortcut |
|--------|----------|
| Quick switcher | \`Cmd+K\` / \`Ctrl+K\` |
| Command palette | \`Cmd+Shift+P\` |
| Close tab | \`Cmd+W\` |

<Figure src="/docs/assets/app-screenshot.png" alt="Leaflyte editor" caption="Sidebar vault tree, Monaco editor, and split markdown preview." />

## Related

- [Tags & Folders](/core-features/tags-folders/)
- [Search](/core-features/search/)
- [Attachments](/core-features/attachments/)
`,

  'core-features/search.mdx': `---
title: Search
description: Quick switcher, query filters, regex search, and vault-wide find-and-replace.
category: Guide
lastUpdated: August 19, 2026
---

## Overview

Leaflyte search is built into the **Quick Switcher** (\`Cmd+K\` / \`Ctrl+K\`) and a dedicated **Find and replace in vault** command. Search scans filenames and file contents across the active vault.

## Quick switcher

Press \`Cmd+K\` to fuzzy-jump to any file. Type to filter — scoring considers filename, path, content snippets, and tags.

## Query filters

| Filter | Example | Matches |
|--------|---------|---------|
| Extension | \`ext:md\` or \`ext:ts,sql\` | Files by extension |
| Path | \`path:runbooks/\` | Files under a folder |
| Regex | \`/TODO\|FIXME/i\` | Case-insensitive regex in content |
| Regex alt | \`re:pattern\` | Same as above |

Combine filters with free text: \`ext:md deploy path:docs/\`

## Find and replace

1. Open the **Command palette** (\`Cmd+Shift+P\`)
2. Run **Find and replace in vault**
3. Enter search and replacement strings
4. Review **per-file previews** before confirming writes

<Callout variant="warning">
Replace operations modify files on disk immediately after confirmation. Commit or back up your vault first if using git.
</Callout>

## API search

Web dev exposes \`GET /api/search?q=\` for simple content search. Desktop builds search via Rust without HTTP.

## Future: FTS5

Very large vaults may eventually use SQLite FTS5 indexing. Today search is an in-process vault scan — fast for typical personal vaults, slower beyond tens of thousands of files.
`,

  'core-features/tags-folders.mdx': `---
title: Tags & Folders
description: Organize notes with directories on disk and inline #tags anywhere in any file.
category: Guide
lastUpdated: August 19, 2026
---

## Overview

Leaflyte uses **folders** for hierarchy (real directories) and **tags** for cross-cutting labels (\`#word\` tokens parsed from file content).

## Folders

- The sidebar reflects the vault directory tree
- Drag-and-drop moves files on disk
- Ignored paths: \`.git\`, \`node_modules\`, dotfiles, \`.gitignore\` patterns

### Recommended structures

| Pattern | Use case |
|---------|----------|
| \`inbox/\` | Quick captures, triage weekly |
| \`projects/<name>/\` | One folder per initiative with an index note |
| \`daily/YYYY-MM-DD.md\` | Daily notes |
| \`reference/\` | Long-lived docs |

## Tags

Write \`#design\`, \`#bug\`, or \`#v0.3\` anywhere — inside markdown, code comments, or HTML. Tags appear in the backlinks panel for the open file.

<Callout variant="tip">
Tags are not a separate database — they are extracted by scanning file text. Renaming a tag means find-and-replace across the vault.
</Callout>

## Tags vs folders

| Folders | Tags |
|---------|------|
| One parent path | Many tags per file |
| Good for project boundaries | Good for status, topic, priority |
| Visible in file path | Visible in backlinks panel and search |

## Search by tag

Quick switcher scoring boosts tag matches. Combine with \`ext:md #roadmap\` style queries in content search.
`,

  'core-features/markdown-support.mdx': `---
title: Markdown Support
description: GFM preview, task lists, syntax-highlighted fences, Mermaid, wikilinks, and split view.
category: Guide
lastUpdated: August 19, 2026
---

## Overview

Markdown files (\`.md\`, \`.mdx\`) open in Monaco with optional **split** or **read** preview powered by markdown-it with GFM-style extensions.

## View modes

Press \`Cmd+Shift+E\` / \`Ctrl+Shift+E\` to cycle:

1. **Edit** — Monaco only
2. **Split** — Editor + live preview
3. **Read** — Preview only

Toggle the formatting toolbar in **Settings → General**.

## Supported syntax

- Headings, bold, italic, links
- Task lists \`- [ ]\` / \`- [x]\`
- Fenced code blocks with syntax highlighting
- Images with vault-relative paths
- **Wikilinks** \`[[note]]\` rendered as internal links
- **Mermaid** diagrams in fenced \`mermaid\` blocks
- File embeds \`![[other-file.md]]\`

\`\`\`markdown
## Architecture

\`\`\`mermaid
flowchart LR
  Editor --> Preview
  Preview --> Vault
\`\`\`

See [[getting-started/quick-start]] for setup.
\`\`\`

## HTML files

\`.html\` files use a sandboxed iframe preview instead of markdown rendering.

## Toolbar and bubble menu

When enabled, the markdown toolbar inserts bold, links, lists, and headings. A bubble menu appears on text selection in edit mode.

## Limitations

- Pipe tables may not render in all builds — verify after upgrading
- Preview uses a subset of GFM; unknown HTML passes through markdown-it rules
`,

  'core-features/attachments.mdx': `---
title: Attachments
description: Images, PDFs, and file embeds stored alongside notes in your vault.
category: Guide
lastUpdated: August 19, 2026
---

## Overview

Attachments are ordinary files in your vault — not uploaded to a cloud service. Drop images into a folder or reference them from markdown.

## Images

Supported viewers: \`.png\`, \`.jpg\`, \`.jpeg\`, \`.gif\`, \`.webp\`, \`.svg\`, \`.ico\`

- **Markdown**: \`![alt](./assets/diagram.png)\`
- **Image-only tab**: Opens the image viewer instead of Monaco
- **Web dev**: Served via \`GET /api/asset?path=\`

## File embeds

Embed another vault file inside markdown:

\`\`\`markdown
![[notes/spec.pdf]]
![[src/example.ts]]
![[diagram.png|height=400]]
\`\`\`

Embeds render inline in preview with appropriate viewers (code, image, etc.).

## Binary files

PDFs, archives, and fonts are indexed lightly — search skips binary content but paths remain discoverable via quick switcher.

## VS Code capture

The capture extension saves selections as new files (default folder \`captures/\`) with the correct extension and language mode. See [Quick Start](/getting-started/quick-start/#connect-vs-code-capture).
`,

  'data-storage/database-configuration.mdx': `---
title: Database Configuration
description: How Leaflyte stores data — plain files today, optional database for future multi-user sync.
category: Reference
lastUpdated: August 19, 2026
---

## Overview

Leaflyte does **not** use a database for note storage. Your vault is a directory of files. App preferences, workspaces, AI settings, and chat history live in **browser localStorage** (or Tauri-managed storage on desktop).

<Callout variant="note">
There is no database to install or configure for the current release. This page documents today's model and planned direction.
</Callout>

## Current storage model

| Data | Location |
|------|----------|
| Notes, attachments | Vault folder on disk (\`VAULT_DIR\`) |
| Theme, keymaps, AI keys | localStorage |
| Workspace list & tabs | localStorage |
| AI chat history | localStorage |
| Desktop vault path | \`~/Library/Application Support/com.leaflyte.desktop/vault-path.txt\` (macOS) |

## Indexing

Search and backlinks build an in-memory index by scanning vault files. A \`.leaflyte-index\` folder may appear for caches — safe to delete; it rebuilds on launch.

## Future: optional database

Planned self-hosted sync may introduce PostgreSQL or SQLite for user accounts and sync metadata — **not** for replacing file-based note bodies. Notes will remain plain files you can \`git clone\`.

When database support ships, configuration will appear here and in [Environment Variables](/deployment/environment-variables/).
`,

  'data-storage/backups-restore.mdx': `---
title: Backups & Restore
description: Backup strategies for Leaflyte vaults — git, snapshots, and rsync.
category: Guide
lastUpdated: August 19, 2026
---

## Overview

Because Leaflyte stores everything as files, standard backup tools work without export wizards.

## Recommended approaches

### Git (developers)

\`\`\`bash
cd /path/to/vault
git init
git add .
git commit -m "Vault snapshot"
\`\`\`

Add a \`.gitignore\` for \`.leaflyte-index\` if present.

### Restic / Borg / Time Machine

Point your backup tool at the vault directory. Leaflyte's autosave (1.5s debounce) means files change frequently — schedule backups during low-activity windows or use continuous backup agents.

### NAS snapshots

ZFS, Btrfs, or Unraid array snapshots capture point-in-time copies with minimal overhead.

## Desktop vault locations

| Platform | Default packaged path |
|----------|----------------------|
| macOS | \`~/Documents/Leaflyte\` |
| Windows | \`Documents\\Leaflyte\` |
| Linux | \`~/Documents/Leaflyte\` |

Dev builds use \`./vault\` in the repo.

## Restore

1. Stop Leaflyte (avoid writes mid-restore)
2. Replace vault folder contents from backup
3. Relaunch — index rebuilds automatically

## What to exclude

- \`node_modules\` if accidentally inside vault
- Large build artifacts you do not need in notes
- Ephemeral \`.leaflyte-index\` (optional — regenerates)
`,

  'data-storage/exporting-data.mdx': `---
title: Exporting Your Data
description: Your notes are already plain files — copy, zip, or sync the vault folder.
category: Guide
lastUpdated: August 19, 2026
---

## Overview

Leaflyte has no proprietary export format. **Exporting = copying your vault folder.**

## Full vault export

\`\`\`bash
tar -czvf leaflyte-vault-backup.tar.gz -C /path/to/vault .
\`\`\`

Or use Finder/Explorer to copy the folder to USB, cloud drive, or another machine.

## Single-note export

Right-click a file in the sidebar → reveal in Finder/Explorer → copy anywhere. Markdown, PDF, images — all standard files.

## Migrating to Obsidian / Logseq

1. Point the other app at the same folder, or
2. Copy \`.md\` files into that app's vault

Wikilinks \`[[note]]\` syntax is compatible with Obsidian. Tags \`#word\` work similarly.

## Migrating from Obsidian

1. **Settings → Workspaces → Add** and select your Obsidian vault folder
2. Leaflyte reads existing \`.md\` files immediately
3. Review embed syntax — Leaflyte uses \`![[file]]\` like Obsidian

<Callout variant="tip">
Obsidian plugins that store metadata in \`.obsidian/\` are ignored by Leaflyte — your note content is unaffected.
</Callout>
`,

  'data-storage/migrations.mdx': `---
title: Migrations
description: Move vaults between machines and upgrade Leaflyte versions safely.
category: Guide
lastUpdated: August 19, 2026
---

## Overview

Vault migration is file copy. App migration is installer upgrade + optional index rebuild.

## Move vault to a new machine

1. **Copy** the entire vault folder (rsync, USB, cloud sync)
2. **Install** Leaflyte on the new machine
3. **Select** the copied folder as your vault on first launch, or add via **Settings → Workspaces**

## Change vault path (desktop)

Use **Settings → Workspaces** to add the new path and remove the old workspace entry. Files are not moved automatically — copy them first if needed.

## Upgrade Leaflyte version

### Desktop

1. Download the new installer from [leaflyte.app](https://leaflyte.app) or wait for the in-app updater
2. Install over the previous version
3. Launch — vault path persists in app data

### Self-hosted web

1. Pull latest \`main\` from GitHub
2. \`npm ci && npm run build\`
3. Restart \`next start\` or recreate the container
4. Vault bind mount is unchanged

See [Upgrading Versions](/troubleshooting/upgrading-versions/) for troubleshooting.

## Schema migrations

There is no vault schema version file. Leaflyte reads plain files — backward compatibility is maintained by keeping notes as standard formats (markdown, text, code).
`,

  'accounts-access/authentication.mdx': `---
title: Authentication
description: Secure self-hosted Leaflyte — reverse proxy auth today, native multi-user on the roadmap.
category: Reference
lastUpdated: August 19, 2026
---

## Overview

Leaflyte **desktop** runs locally — no login required. **Web/self-hosted** instances have no built-in user accounts in v0.2.x. Authentication belongs at the reverse proxy or identity provider.

<Callout variant="warning">
Never expose \`npm run dev\` or \`next start\` directly to the internet without TLS and authentication.
</Callout>

## Recommended patterns

| Approach | Best for |
|----------|----------|
| **Caddy basic auth** | Single user, homelab |
| **Authelia / Authentik** | SSO, MFA, multiple users |
| **Cloudflare Access** | Remote team without VPN |
| **Tailscale Serve** | Personal devices on tailnet |
| **VPN only** | No public URL |

## Desktop app

OS user session protects the app implicitly. Disk encryption (FileVault, BitLocker) protects vault data at rest.

## Capture API

\`POST /api/capture\` accepts writes when the dev server is reachable. On LAN deployments, restrict port 1420 to trusted IPs or bind to localhost and tunnel via Tailscale.

## Future native auth

Multi-user accounts and permissions are planned for self-hosted sync — see [Multi-user Setup](/accounts-access/multi-user-setup/). Until then, one reverse-proxy user maps to one shared vault.
`,

  'accounts-access/multi-user-setup.mdx': `---
title: Multi-user Setup
description: Share a self-hosted Leaflyte instance with multiple people using proxy auth and vault layout patterns.
category: Guide
lastUpdated: August 19, 2026
---

## Overview

Native per-user accounts are **not shipped yet**. Today, multiple people can share one self-hosted instance if you accept a **shared vault** with proxy-level identity, or run **separate instances** per user.

## Pattern A — Shared vault (simple)

1. Deploy one Leaflyte container with one \`VAULT_DIR\`
2. Put Authelia/Authentik in front — all authenticated users see the same notes
3. Use folder conventions: \`people/alice/\`, \`people/bob/\`

**Pros:** One deployment. **Cons:** No fine-grained ACLs inside Leaflyte.

## Pattern B — Instance per user

1. Run separate containers with different ports or subdomains
2. Map unique vault volumes: \`/vault/alice\`, \`/vault/bob\`
3. Auth rules route \`alice.notes.example.com\` → alice container

**Pros:** Hard isolation. **Cons:** More ops overhead.

## Pattern C — Desktop only (recommended today)

Each user runs the **desktop app** with their own local vault. Sync files via Syncthing, git, or NAS — Leaflyte does not coordinate sync yet.

## Future

When multi-user ships, expect:

- User records in a database (sync metadata only)
- Note bodies remain files
- Role-based folder permissions

Track progress in [Changelog](/changelog/).
`,

  'accounts-access/permissions.mdx': `---
title: Permissions
description: File-system permissions and future role-based access in Leaflyte.
category: Reference
lastUpdated: August 19, 2026
---

## Overview

Leaflyte inherits **OS file permissions** for the vault directory. There is no in-app permission matrix in v0.2.x.

## Desktop

The app runs as your user account. Any process with filesystem access to the vault folder can read/write notes.

## Self-hosted

Run the Node process as a dedicated user:

\`\`\`bash
useradd -r leaflyte
chown -R leaflyte:leaflyte /data/leaflyte/vault
\`\`\`

Only mount the vault volume into the container — not Docker socket or host root.

## Shared team rules (informal)

Until RBAC exists:

- Use separate folders per person or project
- Use git for audit trail (\`git log\` on the vault)
- Restrict proxy auth to known users

## Planned RBAC

Future releases may add:

| Role | Capabilities (planned) |
|------|------------------------|
| **Viewer** | Read-only vault access |
| **Editor** | Create/edit/delete own folders |
| **Admin** | Manage users and settings |

See [Multi-user Setup](/accounts-access/multi-user-setup/).
`,

  'customization/themes.mdx': `---
title: Themes
description: Built-in editor themes and custom color overrides in Leaflyte.
category: Guide
lastUpdated: August 19, 2026
---

## Overview

Leaflyte ships four editor themes that sync Monaco and the app chrome. Override individual colors for a personalized palette.

## Built-in themes

| Theme | Character |
|-------|-----------|
| **Carbon** | Dark neutral default |
| **Midnight** | Deep blue-black |
| **Paper** | Warm light |
| **Sepia** | Low-glare light |

Switch in **Settings → Theme** or via the theme picker if exposed in the UI chrome.

## Custom colors

**Settings → Theme → Customize** exposes eight CSS variables:

- Background, surface, surface accent
- Border, text, muted text
- Amber accent, teal accent

Changes apply to Monaco via a generated \`leaflyte-custom\` theme.

## File icons

Toggle **color file icons** (VS Code–style) in theme settings for richer sidebar recognition.

## Markdown view mode

Theme settings remember your preferred **edit / split / read** mode per session. Cycle with \`Cmd+Shift+E\`.

## Persistence

Themes store in localStorage — per browser profile on web, per app install on desktop.
`,

  'customization/settings-reference.mdx': `---
title: Settings Reference
description: Every Leaflyte settings panel — General, Workspaces, Theme, AI, and Shortcuts.
category: Reference
lastUpdated: August 19, 2026
---

## Overview

Open **Settings** from the command palette or sidebar. All settings persist to localStorage unless noted.

## General

| Setting | Description |
|---------|-------------|
| App version | Current Leaflyte version; desktop shows updater status |
| Markdown toolbar | Show/hide formatting toolbar in markdown edit mode |
| Current workspace | Name and path of active vault |

## Workspaces

| Action | Description |
|--------|-------------|
| Add workspace | Register another vault folder |
| Switch | Change active vault |
| Remove | Unregister workspace (files remain on disk) |

## Theme

- Preset selection (Carbon, Midnight, Paper, Sepia)
- Per-color overrides
- Color file icons toggle

## AI

| Setting | Description |
|---------|-------------|
| Provider | Off, Local/OpenAI-compatible, Anthropic, OpenAI |
| Local base URL | e.g. \`http://localhost:11434/v1\` (Ollama) |
| API keys | Stored locally only — never sent to Leaflyte servers |
| Model | Selected per provider from live model list |
| Allow edits | AI may propose \`leaflyte-write\` blocks requiring approval |

Edits always flow through **preview → approve / revert**.

## Shortcuts

Remap keybindings in **Settings → Shortcuts**. Defaults include:

| Action | Default |
|--------|---------|
| Quick switcher | \`Cmd+K\` |
| Command palette | \`Cmd+Shift+P\` |
| New file | \`Cmd+N\` |
| Save | \`Cmd+S\` |
| Toggle markdown view | \`Cmd+Shift+E\` |
`,

  'api-reference/authentication.mdx': `---
title: Authentication
description: Security model for Leaflyte HTTP APIs — open on localhost, protect on LAN/WAN.
category: Reference
lastUpdated: August 19, 2026
---

## Overview

Leaflyte API routes have **no API keys or JWT** in v0.2.x. They trust the network they bind to.

| Context | Security model |
|---------|----------------|
| \`npm run dev\` on \`127.0.0.1\` | Localhost only — safe default |
| \`npm run dev:lan\` | Any device on LAN can call APIs — use firewall rules |
| Behind reverse proxy | Auth enforced by proxy |

## Capture API

The VS Code extension POSTs to \`/api/capture\`. Restrict who can reach port **1420** on shared networks.

## AI proxy routes

\`/api/ai/chat\` and \`/api/ai/models\` forward requests using keys from the **browser session** (request body / client config), not server env.

## SSRF protection

Local/OpenAI-compatible URLs are validated before server-side fetch to block internal network probing. See \`lib/ai/urlSafety.ts\` in the repo.

## Future

Self-hosted sync may introduce bearer tokens for multi-user instances. Desktop Tauri builds will continue using Rust invoke instead of HTTP for file operations.
`,

  'api-reference/endpoints.mdx': `---
title: Endpoints
description: HTTP API routes available in Leaflyte web/dev mode.
category: Reference
lastUpdated: August 19, 2026
---

## Overview

These routes exist when running \`npm run dev\` or \`next start\`. **Desktop Tauri** uses Rust commands instead — APIs are not required at runtime.

Base URL: \`http://127.0.0.1:1420\` (dev) or your deployment origin.

## Vault & files

| Method | Path | Description |
|--------|------|-------------|
| GET | \`/api/tree\` | Vault directory tree |
| GET | \`/api/file?path=\` | Read file contents |
| POST | \`/api/file\` | Write/create file |
| DELETE | \`/api/file?path=\` | Delete file |
| PATCH | \`/api/file\` | Move/rename file |
| GET | \`/api/asset?path=\` | Serve binary/image assets |

## Search & links

| Method | Path | Description |
|--------|------|-------------|
| GET | \`/api/search?q=\` | Content search |
| GET | \`/api/backlinks?path=\` | Tags, backlinks, outgoing links |

## Capture

| Method | Path | Description |
|--------|------|-------------|
| GET | \`/api/capture\` | Health check |
| POST | \`/api/capture\` | Create capture file from editor |

### POST /api/capture body

\`\`\`json
{
  "content": "const hello = 'world';",
  "languageId": "typescript",
  "title": "example",
  "folder": "captures",
  "extension": "ts"
}
\`\`\`

## AI

| Method | Path | Description |
|--------|------|-------------|
| POST | \`/api/ai/chat\` | Chat completion proxy |
| POST | \`/api/ai/models\` | List models from provider |

<Callout variant="note">
The VS Code extension expects \`GET /api/vault\` for vault discovery — ensure your deployment version includes this route if using capture connect.
</Callout>
`,

  'api-reference/rate-limits.mdx': `---
title: Rate Limits
description: Rate limiting behavior for Leaflyte APIs and AI proxy routes.
category: Reference
lastUpdated: August 19, 2026
---

## Overview

Leaflyte does **not** implement application-level rate limits in v0.2.x. Limits come from upstream providers and infrastructure.

## AI routes

| Layer | Limiting |
|-------|----------|
| Leaflyte | None built-in |
| Ollama / LM Studio | Hardware throughput |
| OpenAI / Anthropic | Provider quota and TPM/RPM |

Configure reasonable timeouts in your reverse proxy for \`/api/ai/*\` (e.g. 120s for long completions).

## File APIs

Vault read/write endpoints are bounded by disk I/O. Automated scripts should serialize bulk imports — thousands of rapid POSTs may contend with autosave.

## Recommended proxy limits

For public-ish deployments, add nginx \`limit_req\`:

\`\`\`nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;

location /api/ {
  limit_req zone=api burst=20 nodelay;
  proxy_pass http://127.0.0.1:4000;
}
\`\`\`

## Future

Multi-tenant self-hosted sync will document per-user quotas here.
`,

  'troubleshooting/common-errors.mdx': `---
title: Common Errors
description: Fix frequent Leaflyte issues — vault path, Monaco, capture, and build errors.
category: Reference
lastUpdated: August 19, 2026
---

## Overview

Most issues trace to vault path, dev server not running, or platform-specific build prerequisites.

## Cannot read vault / empty sidebar

**Cause:** Vault path wrong or permissions denied.

**Fix:**
1. Check \`VAULT_DIR\` in \`.env.local\` (web) or **Settings → Workspaces** (desktop)
2. Ensure the directory exists and is readable
3. Desktop: verify \`vault-path.txt\` in app support folder

## Monaco 404 / blank editor (dev)

**Cause:** Next.js dev + \`standalone\` output conflict, or chunk load failure.

**Fix:**
1. Stop dev server, delete \`.next\`, restart \`npm run dev\`
2. Do not set \`output: 'standalone'\` during local Tauri dev
3. Hard refresh browser (\`Cmd+Shift+R\`)

## Capture extension cannot connect

**Cause:** Leaflyte not running or wrong URL.

**Fix:**
1. Run \`npm run dev\` or \`npm run tauri:dev\`
2. Extension default: \`http://127.0.0.1:1420/api/capture\`
3. For LAN: \`npm run dev:lan\` + update \`leaflyte.captureUrl\` in VS Code settings

## Captures succeed but files missing in UI

**Cause:** API vault path differs from open workspace.

**Fix:** Align \`VAULT_DIR\` with the workspace folder shown in Settings.

## Tauri build fails

**Cause:** Missing Rust or platform webview dependencies.

**Fix:** Follow [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS. Windows builds require WebView2 (preinstalled on Win 10/11).

## AI request failed

**Cause:** Provider down, wrong URL, or SSRF guard blocked internal URL.

**Fix:**
1. Verify Ollama at \`http://localhost:11434/v1\`
2. Check Settings → AI base URL and model name
3. Review browser console and terminal logs
`,

  'troubleshooting/upgrading-versions.mdx': `---
title: Upgrading Versions
description: Upgrade Leaflyte desktop and self-hosted deployments safely.
category: Guide
lastUpdated: August 19, 2026
---

## Overview

Upgrading should never mutate vault file formats — back up anyway before major jumps.

## Desktop auto-updater

Packaged builds check \`https://leaflyte.app/updates/latest.json\`. When an update is available, the app prompts to download and restart.

Manual install: download the latest .dmg / .exe from [leaflyte.app](https://leaflyte.app) and install over the existing app.

## From source (dev)

\`\`\`bash
git pull
npm ci
npm run dev   # or npm run tauri:build
\`\`\`

## Self-hosted Docker

\`\`\`bash
git pull
docker compose build --no-cache
docker compose up -d
\`\`\`

Vault volume persists across container replacements.

## Rollback

1. Reinstall the previous desktop build from GitHub Releases
2. Or checkout an older git tag and rebuild
3. Vault folder is unchanged — no downgrade migration needed

## Breaking changes

Review [Changelog](/changelog/) before upgrading across multiple minor versions. Settings in localStorage may reset if keys rename — export screenshots of AI settings if needed.
`,

  'troubleshooting/faq.mdx': `---
title: FAQ
description: Frequently asked questions about Leaflyte — pricing, sync, platforms, and privacy.
category: Reference
lastUpdated: August 19, 2026
---

## Overview

Quick answers to common questions. For setup help, start with [Quick Start](/getting-started/quick-start/).

## Is Leaflyte free?

The app is open source. You host your own data — no subscription for local/desktop use.

## Does Leaflyte sync between devices?

Not yet. Desktop uses local folders only. Sync via git, Syncthing, or iCloud/Dropbox on the vault folder is possible today; native sync is on the [roadmap](/changelog/).

## macOS / Windows / Linux?

Yes — desktop builds for all three via Tauri. Download from [leaflyte.app](https://leaflyte.app).

## Is my data sent to the cloud?

No — notes stay on disk. AI features send prompts only to providers **you** configure (Ollama locally, or your own API keys).

## Obsidian compatibility?

Mostly yes for \`.md\` files, \`[[wikilinks]]\`, \`#tags\`, and \`![[embeds]]\`. Obsidian plugin metadata in \`.obsidian/\` is ignored.

## Can I use SQL / code files as notes?

Yes — that's the core idea. Monaco opens 100+ language modes; CFML has a custom grammar.

## Why port 1420?

Tauri's dev config binds Next.js to 1420 so the desktop webview and VS Code capture share one origin.

## How do I report bugs?

[GitHub Issues](https://github.com/Ndawson15/Leaflyte/issues) on the main repository.
`,

  'guides.mdx': `---
title: Guides
description: Step-by-step guides for installing, deploying, and using Leaflyte.
category: Guide
lastUpdated: August 19, 2026
---

## Overview

Long-form tutorials for common Leaflyte workflows — from first install to self-hosted deployment.

## Getting started

| Guide | Description |
|-------|-------------|
| [Quick Start](/getting-started/quick-start/) | Install and create your first vault |
| [What is Leaflyte](/getting-started/what-is-leaflyte/) | Product overview and architecture |
| [Self-Hosting Requirements](/getting-started/self-hosting-requirements/) | Server specs and security |

## Deployment

| Guide | Description |
|-------|-------------|
| [Docker](/deployment/docker/) | Containerize from source |
| [Unraid](/deployment/unraid/) | NAS deployment |
| [Reverse Proxy / SSL](/deployment/reverse-proxy-ssl/) | HTTPS with Caddy or nginx |

## Daily use

| Guide | Description |
|-------|-------------|
| [Creating & Organizing Notes](/core-features/creating-organizing-notes/) | Vault structure and wikilinks |
| [Markdown Support](/core-features/markdown-support/) | Preview, Mermaid, split view |
| [Search](/core-features/search/) | Filters and find-replace |
| [Themes](/customization/themes/) | Customize appearance |

## Data & ops

| Guide | Description |
|-------|-------------|
| [Backups & Restore](/data-storage/backups-restore/) | Protect your vault |
| [Upgrading Versions](/troubleshooting/upgrading-versions/) | Safe updates |
`,

  'changelog.mdx': `---
title: Changelog
description: Release notes and version history for Leaflyte.
category: Reference
lastUpdated: August 19, 2026
---

## v0.2.9

- Desktop builds for macOS, Windows, and Linux via Tauri
- Auto-updater from leaflyte.app
- GFM markdown preview with Mermaid and task lists
- Split / read / edit markdown views (\`Cmd+Shift+E\`)
- Local LLM via Ollama, LM Studio, or any OpenAI-compatible endpoint
- Anthropic and OpenAI providers with edit approval flow
- Vault search with \`ext:\`, \`path:\`, and regex filters
- Find-and-replace across vault with per-file preview
- VS Code / Cursor capture extension (\`Cmd+Shift+L\`)
- CFML custom Monaco grammar
- Workspaces — multiple vault folders
- Four themes with custom color overrides

## v0.2.x (earlier)

- Initial Tauri desktop packaging
- Monaco editor with 100+ language mappings
- Wikilinks, backlinks, and tags
- Quick switcher and command palette

## Upcoming

- Self-hosted sync server and optional Docker release
- Tailscale-friendly remote access docs
- SQLite FTS5 for large vault search
- Native multi-user auth for self-hosted
- Mobile-friendly PWA once sync exists

Full release artifacts: [GitHub Releases](https://github.com/Ndawson15/Leaflyte/releases)
`,
};

for (const [relPath, body] of Object.entries(pages)) {
  const filePath = path.join(contentDir, relPath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, body.trim() + '\n');
  console.log('Wrote', relPath);
}

console.log(`Done — ${Object.keys(pages).length} pages.`);
