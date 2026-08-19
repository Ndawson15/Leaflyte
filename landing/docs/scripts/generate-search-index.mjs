import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const docsRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(docsRoot, 'content');
const outPath = path.join(docsRoot, 'public', 'search-index.json');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function extractHeadings(markdown) {
  const headings = [];
  for (const line of markdown.split('\n')) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) continue;
    const text = match[2].replace(/\*\*|__/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
    headings.push(text);
  }
  return headings;
}

function excerptFromContent(content, maxLength = 160) {
  const plain = content
    .replace(/^---[\s\S]*?---\n/m, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#>*_\[\]`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trim()}…`;
}

function getAllDocSlugs() {
  const slugs = [];

  function walk(dir, prefix = []) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'README.md') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, [...prefix, entry.name]);
      } else if (entry.name.endsWith('.mdx')) {
        slugs.push([...prefix, entry.name.replace(/\.mdx$/, '')]);
      }
    }
  }

  walk(contentDir);
  return slugs;
}

const index = [];

for (const slugParts of getAllDocSlugs()) {
  const filePath = path.join(contentDir, ...slugParts) + '.mdx';
  const source = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(source);
  const slug = slugParts.join('/');

  index.push({
    title: data.title ?? slug,
    slug,
    description: data.description ?? '',
    headings: extractHeadings(content),
    excerpt: data.description ?? excerptFromContent(content),
  });
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(index, null, 2));
console.log(`Generated search index (${index.length} pages) → public/search-index.json`);
