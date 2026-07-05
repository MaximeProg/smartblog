import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/public-api';
import { ThemeCategories } from '@/components/themes/ThemeRenderer';

type Params = Promise<{ locale: string; slug: string }>;

export default async function PublicCategoriesPage({ params }: { params: Params }) {
  const { locale, slug } = await params;

  let blog, categories, articles;
  try {
    [blog, categories, articles] = await Promise.all([
      publicApi.getBlogInfo(slug),
      publicApi.getCategories(slug),
      publicApi.getArticles(slug),
    ]);
  } catch {
    notFound();
  }

  return (
    <ThemeCategories
      blog={blog}
      categories={categories}
      articles={articles}
      basePath={`/${locale}/${slug}`}
    />
  );
}
