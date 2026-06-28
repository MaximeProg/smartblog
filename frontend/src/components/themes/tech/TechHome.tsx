import Link from 'next/link';
import type { HomeProps } from '../ThemeRenderer';

function formatDate(iso: string | null, lang = 'fr') {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function TechHeader({
  blog,
  categories,
  current,
}: {
  blog: { name: string; logo_url?: string | null; description?: string | null };
  categories: { slug: string; name: string }[];
  current?: string;
}) {
  return (
    <header className="bg-gray-950 border-b border-white/5 sticky top-0 z-30 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {blog.logo_url ? (
            <img src={blog.logo_url} alt={blog.name} className="h-8 w-auto" />
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md flex items-center justify-center font-black text-sm text-gray-950"
                style={{ background: 'var(--blog-primary)' }}>
                {blog.name[0]}
              </div>
              <span className="font-black text-white tracking-tight">{blog.name}</span>
            </div>
          )}
        </Link>

        <nav className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-none">
          <Link
            href="/"
            className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              !current ? 'text-gray-950 font-bold' : 'text-gray-400 hover:text-white'
            }`}
            style={!current ? { background: 'var(--blog-primary)' } : {}}
          >
            Tout
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`?category=${c.slug}`}
              className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                current === c.slug ? 'text-gray-950 font-bold' : 'text-gray-400 hover:text-white'
              }`}
              style={current === c.slug ? { background: 'var(--blog-primary)' } : {}}
            >
              {c.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function TechFooter({ blog }: { blog: { name: string; social_links?: Record<string, string> } }) {
  return (
    <footer className="bg-gray-950 border-t border-white/5 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <p className="font-black text-white mb-1">{blog.name}</p>
          <p className="text-xs text-gray-500">
            Propulsé par <a href="https://nexusblog.io" className="hover:text-[var(--blog-primary)] transition-colors">NexusBlog</a>
          </p>
        </div>
        <div className="flex items-center gap-4">
          {Object.entries(blog.social_links ?? {}).map(([net, url]) => (
            <a key={net} href={url} target="_blank" rel="noopener noreferrer"
              className="text-gray-500 hover:text-[var(--blog-primary)] text-sm transition-colors capitalize">
              {net}
            </a>
          ))}
          <span className="text-gray-700 text-xs">© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}

export default function TechHome({ blog, articles, categories, currentCategory, getArticleHref }: HomeProps) {
  const aHref = (slug: string) => getArticleHref ? getArticleHref(slug) : `./${slug}`;
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="min-h-screen bg-gray-950 text-white" style={{ fontFamily: 'var(--blog-font)' }}>
      <TechHeader blog={blog} categories={categories} current={currentCategory} />

      <main className="max-w-6xl mx-auto px-4 py-10">
        {articles.length === 0 ? (
          <div className="text-center py-32 text-gray-600">
            <div className="text-6xl font-black mb-4 opacity-20">{'</>'}</div>
            <p className="text-lg font-bold text-gray-400">Aucun article pour l&apos;instant</p>
            <p className="text-sm mt-2">Le premier article arrive bientôt.</p>
          </div>
        ) : (
          <>
            {/* Featured hero */}
            {!currentCategory && featured && (
              <Link href={aHref(featured.slug)} className="group block mb-12">
                <div className="relative rounded-2xl overflow-hidden bg-gray-900 border border-white/5">
                  {featured.cover_image_url ? (
                    <>
                      <img
                        src={featured.cover_image_url}
                        alt={featured.title}
                        className="w-full h-72 md:h-96 object-cover opacity-50 group-hover:opacity-60 transition-opacity duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-transparent" />
                    </>
                  ) : (
                    <div className="w-full h-72 md:h-96" style={{ background: `linear-gradient(135deg, #111827, var(--blog-primary)22)` }} />
                  )}
                  <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
                    <div className="max-w-xl">
                      {featured.category_name && (
                        <span className="inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4"
                          style={{ background: 'var(--blog-primary)', color: '#fff' }}>
                          {featured.category_name}
                        </span>
                      )}
                      <h2 className="text-2xl md:text-4xl font-black leading-tight mb-3 group-hover:text-[var(--blog-primary)] transition-colors">
                        {featured.title}
                      </h2>
                      {featured.excerpt && (
                        <p className="text-gray-400 text-sm md:text-base line-clamp-2 mb-4">{featured.excerpt}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {featured.author_name && <span className="text-gray-400 font-medium">{featured.author_name}</span>}
                        <span>{formatDate(featured.published_at, blog.language)}</span>
                        {featured.reading_time_minutes && <span>{featured.reading_time_minutes} min</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {currentCategory && (
              <div className="flex items-center gap-3 mb-8">
                <Link href="/" className="text-xs text-gray-500 hover:text-white transition-colors">← Retour</Link>
                <span className="text-gray-600">·</span>
                <span className="text-sm font-bold" style={{ color: 'var(--blog-primary)' }}>{currentCategory}</span>
              </div>
            )}

            {!currentCategory && rest.length > 0 && (
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Derniers articles</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(currentCategory ? articles : rest).map((a) => (
                <Link
                  key={a.id}
                  href={aHref(a.slug)}
                  className="group flex flex-col bg-gray-900 border border-white/5 rounded-xl overflow-hidden hover:border-[var(--blog-primary)]/40 hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative h-44 bg-gray-800 overflow-hidden shrink-0">
                    {a.cover_image_url ? (
                      <img
                        src={a.cover_image_url}
                        alt={a.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, #111827, var(--blog-primary)33)` }}>
                        <span className="text-4xl font-black opacity-20" style={{ color: 'var(--blog-primary)' }}>
                          {a.title[0]}
                        </span>
                      </div>
                    )}
                    {a.category_name && (
                      <span className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full"
                        style={{ background: 'var(--blog-primary)', color: '#fff' }}>
                        {a.category_name}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 p-5 flex flex-col">
                    <h3 className="font-bold text-white leading-snug line-clamp-2 group-hover:text-[var(--blog-primary)] transition-colors mb-2">
                      {a.title}
                    </h3>
                    {a.excerpt && (
                      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed flex-1">{a.excerpt}</p>
                    )}
                    {(a.tags?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {a.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-gray-500">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                      <div className="text-[11px] text-gray-600">
                        {a.author_name && <span className="text-gray-400">{a.author_name} · </span>}
                        {formatDate(a.published_at, blog.language)}
                      </div>
                      {a.reading_time_minutes && (
                        <span className="text-[11px] text-gray-600">{a.reading_time_minutes} min</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      <TechFooter blog={blog} />
    </div>
  );
}
