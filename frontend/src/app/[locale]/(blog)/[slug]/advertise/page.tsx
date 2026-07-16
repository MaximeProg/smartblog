import { redirect } from 'next/navigation';

type Params = Promise<{ locale: string; slug: string }>;

// Legacy route (/{locale}/{slug}/advertise) — redirige vers app/blog/[slug]/advertise.
export default async function AdvertisePageRedirect({ params }: { params: Params }) {
  const { locale, slug } = await params;
  redirect(`/blog/${slug}/advertise?lang=${locale}`);
}
