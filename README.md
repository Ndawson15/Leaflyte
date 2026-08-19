# Leaflyte

A self-hosted, Obsidian-like notes app where every note is a real file with a
real extension — `.sql`, `.html`, `.cfm`, `.js`, `.py`, whatever fits — edited
with the actual Monaco/VS Code editor engine instead of markdown code fences.

## How it works

- **Vault** — notes live as plain files on disk (`VAULT_DIR`, default
  `./vault`). Nothing proprietary; it's just a folder you could `git init`.
- **Links** — write `[[note-name]]` anywhere in any file (inside a SQL
  comment, an HTML comment, a `.py` docstring, whatever) and it becomes a
  link, resolved by matching filenames. Aliases work too: `[[note|label]]`.
- **Tags** — `#word` anywhere in a file. Shown in the right-hand panel.
- **Backlinks** — the right panel shows what links to the open note, what it
  links out to, and its tags — same idea as Obsidian's linked mentions.
- **Quick switcher** — `⌘K` / `Ctrl+K` to fuzzy-jump between notes.
- **Autosave** — saves 1.5s after you stop typing, or immediately on
  `⌘S` / `Ctrl+S`.

## Local development

```bash
npm install
npm run dev
```

Open `http://<your-lan-ip>:1420` (avoid `localhost` — Cursor can intercept it and blank the page). Notes are read/written from `./vault`.

## Desktop (Tauri)

This wraps the same UI in a native window. File I/O goes through Rust, not the Next.js API, so a packaged build does not need Node running.

```bash
# one-time: https://v2.tauri.app/start/prerequisites/  (Rust + platform webview)
npm run tauri:dev      # desktop window against the Next dev server
npm run tauri:build    # production installer / binary
```

**Windows:** `tauri:build` on a Windows machine produces an installer (`.exe` / `.msi`) under `src-tauri/target/release/bundle/`. The NSIS `.exe` is what you distribute; after install, Leaflyte opens like any other app. A raw `leaflyte.exe` is also in `target/release/` — it runs if WebView2 is present (it is on current Windows 10/11). You cannot usefully cross-compile a Windows `.exe` from macOS; build on Windows or CI.

**macOS:** you get `Leaflyte.app` and usually a `.dmg` in the same bundle folder.

**Linux:** build on Linux (or CI). Tauri emits AppImage and/or `.deb` under `src-tauri/target/release/bundle/`. Copy into `landing/downloads/` as `Leaflyte.AppImage` / `Leaflyte.deb`. See `.github/workflows/desktop.yml` for a multi-platform build job.

Dev (`tauri:dev`) uses `./vault`. Packaged builds default to `Documents/Leaflyte`.

## AI (local or cloud)

Settings → AI:

- **Local / OpenAI-compatible** — Ollama (`http://localhost:11434/v1`), LM Studio (`http://localhost:1234/v1`), or any `/v1` endpoint. No cloud key required.
- **Anthropic / OpenAI** — bring your own API key (stored in localStorage only).

Edits are always preview → approve / revert.

## Search

⌘K supports filters and regex:

- `ext:ts` / `ext:sql,md`
- `path:runbooks/`
- `/TODO|FIXME/i` or `re:pattern`

Command palette → **Find and replace in vault** confirms per file before writing.

## VS Code / Cursor capture

See [`extensions/leaflyte-capture`](extensions/leaflyte-capture). Select code → **Leaflyte: Capture Selection** (⌘⇧L) → `POST /api/capture` creates a vault note with the right extension.

## Running with Docker (for your Unraid box)

```bash
docker compose up -d --build
```

By default this mounts `./vault` from the compose file's directory. On
Unraid, point the volume at a real appdata path so notes persist across
container rebuilds, e.g. in `docker-compose.yml`:

```yaml
volumes:
  - /mnt/user/appdata/leaflyte/vault:/app/vault
```

The app listens on port 3000 inside the container, mapped to `3300` on the
host by default — change that mapping in `docker-compose.yml` if you'd
rather use something else. Once it's running, `http://<unraid-ip>:3300`
gets you the app from anywhere on your LAN, same pattern as your Metabase
kiosk setup.

## Notes on the current MVP

- **CFML** has its own editor grammar (`.cfm`, `.cfc`, `.cfml`, `.cfs`, `.cfr`): ColdFusion tags, `<!--- --->` comments, `#expression#`, `<cfscript>`, and SQL inside `<cfquery>`. Other extensions map to Monaco’s built-in languages; unknown types still save as plain text.
- **Markdown preview** uses GFM (tables, task lists, highlighted fences, images, Mermaid). Split view: edit → split → read via ⌘⇧E.
- **Monaco** is bundled for desktop; the browser/dev server may still load Monaco from a CDN.
- **No auth** — this is designed to sit on your LAN / behind Tailscale, not
  be exposed to the open internet. Add a reverse-proxy auth layer (or
  Tailscale Serve/Funnel with ACLs) before exposing it more broadly.

## Where this goes next

1. **Tailscale** — put the container on your tailnet so it's reachable when you're out.
2. **Mobile PWA** — once on Tailscale, an installable web app covers most phone use.
3. **SQLite FTS5** — if vault search outgrows in-process scan.
