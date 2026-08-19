export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export type TocHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

export function extractHeadings(markdown: string): TocHeading[] {
  const headings: TocHeading[] = [];

  for (const line of markdown.split('\n')) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) continue;

    const level = match[1].length as 2 | 3;
    const text = match[2].replace(/\*\*|__/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
    headings.push({ id: slugify(text), text, level });
  }

  return headings;
}

export function excerptFromContent(content: string, maxLength = 160): string {
  const plain = content
    .replace(/^---[\s\S]*?---\n/m, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#>*_\[\]`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trim()}…`;
}
