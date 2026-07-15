import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/public-api';
import { ThemeCategories } from '@/components/themes/ThemeRenderer';

type Params = Promise<{ slug: string }>;

export default async function CustomDomainCategoriesPage({ params }: { params: Params }) {
  const { slug } = await params;

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
      basePath=""
    />
  );
}
