import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/public-api';
import { ThemeCategoryPage } from '@/components/themes/ThemeRenderer';

type Params = Promise<{ slug: string; categorySlug: string }>;

export default async function CustomDomainCategoryPage({ params }: { params: Params }) {
  const { slug, categorySlug } = await params;

  let blog, categories, articles;
  try {
    [blog, categories, articles] = await Promise.all([
      publicApi.getBlogInfo(slug),
      publicApi.getCategories(slug),
      publicApi.getArticles(slug, { category: categorySlug }),
    ]);
  } catch {
    notFound();
  }

  const category = categories.find(c => c.slug === categorySlug);
  if (!category) notFound();

  return (
    <ThemeCategoryPage
      blog={blog}
      categories={categories}
      category={category}
      articles={articles}
      basePath=""
    />
  );
}
