# Leaflyte Capture (VS Code / Cursor)

Send the current selection (or whole file) into your Leaflyte vault as a **real file** with the right extension — not a markdown fence.

## Setup

1. **Start Leaflyte** and open the vault you want to capture into (`npm run tauri:dev` or the desktop app).
2. From this folder:

```bash
cd extensions/leaflyte-capture
npm install
npm run compile
```

3. Press **F5** in this folder to open an Extension Development Host (or install from VSIX).

The extension calls `GET /api/vault` on Leaflyte to discover whichever vault folder is currently open, then writes captures there via `POST /api/capture`. A status bar item shows the connected vault — click it or run **Leaflyte: Connect to Vault** to refresh after switching workspaces.

## Commands

| Command | Default shortcut |
| --- | --- |
| **Leaflyte: Capture Selection** | ⌘⇧L / Ctrl+⇧L (empty selection = whole file) |
| **Leaflyte: Capture Current File** | — |
| **Leaflyte: Connect to Vault** | — |

## Settings

- `leaflyte.captureUrl` — default `http://127.0.0.1:1420/api/capture` (use your Docker/LAN URL if needed)
- `leaflyte.captureFolder` — vault-relative folder (default `captures`)

Works in Cursor the same way as VS Code.
