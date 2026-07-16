import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/public-api';
import { ThemeAbout } from '@/components/themes/ThemeRenderer';
import { BlogAnalyticsTracker } from '@/components/themes/shared/BlogAnalyticsTracker';

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ lang?: string }>;

export default async function CustomDomainAboutPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const { lang } = await searchParams;

  let blog, categories;
  try {
    [blog, categories] = await Promise.all([
      publicApi.getBlogInfo(slug, lang),
      publicApi.getCategories(slug),
    ]);
  } catch {
    notFound();
  }

  return (
    <>
      <BlogAnalyticsTracker tenantId={blog.id} />
      <ThemeAbout
        blog={blog}
        categories={categories}
        basePath=""
      />
    </>
  );
}
