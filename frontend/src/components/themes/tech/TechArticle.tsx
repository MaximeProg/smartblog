import Link from 'next/link';
import type { ArticleProps } from '../ThemeRenderer';
import { TechHeader, TechFooter } from './TechHome';

function formatDate(iso: string | null, lang = 'fr') {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function TechArticle({ blog, article, relatedArticles, getArticleHref }: ArticleProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-white" style={{ fontFamily: 'var(--blog-font)' }}>
      <TechHeader blog={blog} categories={[]} />

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

          {/* Main article */}
          <article className="lg:col-span-3">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
              <Link href="/" className="hover:text-[var(--blog-primary)] transition-colors">Accueil</Link>
              {article.category_name && (
                <>
                  <span>/</span>
                  <Link href={`?category=${article.category_slug}`} className="hover:text-[var(--blog-primary)] transition-colors">
                    {article.category_name}
                  </Link>
                </>
              )}
            </div>

            {/* Article header */}
            <div className="mb-8">
              {article.category_name && (
                <span className="inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4"
                  style={{ background: 'var(--blog-primary)', color: '#fff' }}>
                  {article.category_name}
                </span>
              )}
              <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">{article.title}</h1>
              {article.excerpt && (
                <p className="text-gray-400 text-lg leading-relaxed mb-6">{article.excerpt}</p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 py-4 border-y border-white/5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center font-black text-gray-950 text-sm"
                    style={{ background: 'var(--blog-primary)' }}>
                    {(article.author_name ?? 'A')[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{article.author_name ?? 'Auteur'}</p>
                    <p className="text-xs text-gray-500">{formatDate(article.published_at, blog.language)}</p>
                  </div>
                </div>
                {article.reading_time_minutes && (
                  <span className="ml-auto text-xs text-gray-500 flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth="2" />
                      <path strokeLinecap="round" strokeWidth="2" d="M12 6v6l4 2" />
                    </svg>
                    {article.reading_time_minutes} min de lecture
                  </span>
                )}
              </div>
            </div>

            {/* Cover */}
            {article.cover_image_url && (
              <div className="rounded-2xl overflow-hidden mb-10 aspect-[16/9] bg-gray-900">
                <img
                  src={article.cover_image_url}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content — dark prose */}
            <div
              className="prose prose-invert prose-lg max-w-none
                prose-headings:font-black
                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
                prose-a:text-[var(--blog-primary)] prose-a:no-underline hover:prose-a:underline
                prose-code:text-[var(--blog-primary)] prose-code:bg-gray-900 prose-code:border prose-code:border-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm
                prose-pre:bg-gray-900 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl
                prose-blockquote:border-[var(--blog-primary)] prose-blockquote:bg-gray-900 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-gray-300
                prose-img:rounded-xl prose-img:border prose-img:border-white/10
                prose-strong:text-white
                prose-p:text-gray-300 prose-p:leading-8
                prose-li:text-gray-300"
              dangerouslySetInnerHTML={{ __html: article.content ?? '<p>Contenu non disponible.</p>' }}
            />

            {/* Tags */}
            {(article.tags?.length ?? 0) > 0 && (
              <div className="mt-10 pt-8 border-t border-white/5">
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span key={tag}
                      className="text-sm px-3 py-1 rounded-full border border-white/10 text-gray-400 hover:border-[var(--blog-primary)] hover:text-[var(--blog-primary)] transition-colors cursor-pointer">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Related */}
            {relatedArticles.length > 0 && (
              <div className="mt-12 pt-10 border-t border-white/5">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6">Articles similaires</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedArticles.map((a) => (
                    <Link key={a.id} href={getArticleHref ? getArticleHref(a.slug) : `./${a.slug}`}
                      className="group flex gap-4 p-4 rounded-xl bg-gray-900 border border-white/5 hover:border-[var(--blog-primary)]/40 transition-all">
                      {a.cover_image_url && (
                        <img src={a.cover_image_url} alt={a.title} className="h-16 w-16 rounded-lg object-cover shrink-0 opacity-80" />
                      )}
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold line-clamp-2 group-hover:text-[var(--blog-primary)] transition-colors">{a.title}</h4>
                        <p className="text-[11px] text-gray-500 mt-1">{formatDate(a.published_at, blog.language)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-5">
            <div className="sticky top-20">
              {/* Author */}
              <div className="bg-gray-900 border border-white/5 rounded-xl p-5 mb-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Auteur</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center font-black text-gray-950"
                    style={{ background: 'var(--blog-primary)' }}>
                    {(article.author_name ?? 'A')[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{article.author_name ?? 'Auteur'}</p>
                    <p className="text-[11px] text-gray-500">Contributeur</p>
                  </div>
                </div>
              </div>

              {/* Share */}
              <div className="bg-gray-900 border border-white/5 rounded-xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Partager</p>
                <div className="flex flex-col gap-2.5">
                  <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-[var(--blog-primary)] transition-colors">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    X / Twitter
                  </a>
                  <a href={`https://www.linkedin.com/sharing/share-offsite/?url=https://${blog.slug}.nexusblog.io/${article.slug}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-[var(--blog-primary)] transition-colors">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <TechFooter blog={blog} />
    </div>
  );
}
