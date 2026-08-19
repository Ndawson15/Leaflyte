# Leaflyte Capture (VS Code / Cursor)

Send the current selection (or whole file) into your Leaflyte vault as a **real file** with the right extension — not a markdown fence.

## Setup

1. **Install and open Leaflyte** — Download from [leaflyte.app](https://leaflyte.app) or run `npm run tauri:dev` during development. Open the vault you want to capture into.
2. **Install the extension** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Leaflyte.leaflyte-capture) (or press F5 from this folder for local dev).
3. **Connect** — The status bar shows your vault when Leaflyte is running. Click it or run **Leaflyte: Connect to Vault** after switching workspaces.

The extension calls `GET /api/vault` to discover the active vault, then `POST /api/capture` to write files. **Production desktop builds** expose this API on `http://127.0.0.1:1420` automatically while the app is open — no `npm run dev` required.

## Commands

| Command | Default shortcut |
| --- | --- |
| **Leaflyte: Capture Selection** | ⌘⇧L / Ctrl+⇧L (empty selection = whole file) |
| **Leaflyte: Capture Current File** | — |
| **Leaflyte: Connect to Vault** | — |

## Settings

- `leaflyte.captureUrl` — default `http://127.0.0.1:1420/api/capture` (use your LAN URL with `npm run dev:lan` if needed)
- `leaflyte.captureFolder` — vault-relative folder (default `captures`)

Works in Cursor the same way as VS Code.
