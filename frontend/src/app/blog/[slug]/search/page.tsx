import { publicApi } from '@/lib/public-api';
import { notFound } from 'next/navigation';
import SearchClientPage from '@/components/themes/shared/SearchClientPage';

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ q?: string; lang?: string }>;

export default async function CustomDomainSearchPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const { q, lang } = await searchParams;

  let blog;
  try {
    blog = await publicApi.getBlogInfo(slug, lang);
  } catch {
    notFound();
  }

  let initialResults = null;
  if (q && q.trim()) {
    try {
      initialResults = await publicApi.search(slug, { q: q.trim(), size: 20, lang });
    } catch {
      // silently fail — client will retry
    }
  }

  return (
    <SearchClientPage
      blog={blog}
      slug={slug}
      locale={blog.language || 'en'}
      initialQuery={q ?? ''}
      initialResults={initialResults}
      basePath=""
    />
  );
}
