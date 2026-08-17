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

Dev (`tauri:dev`) uses `./vault`. Packaged builds default to `Documents/Leaflyte`.

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
- **Search** is a simple substring search across filenames and file
  contents — fine at personal-vault scale. If the vault grows large enough
  that this feels slow, swapping in SQLite FTS5 is a clean next step.
- **Monaco loads from a CDN** by default via `@monaco-editor/react`. Works
  fine as long as the browser has internet access; self-hosting the Monaco
  assets is possible later if you want this fully offline-capable behind
  Tailscale.
- **No auth** — this is designed to sit on your LAN / behind Tailscale, not
  be exposed to the open internet. Add a reverse-proxy auth layer (or
  Tailscale Serve/Funnel with ACLs) before exposing it more broadly.

## Where this goes next

This was scoped deliberately small: get the web app working like Obsidian's
desktop app first. Natural next steps, in roughly the order they were
discussed:

1. **VS Code extension** — select code, hit a keybinding, it POSTs to a new
   `/api/capture` endpoint and drops a new note into the vault with the
   right extension auto-detected from VS Code's language ID.
2. **Tailscale** — put the container on your tailnet instead of (or in
   addition to) the open LAN, so it's reachable when you're out.
3. **Mobile** — once it's on Tailscale, a simple installable web app (PWA
   manifest) likely gets you 90% of "notes on my phone" without building a
   native app.
