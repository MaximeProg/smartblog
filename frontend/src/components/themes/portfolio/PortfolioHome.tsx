import Link from 'next/link';
import type { HomeProps } from '../ThemeRenderer';

export function PortfolioHeader({ blog, categories, current }: {
  blog: { name: string; description?: string | null; logo_url?: string | null };
  categories: { slug: string; name: string }[];
  current?: string;
}) {
  return (
    <header className="py-16 text-center border-b border-gray-100">
      <Link href="/">
        {blog.logo_url
          ? <img src={blog.logo_url} alt={blog.name} className="h-14 w-auto mx-auto mb-4" />
          : <h1 className="text-5xl font-black tracking-tighter text-gray-900 mb-2 hover:text-[var(--blog-primary)] transition-colors">
              {blog.name}
            </h1>
        }
      </Link>
      {blog.description && <p className="text-gray-400 max-w-md mx-auto text-sm mt-2">{blog.description}</p>}

      {categories.length > 0 && (
        <nav className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-400">
          <Link href="/" className={`hover:text-[var(--blog-primary)] transition-colors font-medium ${!current ? 'text-[var(--blog-primary)]' : ''}`}>
            Tout
          </Link>
          {categories.slice(0, 6).map((c) => (
            <Link
              key={c.slug}
              href={`?category=${c.slug}`}
              className={`hover:text-[var(--blog-primary)] transition-colors ${current === c.slug ? 'text-[var(--blog-primary)] font-medium' : ''}`}
            >
              {c.name}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function PortfolioFooter({ blog }: { blog: { name: string } }) {
  return (
    <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-300 mt-20">
      <p>© {new Date().getFullYear()} {blog.name} · <a href="https://nexusblog.io" className="hover:text-[var(--blog-primary)]">NexusBlog</a></p>
    </footer>
  );
}

export default function PortfolioHome({ blog, articles, categories, currentCategory, getArticleHref }: HomeProps) {
  // Split into 2 columns for masonry effect
  const col1 = articles.filter((_, i) => i % 2 === 0);
  const col2 = articles.filter((_, i) => i % 2 !== 0);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: 'var(--blog-font)' }}>
      <PortfolioHeader blog={blog} categories={categories} current={currentCategory} />

      <main className="max-w-5xl mx-auto px-4 py-12">
        {currentCategory && (
          <div className="text-center mb-10">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 mb-2 inline-block">← Retour</Link>
            <h2 className="text-3xl font-black capitalize">{currentCategory}</h2>
          </div>
        )}

        {articles.length === 0 ? (
          <div className="text-center py-24 text-gray-300">
            <p className="text-6xl mb-4">✦</p>
            <p className="text-gray-400 font-medium">Aucun contenu pour l&apos;instant.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1 */}
            <div className="flex flex-col gap-4">
              {col1.map((a) => (
                <PortfolioCard key={a.id} article={a} getArticleHref={getArticleHref} />
              ))}
            </div>
            {/* Column 2 — offset visually */}
            <div className="flex flex-col gap-4 md:mt-12">
              {col2.map((a) => (
                <PortfolioCard key={a.id} article={a} getArticleHref={getArticleHref} />
              ))}
            </div>
          </div>
        )}
      </main>

      <PortfolioFooter blog={blog} />
    </div>
  );
}

function PortfolioCard({ article, getArticleHref }: { article: { title: string; slug: string; excerpt?: string | null; cover_image_url?: string | null; author_name?: string | null; published_at?: string | null; category_name?: string | null; tags: string[]; reading_time_minutes?: number | null }; getArticleHref?: (slug: string) => string }) {
  return (
    <Link href={getArticleHref ? getArticleHref(article.slug) : `./${article.slug}`} className="group block overflow-hidden rounded-2xl border border-gray-100 hover:border-[var(--blog-primary)] hover:shadow-lg transition-all duration-300">
      {/* Image — variable height for masonry effect */}
      {article.cover_image_url ? (
        <div className="overflow-hidden bg-gray-50">
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
            style={{ minHeight: '180px', maxHeight: '380px' }}
          />
        </div>
      ) : (
        <div
          className="flex items-center justify-center text-white font-black text-4xl"
          style={{
            background: `linear-gradient(135deg, var(--blog-primary), var(--blog-primary)99)`,
            height: `${180 + (article.title.length % 5) * 30}px`,
          }}
        >
          {article.title[0]}
        </div>
      )}

      {/* Content */}
      <div className="p-5 bg-white">
        {article.category_name && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--blog-primary)] block mb-1">
            {article.category_name}
          </span>
        )}
        <h3 className="font-black text-gray-900 leading-tight group-hover:text-[var(--blog-primary)] transition-colors">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{article.excerpt}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-300">
            {article.published_at
              ? new Date(article.published_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
              : ''}
          </span>
          <span
            className="text-xs font-semibold text-[var(--blog-primary)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
          >
            Lire →
          </span>
        </div>
      </div>
    </Link>
  );
}
