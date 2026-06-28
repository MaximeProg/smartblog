import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function ExplorePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.q) qs.set('q', sp.q);
  if (sp.category) qs.set('category', sp.category);
  const query = qs.toString();
  redirect(`/${locale}/blog${query ? `?${query}` : ''}`);
}
