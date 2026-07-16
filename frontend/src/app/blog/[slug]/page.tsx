import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/public-api';
import { ThemeHome } from '@/components/themes/ThemeRenderer';
import { BlogAnalyticsTracker } from '@/components/themes/shared/BlogAnalyticsTracker';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string; q?: string; lang?: string }>;
}

export default async function BlogHomePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { category, q, lang } = await searchParams;

  try {
    const [blog, articles, categories] = await Promise.all([
      publicApi.getBlogInfo(slug, lang),
      publicApi.getArticles(slug, { category, q, limit: 20, lang }),
      publicApi.getCategories(slug),
    ]);

    return (
      <>
        <BlogAnalyticsTracker tenantId={blog.id} />
        <ThemeHome
          blog={blog}
          articles={articles}
          categories={categories}
          currentCategory={category}
          searchQuery={q}
          basePath=""
        />
      </>
    );
  } catch {
    notFound();
  }
}
