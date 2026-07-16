import { redirect } from 'next/navigation';

type Params = Promise<{ locale: string; slug: string }>;

// Legacy route (/{locale}/{slug}/podcast) — redirige vers app/blog/[slug]/podcast.
export default async function PodcastPageRedirect({ params }: { params: Params }) {
  const { locale, slug } = await params;
  redirect(`/blog/${slug}/podcast?lang=${locale}`);
}
