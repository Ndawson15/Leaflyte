# Leaflyte landing page

Static marketing site for [Leaflyte](https://github.com/Ndawson15/Leaflyte). Deploy this folder to **leaflyte.app** — not the repo root (that is the desktop app).

## Hostinger (Node.js web app → GitHub)

In hPanel → **Add Website** → **Node.js web app** → import [Ndawson15/Leaflyte](https://github.com/Ndawson15/Leaflyte):

| Setting | Value |
|---------|--------|
| Framework preset | **Other** (not Next.js) |
| Branch | `main` |
| Node version | 22.x |
| Root directory | **`landing`** |
| Build command | **`build`** |
| Output directory | **`dist`** |
| Entry file | *(leave empty — static site)* |

Do **not** deploy the repo root with Next.js — that is the Tauri/desktop app, not the marketing site.

Test the build locally:

```bash
cd landing && npm run build && npx --yes serve dist
```

See [Hostinger Node.js build settings](https://docs.hostinger.com/node.js/build-settings).

## Preview locally

```bash
python3 -m http.server 8080
```

Open http://localhost:8080

## Downloads

After `npm run tauri:build` (from repo root), copy installers into `downloads/`:

| Platform | Source |
|----------|--------|
| macOS | `src-tauri/target/release/bundle/dmg/*.dmg` → `downloads/Leaflyte.dmg` |
| Windows | `src-tauri/target/release/bundle/nsis/*.exe` → `downloads/Leaflyte-setup.exe` |

Commit and push those files (or attach via GitHub Releases and update links in `index.html`).
