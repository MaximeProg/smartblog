import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { publicApi } from '@/lib/public-api';

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const blog = await publicApi.getBlogInfo(slug);
    return {
      metadataBase: new URL(`https://${blog.slug}.nexusblog.io`),
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
  const googleFontsUrl = font_family && font_family !== 'Inter' && font_family !== 'system-ui'
    ? `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font_family)}:ital,wght@0,400;0,500;0,700;0,800;1,400&display=swap`
    : null;

  return (
    // CSS custom properties injected on the root div — cascade to all children
    <div
      id="blog-root"
      style={{
        '--blog-primary': primary_color,
        '--blog-font': `'${font_family}', Georgia, system-ui, sans-serif`,
        fontFamily: `var(--blog-font)`,
        minHeight: '100vh',
      } as React.CSSProperties}
    >
      {/* Dynamic Google Font via @import — hoisted by browser */}
      {googleFontsUrl && (
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `@import url('${googleFontsUrl}');`,
          }}
        />
      )}
      {children}
    </div>
  );
}
