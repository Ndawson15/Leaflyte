export type NavItem = {
  title: string;
  slug?: string;
  children?: NavItem[];
};

/** Config-driven sidebar navigation. Add pages here, then create matching .mdx under content/. */
export const DOCS_NAV: NavItem[] = [
  {
    title: 'Getting Started',
    children: [
      { title: 'Documentation Home', slug: 'home' },
      { title: 'What is Leaflyte', slug: 'getting-started/what-is-leaflyte' },
      { title: 'Quick Start', slug: 'getting-started/quick-start' },
      { title: 'Self-Hosting Requirements', slug: 'getting-started/self-hosting-requirements' },
    ],
  },
  {
    title: 'Deployment',
    children: [
      { title: 'Docker', slug: 'deployment/docker' },
      { title: 'Unraid', slug: 'deployment/unraid' },
      { title: 'Docker Compose Reference', slug: 'deployment/docker-compose-reference' },
      { title: 'Environment Variables', slug: 'deployment/environment-variables' },
      { title: 'Reverse Proxy / SSL Setup', slug: 'deployment/reverse-proxy-ssl' },
    ],
  },
  {
    title: 'Core Features',
    children: [
      { title: 'Creating & Organizing Notes', slug: 'core-features/creating-organizing-notes' },
      { title: 'Search', slug: 'core-features/search' },
      { title: 'Tags & Folders', slug: 'core-features/tags-folders' },
      { title: 'Markdown Support', slug: 'core-features/markdown-support' },
      { title: 'Attachments', slug: 'core-features/attachments' },
    ],
  },
  {
    title: 'Data & Storage',
    children: [
      { title: 'Database Configuration', slug: 'data-storage/database-configuration' },
      { title: 'Backups & Restore', slug: 'data-storage/backups-restore' },
      { title: 'Exporting Your Data', slug: 'data-storage/exporting-data' },
      { title: 'Migrations', slug: 'data-storage/migrations' },
    ],
  },
  {
    title: 'Accounts & Access',
    children: [
      { title: 'Authentication', slug: 'accounts-access/authentication' },
      { title: 'Multi-user Setup', slug: 'accounts-access/multi-user-setup' },
      { title: 'Permissions', slug: 'accounts-access/permissions' },
    ],
  },
  {
    title: 'Customization',
    children: [
      { title: 'Themes', slug: 'customization/themes' },
      { title: 'Settings Reference', slug: 'customization/settings-reference' },
    ],
  },
  {
    title: 'API Reference',
    children: [
      { title: 'Authentication', slug: 'api-reference/authentication' },
      { title: 'Endpoints', slug: 'api-reference/endpoints' },
      { title: 'Rate Limits', slug: 'api-reference/rate-limits' },
    ],
  },
  {
    title: 'Troubleshooting',
    children: [
      { title: 'Common Errors', slug: 'troubleshooting/common-errors' },
      { title: 'Upgrading Versions', slug: 'troubleshooting/upgrading-versions' },
      { title: 'FAQ', slug: 'troubleshooting/faq' },
    ],
  },
];

export type TopNavTab = {
  label: string;
  href: string;
  matchPrefix?: string;
};

export const GITHUB_URL = 'https://github.com/Ndawson15/Leaflyte';
export const GET_STARTED_URL = '/getting-started/quick-start/';

export const TOP_NAV_TABS: TopNavTab[] = [
  { label: 'Documentation', href: '/', matchPrefix: '__docs__' },
  { label: 'Guides', href: '/guides/', matchPrefix: '/guides' },
  { label: 'Changelog', href: '/changelog/', matchPrefix: '/changelog' },
  { label: 'Help Center', href: '/troubleshooting/faq/', matchPrefix: '/troubleshooting/faq' },
];

/** Flatten nav config into slug list for validation and search. */
export function flattenNav(items: NavItem[] = DOCS_NAV): { title: string; slug: string; section: string }[] {
  const out: { title: string; slug: string; section: string }[] = [];

  for (const section of items) {
    for (const child of section.children ?? []) {
      if (child.slug) {
        out.push({ title: child.title, slug: child.slug, section: section.title });
      }
    }
  }

  return out;
}

/** Find parent section title for breadcrumbs. */
export function findSectionForSlug(slug: string): string | undefined {
  for (const section of DOCS_NAV) {
    for (const child of section.children ?? []) {
      if (child.slug === slug) return section.title;
    }
  }
  return undefined;
}

/** Check if slug is under an active branch (for sidebar parent highlight). */
export function isSectionActive(section: NavItem, currentSlug: string): boolean {
  return (section.children ?? []).some((child) => child.slug === currentSlug);
}

export function slugToHref(slug: string): string {
  if (slug === 'home') return '/';
  return `/${slug}/`;
}
