import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/public-api';
import { ThemeAbout } from '@/components/themes/ThemeRenderer';
import { BlogAnalyticsTracker } from '@/components/themes/shared/BlogAnalyticsTracker';

type Params = Promise<{ locale: string; slug: string }>;

export default async function PublicAboutPage({ params }: { params: Params }) {
  const { locale, slug } = await params;

  let blog, categories;
  try {
    [blog, categories] = await Promise.all([
      publicApi.getBlogInfo(slug),
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
        basePath={`/${locale}/${slug}`}
      />
    </>
  );
}
