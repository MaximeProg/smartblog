import { redirect } from 'next/navigation';

type Params = Promise<{ locale: string; slug: string; articleSlug: string }>;
type SearchParams = Promise<{ lang?: string }>;

// Legacy route (/{locale}/{slug}/{articleSlug}) — redirige vers
// app/blog/[slug]/[articleSlug], la seule implémentation maintenue
// (paywall, bandeau audio, tracker analytics, JSON-LD, traduction).
export default async function PublicArticlePageRedirect({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale, slug, articleSlug } = await params;
  const { lang } = await searchParams;
  redirect(`/blog/${slug}/${articleSlug}?lang=${lang || locale}`);
}
