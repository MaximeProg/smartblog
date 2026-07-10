import { publicApi } from '@/lib/public-api';
import { notFound } from 'next/navigation';
import BookmarksClientPage from './BookmarksClientPage';

type Params = Promise<{ locale: string; slug: string }>;

export default async function BookmarksPage({ params }: { params: Params }) {
  const { locale, slug } = await params;

  let blog;
  try {
    blog = await publicApi.getBlogInfo(slug);
  } catch {
    notFound();
  }

  return <BookmarksClientPage blog={blog} slug={slug} locale={locale} />;
}
