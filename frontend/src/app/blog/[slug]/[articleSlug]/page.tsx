import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { publicApi } from '@/lib/public-api';
import { ThemeArticle } from '@/components/themes/ThemeRenderer';
import { ViewTracker } from '@/components/ViewTracker';
import { BlogAnalyticsTracker } from '@/components/themes/shared/BlogAnalyticsTracker';
import ArticlePaywall from '@/components/themes/shared/ArticlePaywall';
import ArticleListenBanner from '@/components/themes/shared/ArticleListenBanner';
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

    const robotsNoindex = (article as any).robots_noindex === true;
    const canonicalUrl = (article as any).canonical_url as string | undefined;

    return {
      title: article.seo_title ?? article.title,
      description: article.seo_description ?? article.excerpt ?? undefined,
      alternates: {
        languages: buildHreflang(articleSlug),
        ...(canonicalUrl ? { canonical: canonicalUrl } : {}),
      },
      ...(robotsNoindex ? { robots: { index: false, follow: false } } : {}),
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

    // ── Paywall: article payant — renvoyer la page de déverrouillage ──
    if (article.is_paid) {
      const blogLang = (blog.language || 'en').toLowerCase();
      const loginLocale = CMS_SUPPORTED_LANGS.some((l) => l.code === blogLang) ? blogLang : 'en';
      return (
        <ArticlePaywall
          blog={blog}
          article={article}
          basePath=""
          locale={loginLocale}
        />
      );
    }

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      inLanguage: lang || blog.language,
      description: article.excerpt ?? undefined,
      ...(article.cover_image_url ? { image: article.cover_image_url } : {}),
      datePublished: article.published_at ?? undefined,
      author: (article as any).author ? {
        '@type': 'Person',
        name: (article as any).author?.display_name ?? 'Unknown',
      } : undefined,
      publisher: {
        '@type': 'Organization',
        name: blog.name,
        ...(blog.logo_url ? { logo: { '@type': 'ImageObject', url: blog.logo_url } } : {}),
      },
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ViewTracker blogSlug={slug} articleSlug={articleSlug} />
        <BlogAnalyticsTracker tenantId={blog.id} articleId={article.id} />

        {article.audio_url && (
          <ArticleListenBanner
            audioUrl={article.audio_url}
            title={article.title}
            authorName={(article as any).author_name ?? null}
            coverUrl={article.cover_image_url}
            primaryColor={blog.primary_color}
          />
        )}

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
