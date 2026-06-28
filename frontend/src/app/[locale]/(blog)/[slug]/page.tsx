import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/public-api';
import { ThemeHome } from '@/components/themes/ThemeRenderer';

export const revalidate = 60;

type Params = Promise<{ locale: string; slug: string }>;
type SearchParams = Promise<{ category?: string; q?: string; cursor?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const blog = await publicApi.getBlogInfo(slug);
    return {
      title: blog.name,
      description: blog.description ?? undefined,
      openGraph: blog.cover_image_url ? { images: [{ url: blog.cover_image_url }] } : undefined,
    };
  } catch {
    return { title: slug };
  }
}

export default async function PublicBlogPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const { category, q, cursor } = await searchParams;

  let blog, articles, categories;
  try {
    [blog, articles, categories] = await Promise.all([
      publicApi.getBlogInfo(slug),
      publicApi.getArticles(slug, { category, q, cursor, limit: 20 }),
      publicApi.getCategories(slug),
    ]);
  } catch {
    notFound();
  }

  return (
    <ThemeHome
      blog={blog}
      articles={articles}
      categories={categories}
      currentCategory={category}
      searchQuery={q}
    />
  );
}
