import { redirect } from 'next/navigation';

type Params = Promise<{ locale: string; slug: string }>;
type SearchParams = Promise<{ category?: string; q?: string; cursor?: string }>;

// Legacy route (/{locale}/{slug}) — redirige vers la vraie implémentation,
// désormais consolidée sur app/blog/[slug].
export default async function PublicBlogPageRedirect({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale, slug } = await params;
  const { category, q, cursor } = await searchParams;

  const qs = new URLSearchParams();
  if (category) qs.set('category', category);
  if (q) qs.set('q', q);
  if (cursor) qs.set('cursor', cursor);
  qs.set('lang', locale);

  redirect(`/blog/${slug}?${qs.toString()}`);
}
