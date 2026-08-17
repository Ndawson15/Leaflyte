# Leaflyte landing page

Static marketing site for [Leaflyte](https://github.com/Ndawson15/Leaflyte). Not part of the Next.js app.

## Preview locally

```bash
python3 -m http.server 8080
```

Open http://localhost:8080

## Deploy

Upload this entire folder to any static host (Netlify, GitHub Pages, S3, etc.).

## Downloads

After `npm run tauri:build`, copy installers into `downloads/`:

| Platform | Source (from repo root) |
|----------|-------------------------|
| macOS | `src-tauri/target/release/bundle/dmg/*.dmg` → `downloads/Leaflyte.dmg` |
| Windows | `src-tauri/target/release/bundle/nsis/*.exe` → `downloads/Leaflyte-setup.exe` |
