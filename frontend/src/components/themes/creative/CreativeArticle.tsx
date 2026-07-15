'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback, useMemo, type CSSProperties } from 'react';
import { useParams } from 'next/navigation';
import type { ArticleProps } from '../ThemeRenderer';
import { CreativeHeader, CreativeFooter } from './CreativeShared';
import { renderContent } from '../shared/renderContent';
import { ArticleMediaBlock } from '../shared/ArticleMediaBlock';
import { PublicCommentsSection } from '../shared/PublicCommentsSection';
import { AdRotator } from '../shared/AdRotator';
import { ShareButtons, FloatingShareBar } from '../shared/ShareButtons';
import { useBookmark } from '@/hooks/useBookmark';

const GRADIENTS = [
  'from-violet-900 to-indigo-900',
  'from-rose-900 to-pink-800',
  'from-blue-900 to-cyan-800',
  'from-emerald-900 to-teal-800',
  'from-amber-900 to-orange-800',
  'from-zinc-800 to-zinc-700',
];

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function initials(name: string | null) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function CreativeArticle({
  blog,
  article,
  relatedArticles,
  categories = [],
  getArticleHref,
  basePath: baseProp,
  previewSlug,
}: ArticleProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const primaryColor = blog.primary_color || '#7c3aed';

  const articleCfg = blog.template_config?.article as Record<string, any> | undefined;
  const showRelated = articleCfg?.relatedArticles?.enabled !== false;
  const relatedTitle = articleCfg?.relatedArticles?.sectionTitle || 'More';
  const showComments = articleCfg?.comments?.enabled !== false;

  const basePath = baseProp !== undefined
    ? baseProp
    : (previewSlug ? `/en/template?preview=${previewSlug}` : `/${locale}/${blog.slug}`);

  const aHref = useCallback(
    (s: string) => {
      if (getArticleHref) return getArticleHref(s);
      if (previewSlug) return `/en/template/${s}?preview=${previewSlug}`;
      return `${basePath}/${s}`;
    },
    [getArticleHref, previewSlug, basePath]
  );

  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likes_count ?? 0);
  const { bookmarked, toggle: toggleBookmark } = useBookmark(article.slug, article.title, blog.slug);
  const htmlContent = useMemo(() => renderContent(article.content), [article.content]);

  const articleUrl = typeof window !== 'undefined'
    ? window.location.href
    : `https://${blog.slug}.smarterbloggers.com/${article.slug}`;

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    setLikeCount(n => n + 1);
    try {
      await fetch(`/api/public-proxy/${blog.slug}/articles/${article.slug}/like`, { method: 'POST' });
    } catch {}
  };

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <div
        className="fixed top-0 left-0 z-[100] h-[3px] transition-all duration-150"
        style={{ width: `${progress}%`, backgroundColor: primaryColor }}
      />

      <CreativeHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />

      {/* Hero: video type → show video below dark header; image → classic hero */}
      {article.article_type === 'video' && article.video_url ? (
        <>
          <div className="bg-zinc-950 py-14">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {article.category_name && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full text-zinc-950" style={{ backgroundColor: primaryColor }}>
                    {article.category_name}
                  </span>
                )}
                {article.tags?.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-white border border-white/20">
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4">{article.title}</h1>
              <div className="flex items-center gap-4 text-white/60 text-sm flex-wrap">
                {article.author_name && (
                  <span className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black text-white">{initials(article.author_name)}</span>
                    {article.author_name}
                  </span>
                )}
                {article.published_at && <span>{formatDate(article.published_at)}</span>}
                {article.reading_time_minutes && <span>{article.reading_time_minutes} min read</span>}
              </div>
            </div>
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg bg-black">
              <ArticleMediaBlock article={article} hero />
            </div>
          </div>
        </>
      ) : article.cover_image_url ? (
        <div className="relative h-[55vh] sm:h-[70vh] min-h-[350px] w-full">
          <Image
            src={article.cover_image_url}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
          <div className="absolute bottom-0 left-0 right-0 max-w-4xl mx-auto px-4 sm:px-6 pb-10">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {article.category_name && (
                <span
                  className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full text-zinc-950"
                  style={{ backgroundColor: primaryColor }}
                >
                  {article.category_name}
                </span>
              )}
              {article.tags?.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-white border border-white/20"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 text-white/60 text-sm flex-wrap">
              {article.author_name && (
                <span className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black text-white">
                    {initials(article.author_name)}
                  </span>
                  {article.author_name}
                </span>
              )}
              {article.published_at && <span>{formatDate(article.published_at)}</span>}
              {article.reading_time_minutes && (
                <span>{article.reading_time_minutes} min read</span>
              )}
              <span>{article.views_count} views</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-950 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {article.category_name && (
                <span
                  className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full text-zinc-950"
                  style={{ backgroundColor: primaryColor }}
                >
                  {article.category_name}
                </span>
              )}
              {article.tags?.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-white border border-white/20"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 text-white/60 text-sm flex-wrap">
              {article.author_name && (
                <span className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black text-white">
                    {initials(article.author_name)}
                  </span>
                  {article.author_name}
                </span>
              )}
              {article.published_at && <span>{formatDate(article.published_at)}</span>}
              {article.reading_time_minutes && (
                <span>{article.reading_time_minutes} min read</span>
              )}
              <span>{article.views_count} views</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {article.article_type !== 'video' && <ArticleMediaBlock article={article} />}
        <div
          className="[&_p]:mb-6 [&_p]:text-zinc-700 [&_p]:leading-[1.8] [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-zinc-950 [&_h2]:mt-12 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-zinc-950 [&_h3]:mt-8 [&_h3]:mb-3 [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-zinc-500 [&_blockquote]:my-8 [&_blockquote]:text-lg [&_ul]:pl-5 [&_li]:mb-2 [&_li]:text-zinc-700 [&_li]:list-disc [&_code]:bg-zinc-100 [&_code]:px-1.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_a]:text-[var(--cp)] [&_a]:underline [&_img]:rounded-xl [&_img]:my-6 [&_img]:w-full"
          data-article-body
          style={{ fontSize: 'var(--reader-fs, 1.0625rem)', fontFamily: 'var(--reader-ff)' }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        <div className="mt-12 pt-8 border-t border-zinc-200">
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-zinc-200 rounded-full px-4 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all cursor-default"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleLike}
                className={`inline-flex items-center gap-2 text-xs font-bold border rounded-full px-4 py-2 transition-all ${
                  liked
                    ? 'border-red-200 text-red-500 bg-red-50'
                    : 'border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${liked ? 'fill-red-500 text-red-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {likeCount}
              </button>
              <button
                onClick={toggleBookmark}
                className={`inline-flex items-center gap-2 text-xs font-bold border rounded-full px-4 py-2 transition-all ${
                  bookmarked
                    ? 'border-zinc-800 text-zinc-900 bg-zinc-100'
                    : 'border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${bookmarked ? 'fill-zinc-900' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {bookmarked ? 'Saved' : 'Save'}
              </button>
              <span className="text-sm text-zinc-400">{article.views_count} views</span>
            </div>
            <ShareButtons url={articleUrl} title={article.title} primaryColor={primaryColor} />
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-zinc-100">
          <Link
            href={basePath || "/"}
            className="text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            ← Back to all articles
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-8">
        <AdRotator slug={blog.slug} primaryColor={primaryColor} />
      </div>

      {showComments && (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-12 mb-8">
        <PublicCommentsSection blogSlug={blog.slug} articleSlug={article.slug} primaryColor={primaryColor} />
      </div>
      )}

      {showRelated && relatedArticles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-20 pt-16 border-t border-zinc-100 pb-12">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-8">{relatedTitle}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {relatedArticles.slice(0, 3).map((a, i) => (
              <Link
                key={a.id}
                href={aHref(a.slug)}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden block"
              >
                {a.cover_image_url ? (
                  <Image
                    src={a.cover_image_url}
                    alt={a.title}
                    fill
                    className="object-cover group-hover:scale-110 transition duration-500"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[i % 6]}`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  {a.category_name && (
                    <span
                      className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 text-zinc-950 inline-block"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {a.category_name}
                    </span>
                  )}
                  <p className="text-white font-bold leading-tight line-clamp-2 text-sm">
                    {a.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <CreativeFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
      <FloatingShareBar url={articleUrl} title={article.title} primaryColor={primaryColor} />
    </div>
  );
}
