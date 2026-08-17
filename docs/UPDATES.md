# Leaflyte auto-updates (Tauri Updater)

Installed apps check **https://leaflyte.app/updates/latest.json** on launch and from **Settings → General → Check for updates**.

## One-time setup

Signing keys were generated at:

- **Private key** (never commit): `src-tauri/.tauri-signing.key`
- **Public key** (in `tauri.conf.json`): used to verify updates

If you regenerate keys, every installed app must be rebuilt with the matching public key or updates will fail.

## Release workflow

1. **Bump version** in sync:
   - `package.json`
   - `src-tauri/tauri.conf.json`
   - `src-tauri/Cargo.toml`

2. **Build with signing** (from repo root):

```bash
export TAURI_SIGNING_PRIVATE_KEY_PATH="src-tauri/.tauri-signing.key"
npm run tauri:build
```

3. **Generate manifest**:

```bash
npm run publish:update -- --notes "What changed in this release"
```

This writes `landing/updates/latest.json` from the `.sig` files in `src-tauri/target/release/bundle/`.

4. **Upload release files** to GitHub Releases (or `leaflyte.app/updates/releases/vX.Y.Z/`):
   - macOS: `Leaflyte.app.tar.gz` (not the `.dmg` — the updater uses the `.tar.gz`)
   - Windows: `Leaflyte_*-setup.exe`

5. **Deploy** `landing/updates/latest.json` to leaflyte.app (git push → Hostinger redeploy).

## Notes

- Updates **must be signed**. Unsigned builds cannot auto-update.
- macOS Gatekeeper/notarization is separate — users may still need to approve the first install.
- Keep the private key backed up. Losing it means existing installs can never receive signed updates again.
