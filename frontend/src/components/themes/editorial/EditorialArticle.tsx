'use client';
import { useState, useEffect, useCallback, useMemo, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Heart, Bookmark, Clock } from 'lucide-react';
import type { ArticleProps } from '../ThemeRenderer';
import type { PublicArticle } from '@/lib/public-api';
import { EditorialHeader, EditorialFooter } from './EditorialShared';
import { renderContent } from '../shared/renderContent';
import { ArticleMediaBlock } from '../shared/ArticleMediaBlock';
import { PublicCommentsSection } from '../shared/PublicCommentsSection';
import { AdRotator } from '../shared/AdRotator';
import { ShareButtons, FloatingShareBar } from '../shared/ShareButtons';
import { BlogLanguageSwitcher } from '../shared/BlogLanguageSwitcher';
import { useBookmark } from '@/hooks/useBookmark';

const cardGradients = [
  'from-zinc-100 to-zinc-200',
  'from-blue-50 to-blue-100',
  'from-emerald-50 to-emerald-100',
  'from-violet-50 to-violet-100',
  'from-amber-50 to-amber-100',
  'from-rose-50 to-rose-100',
];

function formatDate(d: string | null, locale: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

function initials(name: string | null) {
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
  index: number;
  primaryColor: string;
  locale: string;
}

function RelatedCard({ article, href, index, primaryColor, locale }: RelatedCardProps) {
  const t = useTranslations('publicBlog');
  return (
    <Link href={href} className="group flex flex-col" style={{ '--cp': primaryColor } as CSSProperties}>
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4 ring-0 group-hover:ring-2 transition-all ring-offset-2 ring-[var(--cp)]">
        {article.cover_image_url ? (
          <Image
            src={article.cover_image_url}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${cardGradients[index % cardGradients.length]}`}
          />
        )}
        {article.category_name && (
          <span className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/90 text-zinc-700">
            {article.category_name}
          </span>
        )}
      </div>
      <h3 className="text-base font-bold text-zinc-900 leading-snug mb-2 line-clamp-2 group-hover:text-[var(--cp)] transition-colors">
        {article.title}
      </h3>
      {article.excerpt && (
        <p className="text-sm text-zinc-500 leading-relaxed mb-3 line-clamp-2">{article.excerpt}</p>
      )}
      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-auto pt-2 border-t border-zinc-100 flex-wrap">
        <span>{formatDate(article.published_at, locale)}</span>
        {article.reading_time_minutes && (
          <>
            <span>·</span>
            <Clock className="h-3 w-3" />
            <span>{t('minRead', { min: article.reading_time_minutes })}</span>
          </>
        )}
      </div>
    </Link>
  );
}

export default function EditorialArticle({
  blog,
  article,
  relatedArticles,
  categories = [],
  getArticleHref,
  basePath: _basePath,
  previewSlug,
  lang,
}: ArticleProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('publicBlog');
  const basePath = _basePath ?? `/${locale}/${blog.slug}`;
  const primaryColor = blog.primary_color || '#18181b';

  const articleCfg = blog.template_config?.article as Record<string, any> | undefined;
  const showProgressBar = articleCfg?.progressBar?.enabled !== false;
  const showShare = articleCfg?.share?.enabled !== false;
  const showRelated = articleCfg?.relatedArticles?.enabled !== false;
  const relatedTitle = articleCfg?.relatedArticles?.sectionTitle || t('relatedArticles');
  const showComments = articleCfg?.comments?.enabled !== false;
  const showAuthorBio = articleCfg?.authorBio?.enabled !== false;

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
    (s: string) => {
      if (getArticleHref) return getArticleHref(s);
      if (previewSlug) return `/en/template/${s}?preview=${previewSlug}`;
      return `${basePath}/${s}`;
    },
    [getArticleHref, previewSlug, basePath],
  );

  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    setLikeCount(n => n + 1);
    try {
      await fetch(`/api/public-proxy/${blog.slug}/articles/${article.slug}/like`, {
        method: 'POST',
      });
    } catch {}
  };

  const articleUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://${blog.slug}.smarterbloggers.com/${article.slug}`;

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      {showProgressBar && (
        <div
          className="fixed top-0 left-0 z-[100] h-[3px] transition-none pointer-events-none"
          style={{ width: `${progress}%`, backgroundColor: primaryColor }}
        />
      )}

      <EditorialHeader
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-10">
        <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-6">
          <Link href={basePath || "/"} className="hover:text-zinc-700 transition-colors">
            {t('navHome')}
          </Link>
          {article.category_name && article.category_slug && (
            <>
              <span>/</span>
              <Link
                href={`${basePath}/categories/${article.category_slug}`}
                className="hover:text-zinc-700 transition-colors"
              >
                {article.category_name}
              </Link>
            </>
          )}
        </nav>

        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 mb-6">
            {article.tags.map(tag => (
              <span
                key={tag}
                className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-zinc-100 text-zinc-500"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 leading-tight mb-5">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="text-xl text-zinc-500 leading-relaxed mb-8">{article.excerpt}</p>
        )}

        <div className="flex items-center gap-4 py-5 border-y border-zinc-100">
          {article.author_avatar_url ? (
            <img src={article.author_avatar_url} alt={article.author_name || ''} className="h-11 w-11 rounded-full object-cover shrink-0" />
          ) : (
            <div className="h-11 w-11 rounded-full bg-zinc-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
              {initials(article.author_name)}
            </div>
          )}
          <div>
            <p className="font-semibold text-zinc-900 text-sm">{article.author_name || blog.name}</p>
            <p className="text-xs text-zinc-400">{t('authorLabel')} · {blog.name}</p>
          </div>
          <div className="ml-auto flex items-center gap-4 text-xs text-zinc-400 flex-wrap justify-end">
            <span>{formatDate(article.published_at, locale)}</span>
            {article.reading_time_minutes && (
              <>
                <span>·</span>
                <span>{t('minRead', { min: article.reading_time_minutes })}</span>
              </>
            )}
            {article.views_count > 0 && (
              <>
                <span>·</span>
                <span>{article.views_count.toLocaleString()} {t('viewsLabel')}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hero: video takes priority over cover image */}
      {article.article_type === 'video' && article.video_url ? (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 mb-10">
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-md bg-black">
            <ArticleMediaBlock article={article} hero />
          </div>
        </div>
      ) : article.cover_image_url ? (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 mb-10">
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-md">
            <Image
              src={article.cover_image_url}
              alt={article.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
            />
          </div>
        </div>
      ) : null}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-8">
        {article.article_type !== 'video' && <ArticleMediaBlock article={article} />}
        <div
          className="[&_p]:mb-6 [&_p]:text-zinc-700 [&_p]:leading-[1.85] [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-zinc-900 [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-zinc-200 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-zinc-900 [&_h3]:mt-8 [&_h3]:mb-3 [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-zinc-500 [&_blockquote]:my-8 [&_blockquote]:text-lg [&_ul]:mb-6 [&_ul]:space-y-2 [&_ul]:pl-6 [&_li]:text-zinc-700 [&_li]:list-disc [&_code]:bg-zinc-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_a]:underline [&_a]:underline-offset-2"
          data-article-body
          style={{ fontSize: 'var(--reader-fs, 1.125rem)', fontFamily: 'var(--reader-ff)' }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      {showShare && (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-12 pt-8 border-t border-zinc-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-3">
            <button
              onClick={handleLike}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                liked
                  ? 'border-red-200 text-red-500 bg-red-50'
                  : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-red-500' : ''}`} />
              {likeCount}
            </button>
            <button
              onClick={toggleBookmark}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                bookmarked
                  ? 'border-zinc-800 text-zinc-900 bg-zinc-100'
                  : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-zinc-900' : ''}`} />
              {bookmarked ? t('savedArticle') : t('saveArticle')}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <ShareButtons url={articleUrl} title={article.title} primaryColor={primaryColor} />
            <BlogLanguageSwitcher sourceLang={blog.language} enabledLanguages={blog.enabled_languages ?? []} basePath={basePath} />
          </div>
        </div>
      </div>
      )}
      <FloatingShareBar url={articleUrl} title={article.title} primaryColor={primaryColor} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-8">
        <AdRotator slug={blog.slug} primaryColor={primaryColor} />
      </div>

      {showRelated && relatedArticles.length > 0 && (
        <div className="mt-20 max-w-5xl mx-auto px-4 sm:px-6 border-t border-zinc-200 pt-16">
          <h2 className="text-xl font-bold text-zinc-900 mb-8">{relatedTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedArticles.slice(0, 3).map((ra, i) => (
              <RelatedCard
                key={ra.id}
                article={ra}
                href={aHref(ra.slug)}
                index={i}
                primaryColor={primaryColor}
                locale={locale}
              />
            ))}
          </div>
        </div>
      )}

      {showComments && (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-16 mb-16">
        <PublicCommentsSection blogSlug={blog.slug} articleSlug={article.slug} primaryColor={primaryColor} />
      </div>
      )}

      <EditorialFooter
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />
    </div>
  );
}
