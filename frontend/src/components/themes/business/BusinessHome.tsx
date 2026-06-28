import Link from 'next/link';
import type { HomeProps } from '../ThemeRenderer';
import { ArticleCard } from '../shared/ArticleCard';

export function BusinessHeader({ blog, categories, current }: {
  blog: { name: string; logo_url?: string | null; description?: string | null };
  categories: { slug: string; name: string }[];
  current?: string;
}) {
  return (
    <>
      {/* Top bar */}
      <div style={{ background: 'var(--blog-primary)' }} className="text-white py-2">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between text-xs">
          <span className="opacity-70">{blog.description}</span>
          <span className="opacity-70">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>
      {/* Main header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            {blog.logo_url
              ? <img src={blog.logo_url} alt={blog.name} className="h-10 w-auto" />
              : (
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-sm font-black" style={{ background: 'var(--blog-primary)' }}>
                    {blog.name[0]}
                  </div>
                  <span className="text-xl font-black text-gray-900 tracking-tight">{blog.name}</span>
                </div>
              )
            }
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-[var(--blog-primary)] transition-colors">Accueil</Link>
            {categories.slice(0, 5).map((c) => (
              <Link
                key={c.slug}
                href={`?category=${c.slug}`}
                className={`hover:text-[var(--blog-primary)] transition-colors ${current === c.slug ? 'text-[var(--blog-primary)] font-bold' : ''}`}
              >
                {c.name}
              </Link>
            ))}
          </nav>
        </div>
        {/* Category nav underline */}
        <div className="border-t border-gray-100" style={{ borderTopColor: 'var(--blog-primary)', borderTopWidth: 3 }} />
      </header>
    </>
  );
}

export function BusinessFooter({ blog }: { blog: { name: string } }) {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="font-black text-xl mb-2">{blog.name}</div>
          <p className="text-gray-400 text-sm">Votre source d&apos;information professionnelle.</p>
        </div>
        <div>
          <div className="font-bold text-sm uppercase tracking-wider mb-3 text-gray-400">Navigation</div>
          <ul className="space-y-1 text-sm text-gray-400">
            <li><Link href="/" className="hover:text-white transition-colors">Accueil</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-bold text-sm uppercase tracking-wider mb-3 text-gray-400">Info</div>
          <p className="text-xs text-gray-500">Propulsé par <a href="https://nexusblog.io" className="text-gray-400 hover:text-white underline">NexusBlog</a></p>
        </div>
      </div>
      <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} {blog.name}
      </div>
    </footer>
  );
}

export default function BusinessHome({ blog, articles, categories, currentCategory }: HomeProps) {
  const featured = articles.slice(0, 3);
  const rest = articles.slice(3);

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'var(--blog-font)' }}>
      <BusinessHeader blog={blog} categories={categories} current={currentCategory} />

      <main className="max-w-6xl mx-auto px-4 py-10">
        {currentCategory && (
          <div className="mb-8">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-2 inline-block">← Retour à l&apos;accueil</Link>
            <h1 className="text-3xl font-black capitalize border-l-4 pl-4" style={{ borderColor: 'var(--blog-primary)' }}>
              {currentCategory}
            </h1>
          </div>
        )}

        {articles.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">Aucun article disponible.</p>
          </div>
        ) : (
          <>
            {/* Featured 3-column */}
            {!currentCategory && featured.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-5 w-1" style={{ background: 'var(--blog-primary)' }} />
                  <h2 className="font-black uppercase tracking-wider text-sm text-gray-700">Articles en vedette</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {featured.map((a, i) => (
                    <div
                      key={a.id}
                      className={`bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow ${i === 0 ? 'md:col-span-1' : ''}`}
                    >
                      {a.cover_image_url && (
                        <div className="h-48 overflow-hidden">
                          <img src={a.cover_image_url} alt={a.title} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="p-5">
                        <ArticleCard article={a} blogSlug={blog.slug} lang={blog.language} variant="vertical" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Rest as list */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <div className="h-5 w-1" style={{ background: 'var(--blog-primary)' }} />
                <h2 className="font-black uppercase tracking-wider text-sm text-gray-700">
                  {currentCategory ? 'Articles' : 'Dernières publications'}
                </h2>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 divide-y divide-gray-100">
                {(currentCategory ? articles : rest).map((a) => (
                  <div key={a.id} className="p-5 hover:bg-gray-50 transition-colors">
                    <ArticleCard article={a} blogSlug={blog.slug} lang={blog.language} variant="horizontal" />
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <BusinessFooter blog={blog} />
    </div>
  );
}
