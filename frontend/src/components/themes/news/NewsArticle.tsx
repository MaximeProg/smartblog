import Link from 'next/link';
import type { ArticleProps } from '../ThemeRenderer';
import { SocialShare } from '../shared/SocialShare';
import { ArticleCard } from '../shared/ArticleCard';
import { NewsHeader, NewsFooter } from './NewsHome';

export default function NewsArticle({ blog, article, relatedArticles }: ArticleProps) {
  const url = `https://${blog.slug}.nexusblog.io/${article.slug}`;

  return (
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: 'var(--blog-font)' }}>
      <NewsHeader blog={blog} categories={[]} />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Article */}
          <article className="lg:col-span-2 bg-white border border-gray-200 p-6 md:p-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-4">
              <Link href="/" className="hover:text-gray-700">ACCUEIL</Link>
              {article.category_name && (
                <>
                  <span>/</span>
                  <Link href={`?category=${article.category_slug}`} className="hover:text-gray-700">{article.category_name.toUpperCase()}</Link>
                </>
              )}
            </div>

            <h1 className="text-2xl md:text-4xl font-black leading-tight mb-4 tracking-tight">{article.title}</h1>

            {article.excerpt && (
              <p className="text-lg text-gray-600 font-medium mb-4 pb-4 border-b border-gray-200">{article.excerpt}</p>
            )}

            {/* Byline */}
            <div className="flex items-center justify-between flex-wrap gap-2 mb-6 pb-4 border-b border-gray-200 text-xs text-gray-500">
              <div>
                {article.author_name && <span className="font-bold text-gray-800 uppercase mr-2">{article.author_name}</span>}
                {article.published_at && (
                  <span>{new Date(article.published_at).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {article.reading_time_minutes && <span className="bg-gray-100 px-2 py-0.5 rounded">{article.reading_time_minutes} min</span>}
                <SocialShare url={url} title={article.title} compact />
              </div>
            </div>

            {article.cover_image_url && (
              <figure className="mb-6">
                <img src={article.cover_image_url} alt={article.title} className="w-full aspect-[16/9] object-cover" />
                <figcaption className="text-xs text-gray-400 mt-1 italic">{article.title}</figcaption>
              </figure>
            )}

            <div
              className="prose max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-[var(--blog-primary)]"
              dangerouslySetInnerHTML={{ __html: article.content ?? '' }}
            />

            {article.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-4 border-t border-gray-200">
                {article.tags.map((tag) => (
                  <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Partager</p>
              <SocialShare url={url} title={article.title} />
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            {relatedArticles.length > 0 && (
              <div className="bg-white border border-gray-200 p-5 sticky top-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-2 mb-3">
                  Sur le même sujet
                </h3>
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

      <NewsFooter blog={blog} />
    </div>
  );
}
