import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { publicApi } from '@/lib/public-api';
import { BlogReaderProvider } from '@/components/themes/shared/BlogReaderProvider';
import { PersistentAudioProvider } from '@/components/themes/shared/PersistentAudioPlayer';
import FloatingSearch from '@/components/themes/shared/FloatingSearch';

/* eslint-disable @typescript-eslint/no-require-imports */
const enMessages: AbstractIntlMessages = require('@/messages/en.json');
const frMessages: AbstractIntlMessages = require('@/messages/fr.json');
/* eslint-enable @typescript-eslint/no-require-imports */

const MESSAGES: Record<string, AbstractIntlMessages> = { en: enMessages, fr: frMessages };

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const blog = await publicApi.getBlogInfo(slug);
    return {
      metadataBase: new URL(`https://${slug}.smarterbloggers.com`),
      title: { default: blog.name, template: `%s — ${blog.name}` },
      description: blog.description ?? undefined,
      icons: { icon: blog.favicon_url ?? '/favicon.ico' },
      openGraph: {
        siteName: blog.name,
        images: blog.cover_image_url ? [blog.cover_image_url] : [],
      },
    };
  } catch {
    return { title: 'Blog' };
  }
}

export default async function BlogLayout({ children, params }: Props) {
  const { slug } = await params;
  let blog;
  try {
    blog = await publicApi.getBlogInfo(slug);
  } catch {
    notFound();
  }

  const { primary_color, font_family } = blog;
  const locale = blog.language || 'en';
  const messages = MESSAGES[locale] ?? MESSAGES.en;

  const needsGoogleFont =
    font_family &&
    !['Inter', 'system-ui', 'sans-serif', 'Arial', 'Georgia'].includes(font_family);

  const googleFontsUrl = needsGoogleFont
    ? `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font_family)}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap`
    : null;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div
        id="blog-root"
        style={{
          '--blog-primary': primary_color,
          '--blog-font': needsGoogleFont
            ? `'${font_family}', system-ui, sans-serif`
            : `${font_family}, system-ui, sans-serif`,
          minHeight: '100vh',
        } as React.CSSProperties}
      >
        {googleFontsUrl && (
          <style
            dangerouslySetInnerHTML={{
              __html: `@import url('${googleFontsUrl}');`,
            }}
          />
        )}
        <PersistentAudioProvider>
          <BlogReaderProvider primaryColor={primary_color}>
            {children}
          </BlogReaderProvider>
        </PersistentAudioProvider>
        <FloatingSearch basePath="" locale={locale} />
      </div>
    </NextIntlClientProvider>
  );
}
