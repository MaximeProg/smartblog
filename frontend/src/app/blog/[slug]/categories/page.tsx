import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/public-api';
import { ThemeCategories } from '@/components/themes/ThemeRenderer';

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ lang?: string }>;

export default async function CustomDomainCategoriesPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const { lang } = await searchParams;

  let blog, categories, articles;
  try {
    [blog, categories, articles] = await Promise.all([
      publicApi.getBlogInfo(slug, lang),
      publicApi.getCategories(slug),
      publicApi.getArticles(slug, { lang }),
    ]);
  } catch {
    notFound();
  }

  return (
    <ThemeCategories
      blog={blog}
      categories={categories}
      articles={articles}
      basePath=""
    />
  );
}
