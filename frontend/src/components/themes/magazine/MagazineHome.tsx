import Link from 'next/link';
import type { HomeProps } from '../ThemeRenderer';
import { NewsletterForm } from './NewsletterForm';

function formatDate(iso: string | null, lang = 'fr') {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function MagazineHeader({
  blog,
  categories,
  current,
}: {
  blog: { name: string; logo_url?: string | null; description?: string | null };
  categories: { slug: string; name: string; articles_count: number }[];
  current?: string;
}) {
  return (
    <header className="bg-white border-b-2 border-[var(--blog-primary)]">
      {/* Top bar */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-9 flex items-center justify-between">
          <p className="text-[11px] text-gray-400 hidden sm:block">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <div className="flex items-center gap-4 ml-auto">
            <a href="#newsletter" className="text-[11px] font-semibold text-[var(--blog-primary)] hover:underline">
              Newsletter
            </a>
            <a href="#rss" className="text-[11px] text-gray-400 hover:text-gray-700">RSS</a>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div className="max-w-7xl mx-auto px-4 py-6 text-center">
        <Link href="/">
          {blog.logo_url ? (
            <img src={blog.logo_url} alt={blog.name} className="h-14 mx-auto object-contain" />
          ) : (
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-900 uppercase hover:text-[var(--blog-primary)] transition-colors">
              {blog.name}
            </h1>
          )}
        </Link>
        {blog.description && (
          <p className="text-xs text-gray-400 mt-1 tracking-widest uppercase">{blog.description}</p>
        )}
      </div>

      {/* Category nav */}
      <nav className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-none">
            <Link
              href="/"
              className={`shrink-0 px-4 py-3 text-sm font-bold uppercase tracking-wide transition-colors border-b-2 ${
                !current
                  ? 'border-[var(--blog-primary)] text-[var(--blog-primary)]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Accueil
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`?category=${c.slug}`}
                className={`shrink-0 px-4 py-3 text-sm font-bold uppercase tracking-wide transition-colors border-b-2 ${
                  current === c.slug
                    ? 'border-[var(--blog-primary)] text-[var(--blog-primary)]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}

export function MagazineFooter({ blog }: { blog: { name: string; social_links?: Record<string, string> } }) {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-white/10">
          <div>
            <h3 className="font-black text-xl mb-3">{blog.name}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Retrouvez nos derniers articles, analyses et reportages.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-3">Navigation</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/" className="hover:text-white transition-colors">Accueil</Link></li>
              <li><a href="#newsletter" className="hover:text-white transition-colors">Newsletter</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-3">Suivez-nous</h4>
            <div className="flex gap-3">
              {Object.entries(blog.social_links ?? {}).map(([net, url]) => (
                <a key={net} href={url} target="_blank" rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white capitalize text-sm transition-colors">
                  {net}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} {blog.name}. Tous droits réservés.</span>
          <span>Propulsé par <a href="https://nexusblog.io" className="text-[var(--blog-primary)] hover:underline">NexusBlog</a></span>
        </div>
      </div>
    </footer>
  );
}

export default function MagazineHome({ blog, articles, categories, currentCategory, getArticleHref }: HomeProps) {
  const aHref = (slug: string) => getArticleHref ? getArticleHref(slug) : `./${slug}`;
  const hero = articles[0];
  const topStories = articles.slice(1, 4);
  const rest = articles.slice(4);

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'var(--blog-font)' }}>
      <MagazineHeader blog={blog} categories={categories} current={currentCategory} />

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Category filter header */}
        {currentCategory && (
          <div className="mb-8">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-700 uppercase tracking-wider flex items-center gap-1 mb-2">
              ← Retour
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-6 w-1 rounded-full bg-[var(--blog-primary)]" />
              <h2 className="text-2xl font-black uppercase tracking-tight">{currentCategory}</h2>
            </div>
          </div>
        )}

        {articles.length === 0 ? (
          <div className="text-center py-32 text-gray-400">
            <p className="text-xl font-semibold">Aucun article pour l&apos;instant</p>
            <p className="text-sm mt-2">Revenez bientôt pour de nouveaux contenus.</p>
          </div>
        ) : (
          <>
            {/* ── HERO + TOP STORIES ── */}
            {!currentCategory && hero && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                {/* Main hero */}
                <Link href={aHref(hero.slug)} className="group lg:col-span-2 relative block bg-gray-900 rounded-2xl overflow-hidden min-h-[420px]">
                  {hero.cover_image_url ? (
                    <img
                      src={hero.cover_image_url}
                      alt={hero.title}
                      className="absolute inset-0 h-full w-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, var(--blog-primary), #000)` }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    {hero.category_name && (
                      <span className="inline-block bg-[var(--blog-primary)] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded mb-3">
                        {hero.category_name}
                      </span>
                    )}
                    <h2 className="text-2xl md:text-3xl font-black leading-tight text-white mb-3 group-hover:text-[var(--blog-primary)] transition-colors">
                      {hero.title}
                    </h2>
                    {hero.excerpt && (
                      <p className="text-white/70 text-sm line-clamp-2 mb-4">{hero.excerpt}</p>
                    )}
                    <div className="flex items-center gap-2 text-white/50 text-xs">
                      {hero.author_name && <span className="font-medium text-white/70">{hero.author_name}</span>}
                      {hero.author_name && <span>·</span>}
                      <span>{formatDate(hero.published_at, blog.language)}</span>
                      {hero.reading_time_minutes && <><span>·</span><span>{hero.reading_time_minutes} min</span></>}
                    </div>
                  </div>
                </Link>

                {/* Top stories column */}
                <div className="flex flex-col gap-0 bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-100">
                  <div className="px-5 py-3 border-b-2 border-[var(--blog-primary)]">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[var(--blog-primary)]">À la une</h3>
                  </div>
                  {topStories.map((a, i) => (
                    <Link key={a.id} href={aHref(a.slug)} className="group flex gap-3 p-4 hover:bg-gray-50 transition-colors">
                      <div className="text-3xl font-black text-gray-100 w-8 shrink-0 leading-none mt-1">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        {a.category_name && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--blog-primary)]">
                            {a.category_name}
                          </span>
                        )}
                        <h4 className="text-sm font-bold leading-snug line-clamp-3 group-hover:text-[var(--blog-primary)] transition-colors mt-0.5">
                          {a.title}
                        </h4>
                        <p className="text-[11px] text-gray-400 mt-1.5">
                          {formatDate(a.published_at, blog.language)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── SECTION LABEL ── */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-5 w-1 rounded-full bg-[var(--blog-primary)]" />
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">
                {currentCategory ? currentCategory : 'Derniers articles'}
              </h2>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* ── ARTICLE GRID + SIDEBAR ── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Articles */}
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {(currentCategory ? articles : rest).map((a) => (
                    <Link key={a.id} href={aHref(a.slug)} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                      <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
                        {a.cover_image_url ? (
                          <img
                            src={a.cover_image_url}
                            alt={a.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-3xl font-black text-gray-200"
                            style={{ background: `linear-gradient(135deg, var(--blog-primary)18, var(--blog-primary)08)` }}>
                            {a.title[0]}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        {a.category_name && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--blog-primary)] mb-1 block">
                            {a.category_name}
                          </span>
                        )}
                        <h3 className="font-bold leading-snug line-clamp-2 group-hover:text-[var(--blog-primary)] transition-colors mb-2">
                          {a.title}
                        </h3>
                        {a.excerpt && (
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{a.excerpt}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          {a.author_name && <span>{a.author_name}</span>}
                          {a.author_name && <span>·</span>}
                          <span>{formatDate(a.published_at, blog.language)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-1 space-y-6">
                {/* Categories */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b-2 border-[var(--blog-primary)]">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[var(--blog-primary)]">Catégories</h3>
                  </div>
                  <ul className="divide-y divide-gray-50">
                    {categories.map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={`?category=${c.slug}`}
                          className={`flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-gray-50 ${
                            currentCategory === c.slug ? 'text-[var(--blog-primary)] font-bold' : 'text-gray-700'
                          }`}
                        >
                          <span>{c.name}</span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                            {c.articles_count}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* About */}
                {blog.description && (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b-2 border-[var(--blog-primary)]">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[var(--blog-primary)]">À propos</h3>
                    </div>
                    <p className="px-4 py-4 text-sm text-gray-600 leading-relaxed">{blog.description}</p>
                  </div>
                )}

                {/* Newsletter CTA */}
                <NewsletterForm />
              </aside>
            </div>
          </>
        )}
      </main>

      <MagazineFooter blog={blog} />
    </div>
  );
}
