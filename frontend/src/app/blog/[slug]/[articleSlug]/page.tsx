import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { publicApi } from '@/lib/public-api';
import { ThemeArticle } from '@/components/themes/ThemeRenderer';

interface Props {
  params: Promise<{ slug: string; articleSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, articleSlug } = await params;
  try {
    const [blog, article] = await Promise.all([
      publicApi.getBlogInfo(slug),
      publicApi.getArticle(slug, articleSlug),
    ]);
    return {
      title: article.seo_title ?? article.title,
      description: article.seo_description ?? article.excerpt ?? undefined,
      openGraph: {
        title: article.seo_title ?? article.title,
        description: article.seo_description ?? article.excerpt ?? undefined,
        images: article.cover_image_url ? [article.cover_image_url] : [],
        type: 'article',
        publishedTime: article.published_at ?? undefined,
        authors: article.author_name ? [article.author_name] : [],
        siteName: blog.name,
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

export default async function ArticlePage({ params }: Props) {
  const { slug, articleSlug } = await params;
  try {
    const [blog, article, relatedArticles] = await Promise.all([
      publicApi.getBlogInfo(slug),
      publicApi.getArticle(slug, articleSlug),
      publicApi.getArticles(slug, { limit: 4 }),
    ]);

    const related = relatedArticles.filter((a) => a.slug !== articleSlug).slice(0, 3);

    return (
      <ThemeArticle
        blog={blog}
        article={article}
        relatedArticles={related}
      />
    );
  } catch {
    notFound();
  }
}
