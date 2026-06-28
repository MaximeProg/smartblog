import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Providers } from '@/components/providers';
import { ThemeProvider } from '@/components/theme-provider';

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
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
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
