# Leaflyte documentation

Next.js documentation site for **leaflyte.app/docs**. Built as a static export and copied into `landing/build/docs/` during the landing deploy.

## Stack

- Next.js 16 (App Router, static export, `basePath: /docs`)
- MDX content in `content/` via `next-mdx-remote`
- Tailwind CSS (Leaflyte sage/forest palette)
- Fuse.js client-side search

## Develop locally

```bash
cd landing/docs
npm install
npm run dev
```

Open http://localhost:3001/docs/

## Build

```bash
npm run build   # runs prebuild (search index) then next build → out/
```

From repo root, the landing build includes docs automatically:

```bash
cd landing && npm run build
```

## Add pages

See [`content/README.md`](content/README.md) for the MDX frontmatter pattern and nav registration in `lib/nav.ts`.
