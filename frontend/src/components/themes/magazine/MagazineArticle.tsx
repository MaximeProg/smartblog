import Link from 'next/link';
import type { ArticleProps } from '../ThemeRenderer';
import { MagazineHeader, MagazineFooter } from './MagazineHome';

function formatDate(iso: string | null, lang = 'fr') {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function MagazineArticle({ blog, article, relatedArticles, getArticleHref }: ArticleProps) {
  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'var(--blog-font)' }}>
      <MagazineHeader blog={blog} categories={[]} />

      {/* Cover hero */}
      {article.cover_image_url && (
        <div className="w-full h-[40vh] md:h-[52vh] relative bg-gray-900 overflow-hidden">
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="w-full h-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 py-10">

          {/* Article main */}
          <article className="lg:col-span-3">
            {/* Header card — overlaps cover if present */}
            <div className={`bg-white rounded-2xl shadow-sm p-8 mb-8 ${article.cover_image_url ? '-mt-24 relative z-10' : ''}`}>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                <Link href="/" className="hover:text-[var(--blog-primary)] transition-colors">Accueil</Link>
                {article.category_name && (
                  <>
                    <span>›</span>
                    <Link href={`?category=${article.category_slug}`} className="hover:text-[var(--blog-primary)] transition-colors capitalize">
                      {article.category_name}
                    </Link>
                  </>
                )}
              </div>

              {article.category_name && (
                <span className="inline-block text-[10px] font-black uppercase tracking-widest text-white px-3 py-1 rounded mb-4"
                  style={{ background: 'var(--blog-primary)' }}>
                  {article.category_name}
                </span>
              )}

              <h1 className="text-2xl md:text-4xl font-black leading-tight mb-4 text-gray-900">
                {article.title}
              </h1>

              {article.excerpt && (
                <p className="text-lg text-gray-500 leading-relaxed mb-6 border-l-4 border-[var(--blog-primary)] pl-4">
                  {article.excerpt}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                    style={{ background: 'var(--blog-primary)' }}>
                    {(article.author_name ?? 'A')[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{article.author_name ?? 'Rédaction'}</p>
                    <p className="text-xs text-gray-400">{formatDate(article.published_at, blog.language)}</p>
                  </div>
                </div>
                {article.reading_time_minutes && (
                  <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth="2" />
                      <path strokeLinecap="round" strokeWidth="2" d="M12 6v6l4 2" />
                    </svg>
                    {article.reading_time_minutes} min de lecture
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
              <div
                className="prose prose-lg max-w-none
                  prose-headings:font-black prose-headings:text-gray-900
                  prose-h2:text-2xl prose-h2:border-l-4 prose-h2:border-[var(--blog-primary)] prose-h2:pl-3
                  prose-a:text-[var(--blog-primary)] prose-a:no-underline hover:prose-a:underline
                  prose-blockquote:border-[var(--blog-primary)] prose-blockquote:bg-gray-50 prose-blockquote:rounded-r-xl prose-blockquote:not-italic
                  prose-img:rounded-xl prose-img:shadow-md
                  prose-code:text-[var(--blog-primary)] prose-code:bg-gray-50 prose-code:px-1 prose-code:rounded"
                dangerouslySetInnerHTML={{ __html: article.content ?? '<p>Contenu non disponible.</p>' }}
              />
            </div>

            {/* Tags */}
            {(article.tags?.length ?? 0) > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span key={tag} className="text-sm px-3 py-1 border border-gray-200 rounded-full text-gray-600 hover:border-[var(--blog-primary)] hover:text-[var(--blog-primary)] transition-colors cursor-pointer">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Related articles */}
            {relatedArticles.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-4 w-1 rounded-full bg-[var(--blog-primary)]" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">À lire aussi</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {relatedArticles.map((a) => (
                    <Link key={a.id} href={getArticleHref ? getArticleHref(a.slug) : `./${a.slug}`} className="group">
                      <div className="aspect-[16/9] rounded-xl overflow-hidden bg-gray-100 mb-3">
                        {a.cover_image_url ? (
                          <img src={a.cover_image_url} alt={a.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="h-full w-full" style={{ background: 'var(--blog-primary)' }} />
                        )}
                      </div>
                      {a.category_name && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-[var(--blog-primary)]">{a.category_name}</span>
                      )}
                      <h4 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-[var(--blog-primary)] transition-colors mt-0.5">
                        {a.title}
                      </h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--blog-primary)] mb-4">Auteur</h3>
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-black shrink-0"
                  style={{ background: 'var(--blog-primary)' }}>
                  {(article.author_name ?? 'A')[0]}
                </div>
                <div>
                  <p className="font-bold text-sm">{article.author_name ?? 'Rédaction'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Contributeur</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--blog-primary)] mb-4">Partager</h3>
              <div className="flex flex-col gap-3">
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-[var(--blog-primary)] font-medium transition-colors">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  X (Twitter)
                </a>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=https://${blog.slug}.nexusblog.io/${article.slug}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-[var(--blog-primary)] font-medium transition-colors">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                  LinkedIn
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <MagazineFooter blog={blog} />
    </div>
  );
}
