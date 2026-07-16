import { redirect } from 'next/navigation';

type Params = Promise<{ locale: string; slug: string }>;

// Legacy route (/{locale}/{slug}/contact) — redirige vers app/blog/[slug]/contact.
export default async function PublicContactPageRedirect({ params }: { params: Params }) {
  const { locale, slug } = await params;
  redirect(`/blog/${slug}/contact?lang=${locale}`);
}
