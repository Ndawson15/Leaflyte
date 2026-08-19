import { DocHeader } from '@/components/docs/DocHeader';
import { TableOfContents } from '@/components/docs/TableOfContents';
import { VideoCta } from '@/components/docs/VideoCta';
import type { DocPage } from '@/lib/docs';

type DocPageViewProps = {
  doc: DocPage;
  section?: string;
};

export function DocPageView({ doc, section }: DocPageViewProps) {
  return (
    <div className="docs-page-grid">
      <article className="min-w-0">
        <DocHeader
          section={section}
          title={doc.frontmatter.title}
          category={doc.frontmatter.category}
          readingTime={doc.readingTime}
          lastUpdated={doc.frontmatter.lastUpdated}
          isHome={!section}
        />
        <h1 className="docs-h1">{doc.frontmatter.title}</h1>
        {doc.frontmatter.videoUrl ? (
          <VideoCta
            href={doc.frontmatter.videoUrl}
            label={doc.frontmatter.videoLabel ?? 'Watch Video'}
          />
        ) : null}
        <div className="docs-prose">{doc.content}</div>
      </article>
      <TableOfContents headings={doc.headings} />
    </div>
  );
}
