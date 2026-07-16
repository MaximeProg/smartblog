import { redirect } from 'next/navigation';

type Params = Promise<{ locale: string; slug: string }>;
type SearchParams = Promise<{ q?: string }>;

// Legacy route (/{locale}/{slug}/search) — redirige vers app/blog/[slug]/search.
export default async function PublicSearchPageRedirect({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale, slug } = await params;
  const { q } = await searchParams;

  const qs = new URLSearchParams();
  if (q) qs.set('q', q);
  qs.set('lang', locale);

  redirect(`/blog/${slug}/search?${qs.toString()}`);
}
