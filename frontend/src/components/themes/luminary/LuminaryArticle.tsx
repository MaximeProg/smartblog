'use client';
import { useState, useEffect, useCallback, useMemo, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Heart, Bookmark } from 'lucide-react';
import type { ArticleProps } from '../ThemeRenderer';
import type { PublicArticle } from '@/lib/public-api';
import { LuminaryHeader, LuminaryFooter } from './LuminaryShared';
import { renderContent } from '../shared/renderContent';
import { ArticleMediaBlock } from '../shared/ArticleMediaBlock';
import { PublicCommentsSection } from '../shared/PublicCommentsSection';
import { AdRotator } from '../shared/AdRotator';
import { ShareButtons, FloatingShareBar } from '../shared/ShareButtons';
import { useBookmark } from '@/hooks/useBookmark';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.nexusblog.io';

const GRADIENTS = [
  'from-zinc-800 to-zinc-950',
  'from-amber-900 to-zinc-900',
  'from-stone-800 to-zinc-900',
  'from-slate-800 to-zinc-950',
  'from-neutral-800 to-stone-900',
];

function grad(id: string): string {
  return GRADIENTS[id.charCodeAt(0) % GRADIENTS.length];
}

function formatDate(d: string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function initials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

interface RelatedCardProps {
  article: PublicArticle;
  href: string;
}

function RelatedCard({ article, href }: RelatedCardProps) {
  return (
    <Link href={href} className="group flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden mb-4">
        {article.cover_image_url ? (
          <Image
            src={article.cover_image_url}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${grad(article.id)}`} />
        )}
      </div>
      {article.category_name && (
        <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 mb-1.5">
          {article.category_name}
        </p>
      )}
      <h3 className="font-serif text-base text-zinc-900 leading-snug mb-2 line-clamp-2 group-hover:text-[var(--cp)] transition-colors">
        {article.title}
      </h3>
      {article.excerpt && (
        <p className="font-sans text-sm text-zinc-500 leading-relaxed line-clamp-2 mb-3">
          {article.excerpt}
        </p>
      )}
      <p className="font-sans text-xs text-zinc-400 mt-auto">
        {article.author_name && <span>{article.author_name} &middot; </span>}
        {article.published_at
          ? new Date(article.published_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : ''}
      </p>
    </Link>
  );
}

export default function LuminaryArticle({
  blog,
  article,
  relatedArticles,
  categories = [],
  getArticleHref,
  basePath: _basePath,
  previewSlug,
}: ArticleProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const basePath = _basePath ?? `/${locale}/${blog.slug}`;
  const primaryColor = blog.primary_color || '#b8960c';

  const articleCfg = blog.template_config?.article as Record<string, any> | undefined;
  const showProgressBar = articleCfg?.progressBar?.enabled !== false;
  const showRelated = articleCfg?.relatedArticles?.enabled !== false;
  const relatedTitle = articleCfg?.relatedArticles?.sectionTitle || 'More to Read';
  const showComments = articleCfg?.comments?.enabled !== false;

  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likes_count ?? 0);
  const { bookmarked, toggle: toggleBookmark } = useBookmark(article.slug, article.title, blog.slug);
  const htmlContent = useMemo(() => renderContent(article.content), [article.content]);

  useEffect(() => {
    const fn = () => {
      const el = document.documentElement;
      const pct = el.scrollHeight - el.clientHeight;
      setProgress(pct > 0 ? Math.min(100, (window.scrollY / pct) * 100) : 0);
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const aHref = useCallback(
    (articleSlug: string) => {
      if (getArticleHref) return getArticleHref(articleSlug);
      if (previewSlug) return `/en/template/${articleSlug}?preview=${previewSlug}`;
      return `/${locale}/${blog.slug}/${articleSlug}`;
    },
    [getArticleHref, previewSlug, locale, blog.slug],
  );

  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    setLikeCount(n => n + 1);
    try {
      await fetch(`${API_URL}/api/v1/public/${blog.slug}/articles/${article.slug}/like`, {
        method: 'POST',
      });
    } catch {}
  };

  const articleUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://${blog.slug}.nexusblog.io/${article.slug}`;

  return (
    <div
      className="bg-[#faf8f4] min-h-screen text-zinc-900"
      style={{ '--cp': primaryColor } as CSSProperties}
    >
      {showProgressBar && (
        <div
          className="fixed top-0 left-0 z-[100] h-[2px] transition-none pointer-events-none"
          style={{ width: `${progress}%`, backgroundColor: primaryColor }}
        />
      )}

      <LuminaryHeader
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-12">
        <nav className="flex items-center gap-2 font-sans text-xs text-zinc-400 mb-8 uppercase tracking-widest">
          <Link href={basePath} className="hover:text-zinc-700 transition-colors">
            Home
          </Link>
          {article.category_name && article.category_slug && (
            <>
              <span className="text-zinc-300">/</span>
              <Link
                href={`${basePath}/categories/${article.category_slug}`}
                className="hover:text-zinc-700 transition-colors"
              >
                {article.category_name}
              </Link>
            </>
          )}
        </nav>

        {article.category_name && (
          <p
            className="font-serif italic text-base mb-4"
            style={{ color: primaryColor }}
          >
            {article.category_name}
          </p>
        )}

        <h1 className="font-serif text-4xl sm:text-5xl leading-tight text-zinc-900 mb-6">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="font-serif italic text-xl text-zinc-500 leading-relaxed mb-8">
            {article.excerpt}
          </p>
        )}

        <div className="flex items-center gap-4 py-5 border-t border-b border-zinc-200">
          <div className="h-10 w-10 rounded-full bg-zinc-900 text-white text-xs font-bold font-sans flex items-center justify-center shrink-0">
            {initials(article.author_name)}
          </div>
          <div>
            <p className="font-sans font-semibold text-sm text-zinc-900 leading-tight">
              {article.author_name || blog.name}
            </p>
            <p className="font-sans text-xs text-zinc-400">{blog.name}</p>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs text-zinc-400 font-sans flex-wrap justify-end">
            <span>{formatDate(article.published_at)}</span>
            {article.reading_time_minutes && (
              <>
                <span className="text-zinc-300">&middot;</span>
                <span>{article.reading_time_minutes} min read</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 pb-2">
          <button
            onClick={handleLike}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-sans transition-all ${
              liked
                ? 'border-red-200 text-red-500 bg-red-50'
                : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-[#f0ede6]'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-red-500' : ''}`} />
            {likeCount}
          </button>
          <button
            onClick={toggleBookmark}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-sans transition-all ${
              bookmarked
                ? 'border-zinc-800 text-zinc-900 bg-zinc-100'
                : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-[#f0ede6]'
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? 'fill-zinc-900' : ''}`} />
            {bookmarked ? 'Saved' : 'Save'}
          </button>
          <ShareButtons url={articleUrl} title={article.title} primaryColor={primaryColor} />
        </div>
      </div>

      {/* Hero: video takes priority */}
      {article.article_type === 'video' && article.video_url ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 mb-2">
          <div className="relative aspect-[21/9] bg-black overflow-hidden">
            <ArticleMediaBlock article={article} hero />
          </div>
        </div>
      ) : article.cover_image_url ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 mb-2">
          <div className="relative aspect-[21/9]">
            <Image
              src={article.cover_image_url}
              alt={article.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 mb-2">
          <div className={`relative aspect-[21/9] bg-gradient-to-br ${grad(article.id)}`} />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {article.article_type !== 'video' && <ArticleMediaBlock article={article} />}
        <div
          className="[&_p]:mb-6 [&_p]:text-lg [&_p]:leading-relaxed [&_p]:text-zinc-700 [&_p:first-child::first-letter]:text-6xl [&_p:first-child::first-letter]:font-serif [&_p:first-child::first-letter]:float-left [&_p:first-child::first-letter]:mr-2 [&_p:first-child::first-letter]:mt-1 [&_p:first-child::first-letter]:leading-none [&_h2]:text-2xl [&_h2]:font-serif [&_h2]:text-zinc-900 [&_h2]:mt-12 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-serif [&_h3]:text-zinc-900 [&_h3]:mt-8 [&_h3]:mb-3 [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-zinc-600 [&_blockquote]:text-xl [&_blockquote]:my-10 [&_ul]:mb-6 [&_ul]:space-y-2 [&_ul]:pl-6 [&_li]:text-zinc-700 [&_li]:list-disc [&_li]:text-lg [&_ol]:mb-6 [&_ol]:space-y-2 [&_ol]:pl-6 [&_ol>li]:text-zinc-700 [&_ol>li]:list-decimal [&_ol>li]:text-lg [&_code]:bg-zinc-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:font-mono [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-zinc-300 [&_a:hover]:decoration-zinc-900 [&_img]:w-full [&_img]:my-8 [&_hr]:border-zinc-200 [&_hr]:my-12"
          data-article-body
          style={{ fontSize: 'var(--reader-fs, 1.0625rem)', fontFamily: 'var(--reader-ff)' }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      {article.tags && article.tags.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-8">
          <div className="border-t border-zinc-200 pt-6 flex flex-wrap gap-2">
            {article.tags.map(tag => (
              <span
                key={tag}
                className="font-sans text-[10px] uppercase tracking-widest px-3 py-1.5 border border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-zinc-950 p-8 flex items-start gap-5">
          <div className="h-12 w-12 rounded-full bg-zinc-700 text-white text-sm font-bold font-sans flex items-center justify-center shrink-0">
            {initials(article.author_name)}
          </div>
          <div>
            <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
              Written by
            </p>
            <p className="font-serif text-lg text-white mb-2">
              {article.author_name || blog.name}
            </p>
            <p className="font-sans text-sm text-zinc-400 leading-relaxed">
              A contributor to {blog.name}, writing on topics that matter.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-8 mb-8">
        <AdRotator slug={blog.slug} primaryColor={primaryColor} />
      </div>

      {showComments && (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mb-16">
        <PublicCommentsSection blogSlug={blog.slug} articleSlug={article.slug} primaryColor={primaryColor} />
      </div>
      )}

      {showRelated && relatedArticles.length > 0 && (
        <section className="border-t border-zinc-200 bg-[#f0ede6] py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-4 mb-10">
              <div className="flex-1 h-px bg-zinc-300" />
              <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-500 whitespace-nowrap">
                {relatedTitle}
              </span>
              <div className="flex-1 h-px bg-zinc-300" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedArticles.slice(0, 3).map(ra => (
                <RelatedCard
                  key={ra.id}
                  article={ra}
                  href={aHref(ra.slug)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <LuminaryFooter
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />
      <FloatingShareBar url={articleUrl} title={article.title} primaryColor={primaryColor} />
    </div>
  );
}
