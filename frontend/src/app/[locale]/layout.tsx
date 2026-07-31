import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Providers } from '@/components/providers';
import { ThemeProvider } from '@/components/theme-provider';

// NEXT_PUBLIC_APP_URL is sometimes configured without a protocol (e.g.
// "smarterbloggers.com") — new URL() throws on that, crashing generateMetadata
// server-side. Normalize instead of trusting the env var's format.
function withProtocol(url: string): string {
  return /^https?:\/\//.test(url) ? url : `https://${url}`;
}

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: { default: t('appName'), template: `%s | ${t('appName')}` },
    description: t('tagline'),
    metadataBase: new URL(
      withProtocol(
        process.env.NEXT_PUBLIC_APP_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
      )
    ),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <>
      {/* Set <html lang> synchronously — root layout doesn't know the locale */}
      <script
        dangerouslySetInnerHTML={{ __html: `document.documentElement.lang='${locale}'` }}
      />
      <NextIntlClientProvider messages={messages}>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </NextIntlClientProvider>
    </>
  );
}
