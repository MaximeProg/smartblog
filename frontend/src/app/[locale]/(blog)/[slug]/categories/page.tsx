import { redirect } from 'next/navigation';

type Params = Promise<{ locale: string; slug: string }>;

// Legacy route (/{locale}/{slug}/categories) — redirige vers app/blog/[slug]/categories.
export default async function PublicCategoriesPageRedirect({ params }: { params: Params }) {
  const { locale, slug } = await params;
  redirect(`/blog/${slug}/categories?lang=${locale}`);
}
