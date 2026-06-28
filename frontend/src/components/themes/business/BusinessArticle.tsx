import Link from 'next/link';
import type { ArticleProps } from '../ThemeRenderer';
import { SocialShare } from '../shared/SocialShare';
import { ArticleCard } from '../shared/ArticleCard';
import { BusinessHeader, BusinessFooter } from './BusinessHome';

export default function BusinessArticle({ blog, article, relatedArticles }: ArticleProps) {
  const url = `https://${blog.slug}.nexusblog.io/${article.slug}`;

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'var(--blog-font)' }}>
      <BusinessHeader blog={blog} categories={[]} />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-2 text-xs text-gray-400">
          <Link href="/" className="hover:text-[var(--blog-primary)]">Accueil</Link>
          <span>/</span>
          {article.category_name && (
            <>
              <Link href={`?category=${article.category_slug}`} className="hover:text-[var(--blog-primary)] capitalize">{article.category_name}</Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-600 truncate max-w-xs">{article.title}</span>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Article */}
          <article className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
              {article.category_name && (
                <Link
                  href={`?category=${article.category_slug}`}
                  className="inline-block text-[10px] font-bold uppercase tracking-widest text-white rounded px-2 py-0.5 mb-4"
                  style={{ background: 'var(--blog-primary)' }}
                >
                  {article.category_name}
                </Link>
              )}

              <h1 className="text-2xl md:text-3xl font-black leading-tight mb-4">{article.title}</h1>

              {/* Meta bar */}
              <div className="flex items-center flex-wrap gap-4 text-sm text-gray-400 pb-6 mb-6 border-b border-gray-100">
                {article.author_name && (
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'var(--blog-primary)' }}>
                      {article.author_name[0]}
                    </div>
                    <span className="font-medium text-gray-700">{article.author_name}</span>
                  </div>
                )}
                {article.published_at && (
                  <span>{new Date(article.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                )}
                {article.reading_time_minutes && <span>{article.reading_time_minutes} min de lecture</span>}
              </div>

              {article.cover_image_url && (
                <img src={article.cover_image_url} alt={article.title} className="w-full rounded-lg mb-8 aspect-[16/9] object-cover" />
              )}

              {article.excerpt && (
                <p className="text-base text-gray-600 font-medium mb-6 pb-6 border-b border-gray-100">{article.excerpt}</p>
              )}

              <div
                className="prose max-w-none prose-headings:font-black prose-a:text-[var(--blog-primary)] prose-a:no-underline hover:prose-a:underline"
                dangerouslySetInnerHTML={{ __html: article.content ?? '' }}
              />

              {article.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-100">
                  {article.tags.map((tag) => (
                    <span key={tag} className="text-xs px-3 py-1 rounded border border-gray-200 text-gray-500 bg-gray-50">#{tag}</span>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Partager</p>
                <SocialShare url={url} title={article.title} />
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            {relatedArticles.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 sticky top-4">
                <h3 className="font-black text-sm uppercase tracking-wider mb-4 text-[var(--blog-primary)]">Suggestions</h3>
                <div className="space-y-0">
                  {relatedArticles.map((a) => (
                    <ArticleCard key={a.id} article={a} blogSlug={blog.slug} lang={blog.language} variant="compact" />
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      <BusinessFooter blog={blog} />
    </div>
  );
}
