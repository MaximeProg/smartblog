import { Suspense } from 'react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';
import { getUiTranslations } from '@/lib/platform-api';
import { BlogClient, type BlogExploreLabels } from './BlogClient';

export const dynamic = 'force-dynamic';

const EN_LABELS: BlogExploreLabels = {
  heroTitle: 'Blogs',
  heroSubtitle: 'Discover all blogs created by our community.',
  searchPlaceholder: 'Search blogs...',
  allCategories: 'All categories',
  search: 'Search',
  noBlogsFound: 'No blogs found',
  resultsCountSingular: '{count} blog available',
  resultsCountPlural: '{count} blogs available',
  serviceUnavailable: 'Service temporarily unavailable',
  serviceUnavailableDesc: 'The server is waking up. Reload the page in a moment.',
  reload: 'Reload',
  noBlogsYet: 'No blogs yet',
  beFirst: 'Be the first to create one!',
  createMyBlog: 'Create my blog',
  noDescription: 'No description',
};

const FR_LABELS: BlogExploreLabels = {
  heroTitle: 'Blogs',
  heroSubtitle: 'Découvrez tous les blogs créés par notre communauté.',
  searchPlaceholder: 'Rechercher un blog...',
  allCategories: 'Toutes catégories',
  search: 'Rechercher',
  noBlogsFound: 'Aucun blog trouvé',
  resultsCountSingular: '{count} blog disponible',
  resultsCountPlural: '{count} blogs disponibles',
  serviceUnavailable: 'Service temporairement indisponible',
  serviceUnavailableDesc: 'Le serveur met quelques secondes à démarrer. Rechargez la page dans un instant.',
  reload: 'Recharger',
  noBlogsYet: 'Aucun blog pour le moment',
  beFirst: 'Soyez le premier à créer le vôtre !',
  createMyBlog: 'Créer mon blog',
  noDescription: 'Aucune description',
};

async function fetchBlogs(q?: string, category?: string): Promise<{ blogs: Blog[]; error: boolean }> {
  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
  const params = new URLSearchParams({ limit: '48' });
  if (q) params.set('q', q);
  if (category) params.set('category', category);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(`${API}/api/v1/public?${params}`, {
      signal: controller.signal,
    });
    if (!res.ok) return { blogs: [], error: true };
    const data = await res.json();
    return { blogs: Array.isArray(data) ? data : [], error: false };
  } catch {
    return { blogs: [], error: true };
  } finally {
    clearTimeout(timer);
  }
}

interface Blog {
  name: string; slug: string; description: string | null; category: string | null;
  logo_url: string | null; cover_image_url: string | null; language: string;
  theme: string; primary_color: string; articles_count: number;
  custom_domain?: string | null;
}

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string; cmsLang?: string }>;
}

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q, category, cmsLang } = await searchParams;
  const lang = (cmsLang || locale).toLowerCase();
  const { blogs, error } = await fetchBlogs(q, category);

  let labels: BlogExploreLabels = lang === 'fr' ? FR_LABELS : EN_LABELS;
  if (lang !== 'en' && lang !== 'fr') {
    const translated = await getUiTranslations('marketing', lang);
    if (translated?.blogExplore) labels = { ...EN_LABELS, ...(translated.blogExplore as Partial<BlogExploreLabels>) };
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} lang={lang} />

      <PageHero
        image="https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1920&q=85"
        title={labels.heroTitle}
        subtitle={labels.heroSubtitle}
      />

      <Suspense>
        <BlogClient blogs={blogs} locale={locale} q={q} category={category} apiError={error} labels={labels} />
      </Suspense>

      <PublicFooter locale={locale} lang={lang} />
    </div>
  );
}
