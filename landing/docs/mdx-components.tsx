import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import { Callout } from '@/components/docs/Callout';
import { CodeBlock } from '@/components/docs/CodeBlock';
import { Figure } from '@/components/docs/Figure';
import { VideoCta } from '@/components/docs/VideoCta';

function DocsLink(props: React.ComponentPropsWithoutRef<'a'>) {
  const href = props.href ?? '';

  if (href.startsWith('/') && !href.startsWith('//') && !href.startsWith('/docs')) {
    return <Link href={href} className="docs-a">{props.children}</Link>;
  }

  if (href.startsWith('/') || href.startsWith('#')) {
    return <a {...props} className="docs-a" />;
  }

  return <a {...props} className="docs-a" target="_blank" rel="noreferrer" />;
}

export function getMdxComponents(): MDXComponents {
  return {
    Callout,
    Figure,
    VideoCta,
    pre: (props) => <CodeBlock {...props} />,
    h1: (props) => <h1 className="docs-h1" {...props} />,
    h2: (props) => <h2 className="docs-h2" {...props} />,
    h3: (props) => <h3 className="docs-h3" {...props} />,
    h4: (props) => <h4 className="docs-h4" {...props} />,
    p: (props) => <p className="docs-p" {...props} />,
    ul: (props) => <ul className="docs-ul" {...props} />,
    ol: (props) => <ol className="docs-ol" {...props} />,
    li: (props) => <li className="docs-li" {...props} />,
    a: (props) => <DocsLink {...props} />,
    blockquote: (props) => <blockquote className="docs-blockquote" {...props} />,
    hr: () => <hr className="docs-hr" />,
    table: (props) => (
      <div className="docs-table-wrap">
        <table className="docs-table" {...props} />
      </div>
    ),
    code: (props) => {
      const isInline = typeof props.children === 'string' && !props.className;
      if (isInline) {
        return <code className="docs-inline-code" {...props} />;
      }
      return <code {...props} />;
    },
  };
}

export function useMDXComponents(): MDXComponents {
  return getMdxComponents();
}
