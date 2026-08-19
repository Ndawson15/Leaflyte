# Leaflyte landing page

React marketing site for [Leaflyte](https://github.com/Ndawson15/Leaflyte). Deploy this folder to **leaflyte.app** — not the repo root (that is the desktop app).

Built with **React 16.14** + **framer-motion 6.5.1** (v7+ requires React 18). Code avoids React 18-only APIs (`useId`, concurrent Suspense, etc.).

Documentation lives at **`/docs`** — a separate Next.js static export in [`docs/`](docs/). It is built automatically and copied into `build/docs/` during `npm run build`.

## Hostinger (Node.js web app → GitHub)

In hPanel → your site → **Deployments** / build settings:

### Required (fix “No output directory found”)

Hostinger’s auto-diagnosis often says “use Next.js” — **ignore that** for this site.

| Setting | Value | Notes |
|---------|--------|--------|
| **Framework preset** | **Other** | Not Next.js — this is a Vite React SPA, not the desktop app |
| **Root directory** | **`landing`** | Keeps build scoped to the marketing site |
| **Build command** | **`npm run build`** | Runs Vite, then copies `downloads/` + `updates/` |
| **Output directory** | **`build`** | Relative to **`landing/`** → `landing/build/` |
| **Entry file** | *(empty)* | Static site — no Node server |
| **Node version** | 22.x | |
| **Branch** | `main` | |

If Framework is left on **Next.js**, Hostinger looks for **`.next`** and deploy will fail even when the build log shows success.

### After changing settings

1. Save settings.
2. **Redeploy** (new deploy, not just rebuild with old config).

### Develop locally

```bash
cd landing
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Build & preview

```bash
cd landing && npm install && npm run build
ls build/index.html   # output is landing/build/
npx --yes serve build
```

## Downloads

After `npm run tauri:build` (from repo root), copy installers into `landing/downloads/`:

| Platform | Source |
|----------|--------|
| macOS | `src-tauri/target/release/bundle/dmg/*.dmg` → `landing/downloads/Leaflyte.dmg` |
| Windows | `src-tauri/target/release/bundle/nsis/*.exe` → `landing/downloads/Leaflyte-setup.exe` |
| Linux | `src-tauri/target/release/bundle/appimage/*.AppImage` → `landing/downloads/Leaflyte.AppImage` |
| Linux | `src-tauri/target/release/bundle/deb/*.deb` → `landing/downloads/Leaflyte.deb` |

Use `.github/workflows/desktop.yml` to build macOS / Windows / Linux artifacts in CI. Commit and push, or publish via GitHub Releases and wire the download links in `index.html` when you leave “Coming soon”.
