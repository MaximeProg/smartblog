import Link from 'next/link';
import type { HomeProps } from '../ThemeRenderer';
import { ArticleCard } from '../shared/ArticleCard';

export default function MinimalHome({ blog, articles, categories, currentCategory, getArticleHref }: HomeProps) {
  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: 'var(--blog-font)' }}>
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 z-20 bg-white/95 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-black text-lg tracking-tight hover:text-[var(--blog-primary)] transition-colors">
            {blog.name}
          </Link>
          <nav className="flex items-center gap-5 text-sm text-gray-500">
            {categories.slice(0, 4).map((c) => (
              <Link
                key={c.slug}
                href={`?category=${c.slug}`}
                className={`hover:text-gray-900 transition-colors ${currentCategory === c.slug ? 'text-gray-900 font-medium' : ''}`}
              >
                {c.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Blog description */}
        {!currentCategory && blog.description && (
          <p className="text-gray-400 text-sm mb-12 border-l-2 border-[var(--blog-primary)] pl-4">
            {blog.description}
          </p>
        )}

        {currentCategory && (
          <div className="mb-8">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-2 inline-block">← Retour</Link>
            <h1 className="text-2xl font-black capitalize">{currentCategory}</h1>
          </div>
        )}

        {/* Article list */}
        {articles.length === 0 ? (
          <div className="text-center py-20 text-gray-300">
            <p className="text-lg font-medium text-gray-400">Aucun article pour l&apos;instant.</p>
            <p className="text-sm mt-1">Revenez bientôt !</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {articles.map((article) => (
              <div key={article.id} className="py-8 first:pt-0">
                <ArticleCard article={article} blogSlug={blog.slug} lang={blog.language} variant="horizontal" getArticleHref={getArticleHref} />
              </div>
            ))}
          </div>
        )}
      </main>

      <MinimalFooter blog={blog} />
    </div>
  );
}

export function MinimalFooter({ blog }: { blog: { name: string; description?: string | null } }) {
  return (
    <footer className="border-t border-gray-100 mt-20">
      <div className="max-w-2xl mx-auto px-4 py-8 flex items-center justify-between text-xs text-gray-300">
        <span>© {new Date().getFullYear()} {blog.name}</span>
        <span>Propulsé par <a href="https://nexusblog.io" className="hover:text-[var(--blog-primary)]">NexusBlog</a></span>
      </div>
    </footer>
  );
}
