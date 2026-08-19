import type { Metadata } from 'next';
import { DocsShell } from '@/components/docs/DocsShell';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Leaflyte Docs',
    template: '%s · Leaflyte Docs',
  },
  description: 'Documentation for self-hosting, configuring, and troubleshooting Leaflyte.',
  icons: {
    icon: '/docs/assets/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DocsShell>{children}</DocsShell>
      </body>
    </html>
  );
}
