import { redirect } from 'next/navigation';

type Params = Promise<{ locale: string; slug: string }>;

// Legacy route (/{locale}/{slug}/bookmarks) — redirige vers app/blog/[slug]/bookmarks.
export default async function BookmarksPageRedirect({ params }: { params: Params }) {
  const { locale, slug } = await params;
  redirect(`/blog/${slug}/bookmarks?lang=${locale}`);
}
