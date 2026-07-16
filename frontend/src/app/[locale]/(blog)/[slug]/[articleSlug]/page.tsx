import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/public-api';
import { ThemeArticle } from '@/components/themes/ThemeRenderer';
import { BlogAnalyticsTracker } from '@/components/themes/shared/BlogAnalyticsTracker';
import ArticlePaywall from '@/components/themes/shared/ArticlePaywall';
import ArticleListenBanner from '@/components/themes/shared/ArticleListenBanner';

export const revalidate = 60;

type Params = Promise<{ locale: string; slug: string; articleSlug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, articleSlug } = await params;
  try {
    const [blog, article] = await Promise.all([
      publicApi.getBlogInfo(slug),
      publicApi.getArticle(slug, articleSlug),
    ]);

    const robotsNoindex = (article as any).robots_noindex === true;
    const canonicalUrl  = (article as any).canonical_url as string | undefined;

    return {
      title: article.seo_title ?? `${article.title} — ${blog.name}`,
      description: article.seo_description ?? article.excerpt ?? undefined,
      ...(robotsNoindex ? { robots: { index: false, follow: false } } : {}),
      ...(canonicalUrl  ? { alternates: { canonical: canonicalUrl } } : {}),
      openGraph: {
        title: article.seo_title ?? article.title,
        description: article.seo_description ?? article.excerpt ?? undefined,
        type: 'article',
        publishedTime: article.published_at ?? undefined,
        ...(article.cover_image_url ? { images: [{ url: article.cover_image_url }] } : {}),
      },
    };
  } catch {
    return { title: articleSlug };
  }
}

export default async function PublicArticlePage({
  params, searchParams,
}: { params: Params; searchParams: Promise<{ lang?: string }> }) {
  const { locale, slug, articleSlug } = await params;
  const { lang } = await searchParams;

  let blog: Awaited<ReturnType<typeof publicApi.getBlogInfo>>;
  let article: Awaited<ReturnType<typeof publicApi.getArticle>>;
  let relatedArticles: Awaited<ReturnType<typeof publicApi.getArticles>>;
  let categories: Awaited<ReturnType<typeof publicApi.getCategories>>;

  try {
    [blog, article, categories] = await Promise.all([
      publicApi.getBlogInfo(slug),
      publicApi.getArticle(slug, articleSlug, lang),
      publicApi.getCategories(slug),
    ]);
    relatedArticles = await publicApi.getArticles(slug, {
      category: (article as any).category_slug ?? undefined,
      limit: 3,
    });
    relatedArticles = relatedArticles.filter((a) => a.slug !== articleSlug);
  } catch {
    notFound();
  }

  const basePath = `/${locale}/${slug}`;

  // ── Paywall: article payant — renvoyer la page de déverrouillage ──
  if (article.is_paid) {
    return (
      <ArticlePaywall
        blog={blog}
        article={article}
        basePath={basePath}
        locale={locale}
      />
    );
  }

  // JSON-LD structured data
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
      <BlogAnalyticsTracker tenantId={blog.id} articleId={article.id} />

      {/* Listen banner — affiché si un audio TTS est disponible */}
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
        relatedArticles={relatedArticles}
        categories={categories}
        basePath={basePath}
        lang={lang}
      />
    </>
  );
}
