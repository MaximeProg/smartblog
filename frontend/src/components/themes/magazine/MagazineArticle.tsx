'use client';
import { useState, useEffect, useCallback, useMemo, type CSSProperties, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ArticleProps } from '../ThemeRenderer';
import { MagazineHeader, MagazineFooter } from './MagazineShared';
import { renderContent } from '../shared/renderContent';
import { ArticleMediaBlock } from '../shared/ArticleMediaBlock';
import { PublicCommentsSection } from '../shared/PublicCommentsSection';
import { AdRotator } from '../shared/AdRotator';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.nexusblog.io';

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function ReadingProgressBar({ color }: { color: string }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min((window.scrollY / max) * 100, 100) : 0);
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] pointer-events-none bg-transparent">
      <div style={{ width: `${progress}%`, backgroundColor: color, height: '100%', transition: 'width 0.1s linear' }} />
    </div>
  );
}

export default function MagazineArticle({
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
  const primaryColor = blog.primary_color || '#e11d48';

  const articleCfg = blog.template_config?.article as Record<string, any> | undefined;
  const showProgressBar = articleCfg?.progressBar?.enabled !== false;
  const showRelated = articleCfg?.relatedArticles?.enabled !== false;
  const showComments = articleCfg?.comments?.enabled !== false;

  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [imgErr, setImgErr] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likes_count ?? 0);
  const htmlContent = useMemo(() => renderContent(article.content), [article.content]);

  const aHref = useCallback(
    (s: string) => {
      if (getArticleHref) return getArticleHref(s);
      if (previewSlug) return `/en/template/${s}?preview=${previewSlug}`;
      return `/${locale}/${blog.slug}/${s}`;
    },
    [getArticleHref, previewSlug, locale, blog.slug],
  );

  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    setLikeCount(n => n + 1);
    try {
      await fetch(`${API_URL}/api/v1/public/${blog.slug}/articles/${article.slug}/like`, { method: 'POST' });
    } catch {}
  };

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubStatus('loading');
    try {
      const res = await fetch(`${API_URL}/api/v1/public/${blog.slug}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSubStatus(res.ok ? 'ok' : 'error');
    } catch {
      setSubStatus('error');
    }
  };

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      {showProgressBar && <ReadingProgressBar color={primaryColor} />}
      <MagazineHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <article className="lg:col-span-2">
            {article.category_name && (
              <span
                className="text-[10px] font-black uppercase px-3 py-1 rounded text-white mb-4 inline-block"
                style={{ backgroundColor: primaryColor }}
              >
                {article.category_name}
              </span>
            )}

            <h1 className="text-4xl sm:text-5xl font-black text-zinc-950 leading-tight mb-4">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-xl text-zinc-500 leading-relaxed mb-6">{article.excerpt}</p>
            )}

            <div className="flex items-center gap-3 py-4 border-y border-zinc-200">
              <div
                className="h-10 w-10 rounded-full font-black text-white text-sm flex items-center justify-center shrink-0 bg-zinc-800"
              >
                {initials(article.author_name)}
              </div>
              <div>
                <p className="font-bold text-zinc-900 text-sm">{article.author_name || blog.name}</p>
                <p className="text-xs text-zinc-400">{blog.name}</p>
              </div>
              <div className="ml-auto text-xs text-zinc-400 text-right">
                <p>{formatDate(article.published_at)}</p>
                {article.reading_time_minutes && (
                  <p>{article.reading_time_minutes} min read</p>
                )}
              </div>
            </div>

            {/* Hero: video takes priority over cover image */}
            {article.article_type === 'video' && article.video_url ? (
              <div className="relative aspect-video rounded mt-6 mb-8 overflow-hidden bg-black">
                <ArticleMediaBlock article={article} hero />
              </div>
            ) : (
              <div className="relative aspect-video rounded mt-6 mb-8 overflow-hidden">
                {article.cover_image_url && !imgErr ? (
                  <Image
                    src={article.cover_image_url}
                    alt={article.title}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    onError={() => setImgErr(true)}
                  />
                ) : (
                  <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${primaryColor}22, ${primaryColor}55)` }} />
                )}
              </div>
            )}

            {article.article_type !== 'video' && <ArticleMediaBlock article={article} />}
            <div
              className="[&_p]:mb-5 [&_p]:text-zinc-700 [&_p]:text-[1.05rem] [&_p]:leading-relaxed [&_h2]:text-2xl [&_h2]:font-black [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-zinc-950 [&_h3]:text-xl [&_h3]:font-black [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-zinc-950 [&_blockquote]:border-l-4 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-zinc-500 [&_blockquote]:my-6 [&_blockquote]:text-lg [&_ul]:pl-5 [&_ul]:mb-5 [&_ol]:pl-5 [&_ol]:mb-5 [&_li]:mb-2 [&_li]:text-zinc-700 [&_a]:text-[var(--cp)] [&_a]:underline [&_img]:rounded-lg [&_img]:my-6 [&_hr]:border-zinc-100 [&_hr]:my-8 [&_code]:bg-zinc-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-zinc-100">
                {article.tags.map(tag => (
                  <span
                    key={tag}
                    className="border border-zinc-200 rounded px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-100 transition-colors cursor-default"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-100 flex-wrap gap-4">
              <div className="flex gap-3">
                <button
                  onClick={handleLike}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded border text-sm font-bold transition-all ${
                    liked
                      ? 'border-red-200 text-red-500 bg-red-50'
                      : 'border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {likeCount}
                </button>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(article.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Share on X
                </a>
                <button
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                  className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Copy link
                </button>
              </div>
            </div>
          </article>

          <aside className="lg:col-span-1 space-y-6">
            {showRelated && relatedArticles.length > 0 && (
              <div>
                <div className="border-b-2 pb-2 mb-4" style={{ borderColor: primaryColor }}>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Related</span>
                </div>
                {relatedArticles.slice(0, 5).map(a => (
                  <Link key={a.id} href={aHref(a.slug)} className="flex gap-3 py-4 border-b border-zinc-100 last:border-0 group">
                    <div className="relative h-16 w-16 shrink-0 rounded overflow-hidden">
                      {a.cover_image_url ? (
                        <Image
                          src={a.cover_image_url}
                          alt={a.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${primaryColor}22, ${primaryColor}44)` }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {a.category_name && (
                        <span className="text-[10px] font-black uppercase block" style={{ color: primaryColor }}>{a.category_name}</span>
                      )}
                      <p className="text-sm font-bold text-zinc-900 leading-snug group-hover:text-[var(--cp)] transition-colors line-clamp-2">{a.title}</p>
                      <p className="text-xs text-zinc-400 mt-1">{formatDate(a.published_at)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div>
              <div className="border-b-2 pb-2 mb-3" style={{ borderColor: primaryColor }}>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Topics</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {([] as { slug: string; name: string }[])
                  .concat(
                    relatedArticles
                      .filter(a => a.category_slug && a.category_name)
                      .map(a => ({ slug: a.category_slug!, name: a.category_name! }))
                  )
                  .filter((v, i, arr) => arr.findIndex(x => x.slug === v.slug) === i)
                  .map(c => (
                    <Link
                      key={c.slug}
                      href={`${basePath}/categories/${c.slug}`}
                      className="border border-zinc-200 rounded px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-colors"
                    >
                      {c.name}
                    </Link>
                  ))}
                <Link
                  href={`${basePath}/categories`}
                  className="border border-zinc-200 rounded px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-colors"
                >
                  All Topics →
                </Link>
              </div>
            </div>

            <AdRotator slug={blog.slug} primaryColor={primaryColor} />

            <div className="rounded-lg p-5 text-white" style={{ backgroundColor: primaryColor }}>
              <p className="text-sm font-black mb-2">Get the newsletter</p>
              <p className="text-xs text-white/70 mb-3">Top stories from {blog.name} in your inbox.</p>
              {subStatus === 'ok' ? (
                <p className="text-white font-bold text-xs">You&apos;re subscribed!</p>
              ) : (
                <>
                  <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-xs placeholder:text-white/50 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={subStatus === 'loading'}
                      className="w-full bg-white rounded py-2 text-xs font-black hover:opacity-90 disabled:opacity-60 transition-opacity"
                      style={{ color: primaryColor }}
                    >
                      {subStatus === 'loading' ? '…' : 'Subscribe Free'}
                    </button>
                  </form>
                  {subStatus === 'error' && (
                    <p className="text-white/70 text-xs mt-2">Something went wrong.</p>
                  )}
                </>
              )}
            </div>
          </aside>
        </div>

        {showComments && (
        <div className="mt-12 pt-12 border-t border-zinc-100">
          <PublicCommentsSection blogSlug={blog.slug} articleSlug={article.slug} primaryColor={primaryColor} />
        </div>
        )}
      </div>

      <MagazineFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
    </div>
  );
}
