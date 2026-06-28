import Link from 'next/link';
import type { ArticleProps } from '../ThemeRenderer';
import { SocialShare } from '../shared/SocialShare';
import { PortfolioHeader, PortfolioFooter } from './PortfolioHome';

export default function PortfolioArticle({ blog, article, relatedArticles, getArticleHref }: ArticleProps) {
  const url = `https://${blog.slug}.nexusblog.io/${article.slug}`;

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: 'var(--blog-font)' }}>
      {/* Minimal header */}
      <header className="fixed top-0 left-0 right-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-black text-gray-900 hover:text-[var(--blog-primary)] transition-colors">
            {blog.name}
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-900 transition-colors">← Retour</Link>
        </div>
      </header>

      <div className="pt-14">
        {/* Full-width cover */}
        {article.cover_image_url && (
          <div className="h-[60vh] overflow-hidden">
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Article content */}
        <article className="max-w-2xl mx-auto px-4 py-16">
          {article.category_name && (
            <Link
              href={`?category=${article.category_slug}`}
              className="text-[10px] font-bold uppercase tracking-widest text-[var(--blog-primary)] block mb-4 hover:opacity-70"
            >
              {article.category_name}
            </Link>
          )}

          <h1 className="text-4xl md:text-5xl font-black leading-[1.1] tracking-tight mb-8">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-xl text-gray-400 leading-relaxed mb-10 font-light">{article.excerpt}</p>
          )}

          {/* Author */}
          <div className="flex items-center gap-4 py-6 mb-10 border-y border-gray-100">
            {article.author_name && (
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white font-black text-sm"
                  style={{ background: 'var(--blog-primary)' }}
                >
                  {article.author_name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold">{article.author_name}</p>
                  {article.published_at && (
                    <p className="text-xs text-gray-400">
                      {new Date(article.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {article.reading_time_minutes && ` · ${article.reading_time_minutes} min`}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="ml-auto">
              <SocialShare url={url} title={article.title} compact />
            </div>
          </div>

          <div
            className="prose prose-xl max-w-none
              prose-headings:font-black prose-headings:tracking-tight
              prose-a:text-[var(--blog-primary)] prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-xl
              prose-blockquote:border-l-[var(--blog-primary)] prose-blockquote:text-2xl prose-blockquote:font-light
              prose-p:leading-relaxed prose-p:text-gray-700"
            dangerouslySetInnerHTML={{ __html: article.content ?? '' }}
          />

          {/* Tags */}
          {article.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-gray-100">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1.5 rounded-full text-[var(--blog-primary)] border border-[var(--blog-primary)]/30 hover:bg-[var(--blog-primary)]/5 transition-colors cursor-default"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Share */}
          <div className="mt-10 pt-6 border-t border-gray-100 flex items-center gap-4 flex-wrap">
            <p className="text-xs text-gray-400 font-medium">Partager</p>
            <SocialShare url={url} title={article.title} />
          </div>
        </article>

        {/* Related — horizontal scroll */}
        {relatedArticles.length > 0 && (
          <section className="border-t border-gray-100 bg-gray-50 py-16">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-300 mb-8 text-center">
                Vous aimerez aussi
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map((a) => (
                  <Link
                    key={a.id}
                    href={getArticleHref ? getArticleHref(a.slug) : `./${a.slug}`}
                    className="group block overflow-hidden rounded-xl border border-gray-100 bg-white hover:shadow-md transition-shadow"
                  >
                    {a.cover_image_url && (
                      <div className="h-40 overflow-hidden">
                        <img src={a.cover_image_url} alt={a.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    )}
                    <div className="p-4">
                      {a.category_name && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--blog-primary)] block mb-1">{a.category_name}</span>
                      )}
                      <h3 className="font-bold leading-snug line-clamp-2 group-hover:text-[var(--blog-primary)] transition-colors">{a.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      <PortfolioFooter blog={blog} />
    </div>
  );
}
