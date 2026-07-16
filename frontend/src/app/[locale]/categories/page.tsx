import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Layers } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';
import { getPlatformCategories, getUiTranslations } from '@/lib/platform-api';

export const dynamic = 'force-dynamic';

interface CategoriesLabels {
  heroTitle: string;
  heroSubtitle: string;
  noCategoriesYet: string;
  noCategoriesDesc: string;
  articlesLabel: string;
  viewArticles: string;
}

const EN_LABELS: CategoriesLabels = {
  heroTitle: 'Categories',
  heroSubtitle: 'Explore content by topic and find what interests you.',
  noCategoriesYet: 'No categories yet',
  noCategoriesDesc: 'Categories will be available here soon.',
  articlesLabel: 'articles',
  viewArticles: 'View articles',
};

const FR_LABELS: CategoriesLabels = {
  heroTitle: 'Catégories',
  heroSubtitle: 'Explorez le contenu par thème et trouvez ce qui vous intéresse.',
  noCategoriesYet: 'Aucune catégorie pour le moment',
  noCategoriesDesc: 'Les catégories seront disponibles ici prochainement.',
  articlesLabel: 'articles',
  viewArticles: 'Voir les articles',
};

const GRADIENT_COLORS = [
  'from-blue-600/50 to-blue-900/70',
  'from-slate-700/50 to-slate-900/70',
  'from-purple-600/50 to-purple-900/70',
  'from-emerald-600/50 to-emerald-900/70',
  'from-orange-600/50 to-orange-900/70',
  'from-pink-600/50 to-pink-900/70',
  'from-cyan-600/50 to-cyan-900/70',
  'from-amber-600/50 to-amber-900/70',
];

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1558655146-364adaf1fcc9?auto=format&fit=crop&w=800&q=80';

export default async function CategoriesPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cmsLang?: string }>;
}) {
  const { locale } = await params;
  const { cmsLang } = await searchParams;
  const lang = (cmsLang || locale).toLowerCase();

  let l: CategoriesLabels = lang === 'fr' ? FR_LABELS : EN_LABELS;
  if (lang !== 'en' && lang !== 'fr') {
    const translated = await getUiTranslations('marketing', lang);
    if (translated?.categories) l = { ...EN_LABELS, ...(translated.categories as Partial<CategoriesLabels>) };
  }

  const categories = await getPlatformCategories();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} lang={lang} />

      <PageHero
        image="https://images.unsplash.com/photo-1558655146-364adaf1fcc9?auto=format&fit=crop&w=1920&q=85"
        title={l.heroTitle}
        subtitle={l.heroSubtitle}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        {categories.length === 0 ? (
          <div className="text-center py-32">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mb-6">
              <Layers className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">
              {l.noCategoriesYet}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {l.noCategoriesDesc}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {categories.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/${locale}/blog?category=${cat.slug}`}
                className="group relative rounded-2xl overflow-hidden aspect-[4/3] block"
              >
                <Image
                  src={cat.cover_image_url ?? DEFAULT_IMAGE}
                  alt={cat.name}
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${GRADIENT_COLORS[i % GRADIENT_COLORS.length]} opacity-80 group-hover:opacity-90 transition-opacity`} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-end">
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-1">
                    {cat.articles_count} {l.articlesLabel}
                  </span>
                  <h3 className="text-xl font-black text-white mb-2">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-sm text-white/70 leading-relaxed line-clamp-2 mb-4">
                      {cat.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
                    {l.viewArticles}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <PublicFooter locale={locale} lang={lang} />
    </div>
  );
}
