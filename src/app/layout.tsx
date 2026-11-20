import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata } from 'next';
import './global.css';
import { Inter } from 'next/font/google';
import { appName } from '@/lib/shared';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: { template: `%s | ${appName}`, default: appName },
  description: 'One place to prepare for tech interviews.',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="flex flex-col min-h-screen">
        {/* Light theme only, and no search. */}
        <RootProvider theme={{ enabled: false }} search={{ enabled: false }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
