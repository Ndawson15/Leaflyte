# Leaflyte documentation content

Each page is one `.mdx` file under `content/`. The file path becomes the URL slug.

## Add a new page

1. **Register it in nav** — edit `lib/nav.ts` and add `{ title, slug }` under the right section. Slugs use folder paths without `.mdx` (e.g. `deployment/docker` → `content/deployment/docker.mdx`).

2. **Create the MDX file** at `content/<slug>.mdx` with frontmatter:

```mdx
---
title: Page Title
description: One-line summary for SEO and search.
category: Tutorial
lastUpdated: August 19, 2026
readingTime: 5
videoUrl: https://youtube.com/...
videoLabel: Watch setup walkthrough
---

Your content here.
```

`readingTime` is optional — it is auto-calculated from word count when omitted.

3. **Rebuild search** — `npm run prebuild` regenerates `public/search-index.json` (runs automatically before `npm run build`).

## MDX components

Import is not required for built-ins registered in `mdx-components.tsx`:

```mdx
<Callout variant="note">Helpful context.</Callout>
<Callout variant="warning">Something to watch out for.</Callout>
<Callout variant="tip">A shortcut or best practice.</Callout>

<Figure src="/docs/assets/app-screenshot.png" alt="Leaflyte editor" caption="Split markdown + preview view." />

<VideoCta href="https://..." label="Watch Video" />
```

Or set `videoUrl` / `videoLabel` in frontmatter to show the CTA above the body.

## Tutorial step lists

Use ordered lists for numbered steps — they render with step badges:

```mdx
1. **Download the installer** — Grab the latest `.dmg` or `.exe` from leaflyte.app.
2. **Choose a vault folder** — Pick an existing directory or create a new one on first launch.
```

## Code blocks

Fenced blocks get syntax highlighting and a copy button:

````mdx
```bash
npm run tauri:dev
```
````

## Local dev

```bash
cd landing/docs
npm install
npm run dev
```

Open http://localhost:3001/docs/

## Deploy

The landing build script exports docs to `landing/build/docs/` for leaflyte.app.
