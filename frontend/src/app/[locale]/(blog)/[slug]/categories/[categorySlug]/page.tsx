import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/public-api';
import CorporateCategoryPage from '@/components/themes/corporate/CorporateCategoryPage';

type Params = Promise<{ locale: string; slug: string; categorySlug: string }>;

export default async function PublicCategoryPage({ params }: { params: Params }) {
  const { locale, slug, categorySlug } = await params;

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
    <CorporateCategoryPage
      blog={blog}
      categories={categories}
      category={category}
      articles={articles}
      basePath={`/${locale}/${slug}`}
    />
  );
}
