import { publicApi } from '@/lib/public-api';
import { notFound } from 'next/navigation';
import BookmarksClientPage from '@/app/[locale]/(blog)/[slug]/bookmarks/BookmarksClientPage';

type Params = Promise<{ slug: string }>;

export default async function CustomDomainBookmarksPage({ params }: { params: Params }) {
  const { slug } = await params;

  let blog;
  try {
    blog = await publicApi.getBlogInfo(slug);
  } catch {
    notFound();
  }

  return <BookmarksClientPage blog={blog} slug={slug} locale={blog.language || 'en'} basePath="" />;
}
