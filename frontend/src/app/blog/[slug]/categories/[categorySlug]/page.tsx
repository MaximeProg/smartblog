import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/public-api';
import { ThemeCategoryPage } from '@/components/themes/ThemeRenderer';

type Params = Promise<{ slug: string; categorySlug: string }>;
type SearchParams = Promise<{ lang?: string }>;

export default async function CustomDomainCategoryPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug, categorySlug } = await params;
  const { lang } = await searchParams;

  let blog, categories, articles;
  try {
    [blog, categories, articles] = await Promise.all([
      publicApi.getBlogInfo(slug, lang),
      publicApi.getCategories(slug),
      publicApi.getArticles(slug, { category: categorySlug, lang }),
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
