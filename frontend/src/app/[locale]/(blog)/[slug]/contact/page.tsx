import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/public-api';
import { ThemeContact } from '@/components/themes/ThemeRenderer';
import { BlogAnalyticsTracker } from '@/components/themes/shared/BlogAnalyticsTracker';

type Params = Promise<{ locale: string; slug: string }>;

export default async function PublicContactPage({ params }: { params: Params }) {
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
      <ThemeContact
        blog={blog}
        categories={categories}
        basePath={`/${locale}/${slug}`}
      />
    </>
  );
}
