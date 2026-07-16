import { publicApi } from '@/lib/public-api';
import { notFound } from 'next/navigation';
import BookmarksClientPage from '@/app/[locale]/(blog)/[slug]/bookmarks/BookmarksClientPage';

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ lang?: string }>;

export default async function CustomDomainBookmarksPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const { lang } = await searchParams;

  let blog;
  try {
    blog = await publicApi.getBlogInfo(slug, lang);
  } catch {
    notFound();
  }

  return <BookmarksClientPage blog={blog} slug={slug} locale={blog.language || 'en'} basePath="" />;
}
