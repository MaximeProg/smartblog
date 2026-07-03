import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/public-api';
import CorporateContactPage from '@/components/themes/corporate/CorporateContact';

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
    <CorporateContactPage
      blog={blog}
      categories={categories}
      basePath={`/${locale}/${slug}`}
    />
  );
}
