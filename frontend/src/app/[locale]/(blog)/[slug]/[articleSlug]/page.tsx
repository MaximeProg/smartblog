import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/public-api';
import { ThemeArticle } from '@/components/themes/ThemeRenderer';

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
  const { slug, articleSlug } = await params;

  let blog, article, relatedArticles;
  try {
    [blog, article] = await Promise.all([
      publicApi.getBlogInfo(slug),
      publicApi.getArticle(slug, articleSlug),
    ]);
    relatedArticles = await publicApi.getArticles(slug, {
      category: article.category_slug ?? undefined,
      limit: 3,
    });
    // Exclude the current article from related
    relatedArticles = relatedArticles.filter((a) => a.slug !== articleSlug);
  } catch {
    notFound();
  }

  return (
    <ThemeArticle
      blog={blog}
      article={article}
      relatedArticles={relatedArticles}
    />
  );
}
