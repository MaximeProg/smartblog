import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/public-api';

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function BlogSlugLayout({ children, params }: Props) {
  const { slug } = await params;
  let blog;
  try {
    blog = await publicApi.getBlogInfo(slug);
  } catch {
    notFound();
  }

  const { primary_color, font_family } = blog;
  const needsGoogleFont =
    font_family &&
    !['Inter', 'system-ui', 'sans-serif', 'Arial', 'Georgia'].includes(font_family);

  const googleFontsUrl = needsGoogleFont
    ? `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font_family)}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap`
    : null;

  return (
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
      {children}
    </div>
  );
}
