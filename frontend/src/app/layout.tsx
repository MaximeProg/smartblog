import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { ThemeScript } from '@/components/theme-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// Root layout — required by Next.js 15, owns <html> and <body>.
// Child layouts (locale, blog, blog-preview) add providers or wrappers, NOT another <html>/<body>.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
