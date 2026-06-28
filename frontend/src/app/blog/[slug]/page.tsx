import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/public-api';
import { ThemeHome } from '@/components/themes/ThemeRenderer';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function BlogHomePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { category, q } = await searchParams;

  try {
    const [blog, articles, categories] = await Promise.all([
      publicApi.getBlogInfo(slug),
      publicApi.getArticles(slug, { category, q, limit: 20 }),
      publicApi.getCategories(slug),
    ]);

    return (
      <ThemeHome
        blog={blog}
        articles={articles}
        categories={categories}
        currentCategory={category}
        searchQuery={q}
      />
    );
  } catch {
    notFound();
  }
}
