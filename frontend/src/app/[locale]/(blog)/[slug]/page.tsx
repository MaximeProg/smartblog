import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/public-api';
import { ThemeHome } from '@/components/themes/ThemeRenderer';
import { BlogAnalyticsTracker } from '@/components/themes/shared/BlogAnalyticsTracker';

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
    blog = await publicApi.getBlogInfo(slug);
    const postsPerPage = (blog.template_config?.home as any)?.latest?.postsPerPage ?? 12;
    [articles, categories] = await Promise.all([
      publicApi.getArticles(slug, { category, q, cursor, limit: postsPerPage }),
      publicApi.getCategories(slug),
    ]);
  } catch {
    notFound();
  }

  return (
    <>
      <BlogAnalyticsTracker tenantId={blog.id} />
      <ThemeHome
        blog={blog}
        articles={articles}
        categories={categories}
        currentCategory={category}
        searchQuery={q}
      />
    </>
  );
}
