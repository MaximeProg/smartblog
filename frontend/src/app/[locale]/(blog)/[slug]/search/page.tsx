import { publicApi } from '@/lib/public-api';
import { notFound } from 'next/navigation';
import SearchClientPage from './SearchClientPage';

type Params = Promise<{ locale: string; slug: string }>;
type SearchParams = Promise<{ q?: string }>;

export default async function PublicSearchPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale, slug } = await params;
  const { q } = await searchParams;

  let blog;
  try {
    blog = await publicApi.getBlogInfo(slug);
  } catch {
    notFound();
  }

  let initialResults = null;
  if (q && q.trim()) {
    try {
      initialResults = await publicApi.search(slug, { q: q.trim(), size: 20 });
    } catch {
      // silently fail — client will retry
    }
  }

  return (
    <SearchClientPage
      blog={blog}
      slug={slug}
      locale={locale}
      initialQuery={q ?? ''}
      initialResults={initialResults}
    />
  );
}
