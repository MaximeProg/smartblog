import Link from 'next/link';
import type { HomeProps } from '../ThemeRenderer';
import { ArticleCard, HeroCard } from '../shared/ArticleCard';

export function NewsHeader({ blog, categories, current }: {
  blog: { name: string; logo_url?: string | null };
  categories: { slug: string; name: string }[];
  current?: string;
}) {
  return (
    <header>
      {/* Breaking news ticker */}
      <div className="bg-red-600 text-white text-xs py-1 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <span className="font-black uppercase tracking-wider bg-white text-red-600 px-2 py-0.5 rounded text-[10px] shrink-0">
            BREAKING
          </span>
          <span className="truncate opacity-80">Bienvenue sur {blog.name} · Retrouvez toute l&apos;actualité en temps réel</span>
        </div>
      </div>

      {/* Logo strip */}
      <div className="bg-gray-900 text-white py-4 border-b-4" style={{ borderColor: 'var(--blog-primary)' }}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="text-3xl font-black tracking-tight uppercase hover:text-gray-300 transition-colors">
            {blog.name}
          </Link>
          <div className="text-xs text-gray-400">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Category nav */}
      <nav className="bg-gray-800 text-white text-sm overflow-x-auto">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-0">
          <Link href="/" className={`px-4 py-3 font-bold hover:bg-[var(--blog-primary)] transition-colors ${!current ? 'bg-[var(--blog-primary)]' : ''}`}>
            ACCUEIL
          </Link>
          {categories.slice(0, 7).map((c) => (
            <Link
              key={c.slug}
              href={`?category=${c.slug}`}
              className={`px-4 py-3 font-bold uppercase hover:bg-[var(--blog-primary)] transition-colors whitespace-nowrap ${current === c.slug ? 'bg-[var(--blog-primary)]' : ''}`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

export function NewsFooter({ blog }: { blog: { name: string } }) {
  return (
    <footer className="bg-gray-900 text-white mt-8">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-2xl font-black uppercase mb-4">{blog.name}</div>
        <div className="border-t border-gray-700 pt-4 flex items-center justify-between text-xs text-gray-500">
          <span>© {new Date().getFullYear()} {blog.name}. Tous droits réservés.</span>
          <span>Propulsé par <a href="https://nexusblog.io" className="underline hover:text-gray-300">NexusBlog</a></span>
        </div>
      </div>
    </footer>
  );
}

export default function NewsHome({ blog, articles, categories, currentCategory }: HomeProps) {
  const hero = articles[0];
  const col1 = articles.slice(1, 4);
  const col2 = articles.slice(4, 7);
  const col3 = articles.slice(7, 10);
  const overflow = articles.slice(10);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900" style={{ fontFamily: 'var(--blog-font)' }}>
      <NewsHeader blog={blog} categories={categories} current={currentCategory} />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {currentCategory && (
          <div className="mb-6 pb-3 border-b-4 border-gray-900">
            <Link href="/" className="text-xs text-gray-500 hover:text-gray-900 mb-1 inline-block">← RETOUR</Link>
            <h1 className="text-2xl font-black uppercase tracking-tight">{currentCategory}</h1>
          </div>
        )}

        {articles.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="font-bold uppercase">Aucun article disponible</p>
          </div>
        ) : currentCategory ? (
          /* Category view — dense list */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
            {articles.map((a) => (
              <div key={a.id} className="bg-white border border-gray-200 p-4">
                <ArticleCard article={a} blogSlug={blog.slug} lang={blog.language} variant="vertical" />
              </div>
            ))}
          </div>
        ) : (
          /* Home — newspaper grid */
          <>
            {/* Hero + 2 columns */}
            {hero && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-1 mb-1">
                <div className="lg:col-span-2">
                  <HeroCard article={hero} blogSlug={blog.slug} lang={blog.language} />
                </div>
                <div className="bg-white border border-gray-200 p-4 space-y-0">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-2 mb-2">
                    À ne pas manquer
                  </h3>
                  {col1.map((a) => (
                    <ArticleCard key={a.id} article={a} blogSlug={blog.slug} lang={blog.language} variant="compact" />
                  ))}
                </div>
              </div>
            )}

            {/* Separator */}
            <div className="border-t-4 border-gray-900 my-4" />

            {/* 3-column dense grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
              {[col2, col3, overflow.slice(0, 3)].map((col, ci) => (
                <div key={ci} className="bg-white border border-gray-200 p-4 space-y-0">
                  {col.map((a) => (
                    <ArticleCard key={a.id} article={a} blogSlug={blog.slug} lang={blog.language} variant="compact" />
                  ))}
                </div>
              ))}
            </div>

            {/* Bottom overflow — horizontal cards */}
            {overflow.slice(3).length > 0 && (
              <>
                <div className="border-t-4 border-gray-900 my-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {overflow.slice(3).map((a) => (
                    <div key={a.id} className="bg-white border border-gray-200 p-4">
                      <ArticleCard article={a} blogSlug={blog.slug} lang={blog.language} variant="horizontal" />
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>

      <NewsFooter blog={blog} />
    </div>
  );
}
