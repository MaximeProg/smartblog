import { Suspense } from 'react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';
import { BlogClient } from './BlogClient';

export const dynamic = 'force-dynamic';

async function fetchBlogs(q?: string, category?: string) {
  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
  const params = new URLSearchParams({ limit: '48' });
  if (q) params.set('q', q);
  if (category) params.set('category', category);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`${API}/api/v1/public?${params}`, {
      signal: controller.signal,
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q, category } = await searchParams;
  const isFr = locale === 'fr';
  const blogs = await fetchBlogs(q, category);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} />

      <PageHero
        image="https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1920&q=85"
        title={isFr ? 'Blogs' : 'Blogs'}
        subtitle={isFr
          ? 'Découvrez tous les blogs créés par notre communauté.'
          : 'Discover all blogs created by our community.'}
      />

      <Suspense>
        <BlogClient blogs={blogs} locale={locale} q={q} category={category} />
      </Suspense>

      <PublicFooter locale={locale} />
    </div>
  );
}
