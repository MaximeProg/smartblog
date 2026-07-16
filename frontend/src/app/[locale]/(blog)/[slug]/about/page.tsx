import { redirect } from 'next/navigation';

type Params = Promise<{ locale: string; slug: string }>;

// Legacy route (/{locale}/{slug}/about) — redirige vers app/blog/[slug]/about.
export default async function PublicAboutPageRedirect({ params }: { params: Params }) {
  const { locale, slug } = await params;
  redirect(`/blog/${slug}/about?lang=${locale}`);
}
