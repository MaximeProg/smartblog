import Link from 'next/link';
import type { ArticleProps } from '../ThemeRenderer';
import { SocialShare } from '../shared/SocialShare';
import { ArticleCard } from '../shared/ArticleCard';
import { MinimalFooter } from './MinimalHome';

export default function MinimalArticle({ blog, article, relatedArticles, getArticleHref }: ArticleProps) {
  const url = `https://${blog.slug}.nexusblog.io/${article.slug}`;

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: 'var(--blog-font)' }}>
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 z-20 bg-white/95 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="font-black text-base tracking-tight hover:text-[var(--blog-primary)] transition-colors">
            {blog.name}
          </Link>
          <span className="text-gray-200">·</span>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">Accueil</Link>
        </div>
      </header>

      <article className="max-w-2xl mx-auto px-4 py-16">
        {/* Category */}
        {article.category_name && (
          <Link
            href={`?category=${article.category_slug}`}
            className="inline-block text-[10px] font-bold uppercase tracking-widest text-[var(--blog-primary)] mb-4 hover:opacity-70"
          >
            {article.category_name}
          </Link>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-black leading-tight mb-6">{article.title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-3 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-100">
          {article.author_name && (
            <span className="font-medium text-gray-700">{article.author_name}</span>
          )}
          {article.author_name && <span>·</span>}
          {article.published_at && (
            <span>
              {new Date(article.published_at).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
          )}
          {article.reading_time_minutes && (
            <><span>·</span><span>{article.reading_time_minutes} min de lecture</span></>
          )}
        </div>

        {/* Cover */}
        {article.cover_image_url && (
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="w-full rounded-xl mb-10 aspect-[16/9] object-cover"
          />
        )}

        {/* Content */}
        <div
          className="prose prose-lg max-w-none prose-headings:font-black prose-a:text-[var(--blog-primary)] prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: article.content ?? '<p>Contenu non disponible.</p>' }}
        />

        {/* Tags */}
        {article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-gray-100">
            {article.tags.map((tag) => (
              <span key={tag} className="text-xs px-3 py-1 bg-gray-50 rounded-full text-gray-500 border border-gray-200">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Share */}
        <div className="mt-8 pt-8 border-t border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">Partager</p>
          <SocialShare url={url} title={article.title} />
        </div>
      </article>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section className="max-w-2xl mx-auto px-4 py-12 border-t border-gray-100">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">À lire aussi</h2>
          <div className="divide-y divide-gray-100">
            {relatedArticles.map((a) => (
              <div key={a.id} className="py-6 first:pt-0">
                <ArticleCard article={a} blogSlug={blog.slug} lang={blog.language} variant="horizontal" getArticleHref={getArticleHref} />
              </div>
            ))}
          </div>
        </section>
      )}

      <MinimalFooter blog={blog} />
    </div>
  );
}
