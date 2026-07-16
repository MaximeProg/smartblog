import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { publicApi } from '@/lib/public-api';
import { ThemeArticle } from '@/components/themes/ThemeRenderer';
import { ViewTracker } from '@/components/ViewTracker';
import { CMS_SUPPORTED_LANGS } from '@/config/cms';

interface Props {
  params: Promise<{ slug: string; articleSlug: string }>;
  searchParams: Promise<{ lang?: string }>;
}

function buildHreflang(articleSlug: string) {
  const languages: Record<string, string> = { 'x-default': `/${articleSlug}` };
  for (const l of CMS_SUPPORTED_LANGS) {
    languages[l.code] = l.code === 'en' ? `/${articleSlug}` : `/${l.code}/${articleSlug}`;
  }
  return languages;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug, articleSlug } = await params;
  const { lang } = await searchParams;
  try {
    const [blog, article] = await Promise.all([
      publicApi.getBlogInfo(slug),
      publicApi.getArticle(slug, articleSlug, lang),
    ]);
    return {
      title: article.seo_title ?? article.title,
      description: article.seo_description ?? article.excerpt ?? undefined,
      alternates: { languages: buildHreflang(articleSlug) },
      openGraph: {
        title: article.seo_title ?? article.title,
        description: article.seo_description ?? article.excerpt ?? undefined,
        images: article.cover_image_url ? [article.cover_image_url] : [],
        type: 'article',
        publishedTime: article.published_at ?? undefined,
        authors: article.author_name ? [article.author_name] : [],
        siteName: blog.name,
        locale: lang,
      },
      twitter: {
        card: 'summary_large_image',
        title: article.seo_title ?? article.title,
        description: article.seo_description ?? article.excerpt ?? undefined,
        images: article.cover_image_url ? [article.cover_image_url] : [],
      },
    };
  } catch {
    return { title: 'Article' };
  }
}

export default async function ArticlePage({ params, searchParams }: Props) {
  const { slug, articleSlug } = await params;
  const { lang } = await searchParams;
  try {
    const [blog, article, relatedArticles] = await Promise.all([
      publicApi.getBlogInfo(slug, lang),
      publicApi.getArticle(slug, articleSlug, lang),
      publicApi.getArticles(slug, { limit: 4, lang }),
    ]);

    const related = relatedArticles.filter((a) => a.slug !== articleSlug).slice(0, 3);

    return (
      <>
        <ViewTracker blogSlug={slug} articleSlug={articleSlug} />
        <ThemeArticle
          blog={blog}
          article={article}
          relatedArticles={related}
          basePath=""
          lang={lang}
        />
      </>
    );
  } catch {
    notFound();
  }
}
