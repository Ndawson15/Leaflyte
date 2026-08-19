import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypePrettyCode from 'rehype-pretty-code';
import { getMdxComponents } from '@/mdx-components';
import { extractHeadings, estimateReadingTime, excerptFromContent } from '@/lib/utils';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export type DocFrontmatter = {
  title: string;
  description?: string;
  category?: string;
  lastUpdated?: string;
  readingTime?: number;
  videoUrl?: string;
  videoLabel?: string;
};

export type DocPage = {
  slug: string;
  frontmatter: DocFrontmatter;
  content: React.ReactElement;
  headings: ReturnType<typeof extractHeadings>;
  readingTime: number;
  excerpt: string;
  rawContent: string;
};

function resolveContentPath(slugParts: string[]): string {
  return path.join(CONTENT_DIR, ...slugParts) + '.mdx';
}

export function docExists(slugParts: string[]): boolean {
  return fs.existsSync(resolveContentPath(slugParts));
}

export function getAllDocSlugs(): string[][] {
  const slugs: string[][] = [];

  function walk(dir: string, prefix: string[] = []) {
    if (!fs.existsSync(dir)) return;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'README.md') continue;

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, [...prefix, entry.name]);
      } else if (entry.name.endsWith('.mdx')) {
        const slugName = entry.name.replace(/\.mdx$/, '');
        if (prefix.length === 0 && slugName === 'home') continue;
        slugs.push([...prefix, slugName]);
      }
    }
  }

  walk(CONTENT_DIR);
  return slugs;
}

export async function getDocBySlug(slugParts: string[]): Promise<DocPage | null> {
  const filePath = resolveContentPath(slugParts);
  if (!fs.existsSync(filePath)) return null;

  const source = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(source);
  const frontmatter = data as DocFrontmatter;
  const headings = extractHeadings(content);
  const readingTime = frontmatter.readingTime ?? estimateReadingTime(content);
  const excerpt = frontmatter.description ?? excerptFromContent(content);

  const { content: mdxContent } = await compileMDX({
    source: content,
    components: getMdxComponents(),
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypePrettyCode,
            {
              theme: 'github-dark',
              keepBackground: false,
              defaultLang: 'plaintext',
            },
          ],
        ],
      },
    },
  });

  return {
    slug: slugParts.join('/'),
    frontmatter,
    content: mdxContent,
    headings,
    readingTime,
    excerpt,
    rawContent: content,
  };
}
