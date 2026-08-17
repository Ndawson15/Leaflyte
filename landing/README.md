# Leaflyte landing page

Static marketing site for [Leaflyte](https://github.com/Ndawson15/Leaflyte). Deploy this folder to **leaflyte.app** — not the repo root (that is the desktop app).

## Hostinger (Node.js web app → GitHub)

In hPanel → your site → **Deployments** / build settings:

### Required (fix “No output directory found”)

Hostinger’s auto-diagnosis often says “use Next.js” — **ignore that** for this site.

| Setting | Value | Notes |
|---------|--------|--------|
| **Framework preset** | **Other** | Not Next.js — this is plain HTML, not the desktop app |
| **Root directory** | **`landing`** | Keeps build scoped to the marketing site |
| **Build command** | **`build`** | Runs `node scripts/build.mjs` |
| **Output directory** | **`build`** | Relative to **`landing/`** → `landing/build/` |
| **Entry file** | *(empty)* | Static site — no Node server |
| **Node version** | 22.x | |
| **Branch** | `main` | |

If Framework is left on **Next.js**, Hostinger looks for **`.next`** and deploy will fail even when the build log shows success.

### After changing settings

1. Save settings.
2. **Redeploy** (new deploy, not just rebuild with old config).

### Test locally

```bash
cd landing && npm run build
ls build/index.html   # output is landing/build/
npx --yes serve build
```

## Preview without build

```bash
cd landing && python3 -m http.server 8080
```

## Downloads

After `npm run tauri:build` (from repo root), copy installers into `landing/downloads/`:

| Platform | Source |
|----------|--------|
| macOS | `src-tauri/target/release/bundle/dmg/*.dmg` → `landing/downloads/Leaflyte.dmg` |
| Windows | `src-tauri/target/release/bundle/nsis/*.exe` → `landing/downloads/Leaflyte-setup.exe` |

Commit and push, or use GitHub Releases and update links in `index.html`.
