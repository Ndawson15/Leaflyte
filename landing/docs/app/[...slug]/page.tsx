import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocPageView } from '@/components/docs/DocPageView';
import { docExists, getAllDocSlugs, getDocBySlug } from '@/lib/docs';
import { findSectionForSlug } from '@/lib/nav';

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateStaticParams() {
  return getAllDocSlugs()
    .filter((slug) => slug.join('/') !== 'home')
    .map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!docExists(slug)) return { title: 'Not Found' };

  const doc = await getDocBySlug(slug);
  if (!doc) return { title: 'Not Found' };

  return {
    title: doc.frontmatter.title,
    description: doc.frontmatter.description ?? doc.excerpt,
  };
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  if (!docExists(slug) || slug.join('/') === 'home') notFound();

  const doc = await getDocBySlug(slug);
  if (!doc) notFound();

  const section = findSectionForSlug(doc.slug);

  return <DocPageView doc={doc} section={section} />;
}
