'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Globe, BookOpen, ExternalLink } from 'lucide-react';

interface Blog {
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  language: string;
  theme: string;
  primary_color: string;
  articles_count: number;
}

const BLOG_CATEGORIES = [
  'Technology', 'Business', 'Lifestyle', 'Health', 'Education',
  'Entertainment', 'Sports', 'Finance', 'Travel', 'Food',
  'Fashion', 'Science', 'Politics', 'Culture', 'Gaming',
];

const THEME_LABEL: Record<string, string> = {
  minimal: 'Minimal', magazine: 'Magazine', business: 'Business',
  news: 'News', tech: 'Tech', portfolio: 'Portfolio',
};

function BlogCard({ blog, locale }: { blog: Blog; locale: string }) {
  const initials = blog.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <a
      href={`/${locale}/${blog.slug}`}
      className="group flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-200"
    >
      {/* Cover */}
      <div className="relative h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {blog.cover_image_url ? (
          <img
            src={blog.cover_image_url}
            alt={blog.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-4xl font-black text-white/80"
            style={{ background: `linear-gradient(135deg, ${blog.primary_color}cc, ${blog.primary_color})` }}
          >
            {initials}
          </div>
        )}
        {/* Theme badge */}
        <span className="absolute top-2 right-2 text-[10px] font-bold bg-black/50 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
          {THEME_LABEL[blog.theme] ?? blog.theme}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 p-4">
        <div className="flex items-start gap-3 mb-2">
          {blog.logo_url ? (
            <img src={blog.logo_url} alt="" className="h-9 w-9 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700" />
          ) : (
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0"
              style={{ backgroundColor: blog.primary_color }}
            >
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {blog.name}
            </h3>
            <p className="text-[11px] text-slate-400 truncate">{blog.slug}.nexusblog.io</p>
          </div>
        </div>

        {blog.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {blog.description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {blog.category && (
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {blog.category}
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <BookOpen className="h-3 w-3" />
            {blog.articles_count} article{blog.articles_count !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Globe className="h-3 w-3" />
            {blog.language.toUpperCase()}
          </span>
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
      </div>
    </a>
  );
}

interface Props {
  blogs: Blog[];
  locale: string;
  q?: string;
  category?: string;
}

export function ExploreClient({ blogs, locale, q: initialQ, category: initialCat }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialQ ?? '');
  const [selectedCat, setSelectedCat] = useState(initialCat ?? '');
  const isFr = locale === 'fr';

  function applyFilters(q: string, cat: string) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (cat) params.set('category', cat);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
          {isFr ? 'Explorer les blogs' : 'Explore Blogs'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          {isFr
            ? 'Découvrez des milliers de blogs créés par notre communauté.'
            : 'Discover thousands of blogs created by our community.'}
        </p>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters(search, selectedCat)}
            placeholder={isFr ? 'Rechercher un blog...' : 'Search blogs...'}
            className="w-full pl-9 pr-4 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={selectedCat}
          onChange={(e) => { setSelectedCat(e.target.value); applyFilters(search, e.target.value); }}
          className="h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-52"
        >
          <option value="">{isFr ? 'Toutes catégories' : 'All categories'}</option>
          {BLOG_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          onClick={() => applyFilters(search, selectedCat)}
          disabled={isPending}
          className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {isFr ? 'Rechercher' : 'Search'}
        </button>
      </div>

      {/* Count */}
      <p className="text-sm text-slate-400 mb-6">
        {blogs.length === 0
          ? (isFr ? 'Aucun blog trouvé' : 'No blogs found')
          : isFr
          ? `${blogs.length} blog${blogs.length > 1 ? 's' : ''} trouvé${blogs.length > 1 ? 's' : ''}`
          : `${blogs.length} blog${blogs.length !== 1 ? 's' : ''} found`}
      </p>

      {/* Grid */}
      {blogs.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <Globe className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">{isFr ? 'Aucun blog pour le moment' : 'No blogs yet'}</p>
          <p className="text-sm mt-1">{isFr ? 'Soyez le premier à créer le vôtre !' : 'Be the first to create one!'}</p>
        </div>
      ) : (
        <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
          {blogs.map((blog) => (
            <BlogCard key={blog.slug} blog={blog} locale={locale} />
          ))}
        </div>
      )}
    </main>
  );
}
