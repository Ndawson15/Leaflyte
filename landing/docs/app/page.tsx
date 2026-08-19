import { DocPageView } from '@/components/docs/DocPageView';
import { getDocBySlug } from '@/lib/docs';

export const metadata = {
  title: 'Documentation',
  description: 'Leaflyte documentation — install, configure, and get the most from your local-first notes vault.',
};

export default async function DocsIndexPage() {
  const doc = await getDocBySlug(['home']);
  if (!doc) {
    throw new Error('Missing content/home.mdx — documentation index page.');
  }

  return <DocPageView doc={doc} section={undefined} />;
}
