import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { KeymapProvider } from '@/components/KeymapProvider';
import { AppProviders } from '@/components/AppProviders';

export const metadata: Metadata = {
  title: 'Leaflyte',
  description: 'A notes vault that speaks in real file types.',
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png' }, { url: '/leaflyte.png', type: 'image/png' }],
    apple: '/leaflyte.png'
  }
};

const themeBoot = `(function(){try{var t=localStorage.getItem('leaflyte.theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="font-mono antialiased h-full overflow-hidden">
        <ThemeProvider>
          <AppProviders>
            <KeymapProvider>
              <div className="h-full overflow-hidden">{children}</div>
            </KeymapProvider>
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
