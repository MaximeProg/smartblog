import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/public-api';
import { ThemeArticle } from '@/components/themes/ThemeRenderer';
import { BlogAnalyticsTracker } from '@/components/themes/shared/BlogAnalyticsTracker';

export const revalidate = 60;

type Params = Promise<{ locale: string; slug: string; articleSlug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, articleSlug } = await params;
  try {
    const [blog, article] = await Promise.all([
      publicApi.getBlogInfo(slug),
      publicApi.getArticle(slug, articleSlug),
    ]);
    return {
      title: `${article.title} — ${blog.name}`,
      description: article.seo_description ?? article.excerpt ?? undefined,
      openGraph: {
        title: article.seo_title ?? article.title,
        description: article.seo_description ?? article.excerpt ?? undefined,
        ...(article.cover_image_url ? { images: [{ url: article.cover_image_url }] } : {}),
      },
    };
  } catch {
    return { title: articleSlug };
  }
}

export default async function PublicArticlePage({ params }: { params: Params }) {
  const { locale, slug, articleSlug } = await params;

  let blog, article, relatedArticles, categories;
  try {
    [blog, article, categories] = await Promise.all([
      publicApi.getBlogInfo(slug),
      publicApi.getArticle(slug, articleSlug),
      publicApi.getCategories(slug),
    ]);
    relatedArticles = await publicApi.getArticles(slug, {
      category: article.category_slug ?? undefined,
      limit: 3,
    });
    relatedArticles = relatedArticles.filter((a) => a.slug !== articleSlug);
  } catch {
    notFound();
  }

  return (
    <>
      <BlogAnalyticsTracker tenantId={blog.id} articleId={article.id} />
      <ThemeArticle
        blog={blog}
        article={article}
        relatedArticles={relatedArticles}
        categories={categories}
        basePath={`/${locale}/${slug}`}
      />
    </>
  );
}
