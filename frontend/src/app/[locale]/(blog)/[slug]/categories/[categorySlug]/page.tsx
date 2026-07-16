import { redirect } from 'next/navigation';

type Params = Promise<{ locale: string; slug: string; categorySlug: string }>;

// Legacy route (/{locale}/{slug}/categories/{categorySlug}) — redirige vers
// app/blog/[slug]/categories/[categorySlug].
export default async function PublicCategoryPageRedirect({ params }: { params: Params }) {
  const { locale, slug, categorySlug } = await params;
  redirect(`/blog/${slug}/categories/${categorySlug}?lang=${locale}`);
}
