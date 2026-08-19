import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { CategoryBadge } from '@/components/docs/CategoryBadge';
import { DocMeta } from '@/components/docs/DocMeta';

type DocHeaderProps = {
  section?: string;
  title: string;
  category?: string;
  readingTime: number;
  lastUpdated?: string;
  isHome?: boolean;
};

export function DocHeader({
  section,
  title,
  category,
  readingTime,
  lastUpdated,
  isHome = false,
}: DocHeaderProps) {
  return (
    <header className="docs-page-header">
      <div className="min-w-0 flex-1">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
            <li className="inline-flex items-center gap-1">
              {isHome ? (
                <span className="font-medium text-forest">Documentation</span>
              ) : (
                <>
                  <Link href="/" className="hover:text-accent">
                    Documentation
                  </Link>
                  {section ? (
                    <>
                      <ChevronRight size={14} />
                      <span>{section}</span>
                    </>
                  ) : null}
                  <ChevronRight size={14} />
                  <span className="font-medium text-forest">{title}</span>
                </>
              )}
            </li>
          </ol>
        </nav>
        {category ? <CategoryBadge category={category} className="mt-4" /> : null}
      </div>
      <DocMeta readingTime={readingTime} lastUpdated={lastUpdated} />
    </header>
  );
}
