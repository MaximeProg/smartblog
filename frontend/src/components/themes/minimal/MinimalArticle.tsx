'use client';
import { useState, useEffect, useCallback, type CSSProperties, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ArticleProps } from '../ThemeRenderer';
import type { PublicArticle } from '@/lib/public-api';
import { MinimalHeader, MinimalFooter } from './MinimalShared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.nexusblog.io';

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function ReadingProgressBar({ color }: { color: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const { scrollY } = window;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min((scrollY / max) * 100, 100) : 0);
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[2px] pointer-events-none bg-transparent">
      <div style={{ width: `${progress}%`, backgroundColor: color, height: '100%' }} />
    </div>
  );
}

function RelatedArticleRow({
  article,
  href,
  primaryColor,
}: {
  article: PublicArticle;
  href: string;
  primaryColor: string;
}) {
  return (
    <Link
      href={href}
      className="group py-6 border-b border-zinc-100 last:border-0 flex items-start justify-between gap-6"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {article.category_name && (
            <>
              <span
                className="w-2 h-2 rounded-full shrink-0 inline-block"
                style={{ backgroundColor: primaryColor }}
              />
              <span
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: primaryColor }}
              >
                {article.category_name}
              </span>
              <span className="text-zinc-300">·</span>
            </>
          )}
          <span className="text-[11px] text-zinc-400">{formatDate(article.published_at)}</span>
          {article.reading_time_minutes && (
            <>
              <span className="text-zinc-300">·</span>
              <span className="text-[11px] text-zinc-400">
                {article.reading_time_minutes} min read
              </span>
            </>
          )}
        </div>
        <h3 className="text-base font-bold text-zinc-900 leading-snug group-hover:text-[var(--cp)] transition-colors">
          {article.title}
        </h3>
      </div>
    </Link>
  );
}

export default function MinimalArticle({
  blog,
  article,
  relatedArticles,
  getArticleHref: _getArticleHref,
  basePath: _basePath,
  previewSlug,
}: ArticleProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const basePath = _basePath ?? `/${locale}/${blog.slug}`;
  const primaryColor = blog.primary_color || '#18181b';

  const [imgErr, setImgErr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likes_count ?? 0);
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const aHref = useCallback(
    (s: string) => {
      if (_getArticleHref) return _getArticleHref(s);
      if (previewSlug) return `/en/template/${s}?preview=${previewSlug}`;
      return `/${locale}/${blog.slug}/${s}`;
    },
    [_getArticleHref, previewSlug, locale, blog.slug],
  );

  const authorInitial = (article.author_name || blog.name)[0]?.toUpperCase() ?? 'A';

  const copyLink = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // non-critical
    }
  };

  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    setLikeCount(n => n + 1);
    try {
      await fetch(`${API_URL}/api/v1/public/${blog.slug}/articles/${article.slug}/like`, {
        method: 'POST',
      });
    } catch {
      // non-critical
    }
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

  const articleUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://${blog.slug}.nexusblog.io/${article.slug}`;

  return (
    <div
      className="bg-white min-h-screen"
      style={{ '--cp': primaryColor } as CSSProperties}
    >
      <ReadingProgressBar color={primaryColor} />

      <MinimalHeader
        blog={blog}
        categories={[]}
        basePath={basePath}
        primaryColor={primaryColor}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-12 pb-24">
        <Link
          href={basePath}
          className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors mb-8 inline-block"
        >
          ← Back
        </Link>

        <div className="flex flex-wrap gap-2 mb-5">
          {article.category_name && (
            <span
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: primaryColor }}
            >
              {article.category_name}
            </span>
          )}
          {article.tags?.map(tag => (
            <span
              key={tag}
              className="text-[11px] text-zinc-400 uppercase tracking-wider"
            >
              {tag}
            </span>
          ))}
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-950 leading-tight mb-5">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="text-xl text-zinc-500 leading-relaxed mb-8">{article.excerpt}</p>
        )}

        <div className="flex items-center gap-3 py-5 border-y border-zinc-100">
          <div className="h-9 w-9 rounded-full bg-zinc-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
            {authorInitial}
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              {article.author_name || blog.name}
            </p>
            <p className="text-xs text-zinc-400">{blog.name}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-zinc-400 flex-wrap justify-end">
            <span>{formatDate(article.published_at)}</span>
            {article.reading_time_minutes && (
              <>
                <span>·</span>
                <span>{article.reading_time_minutes} min read</span>
              </>
            )}
            {article.views_count > 0 && (
              <>
                <span>·</span>
                <span>{article.views_count.toLocaleString()} views</span>
              </>
            )}
          </div>
        </div>

        {article.cover_image_url && !imgErr ? (
          <div className="relative aspect-[2/1] rounded-xl overflow-hidden my-10">
            <Image
              src={article.cover_image_url}
              alt={article.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 672px) 100vw, 672px"
              onError={() => setImgErr(true)}
            />
          </div>
        ) : (
          <hr className="mt-8 mb-8 border-zinc-100" />
        )}

        <div
          className="[&_p]:mb-6 [&_p]:text-zinc-700 [&_p]:leading-[1.85] [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-zinc-950 [&_h2]:mt-12 [&_h2]:mb-4 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-zinc-950 [&_h3]:mt-8 [&_h3]:mb-3 [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-zinc-500 [&_blockquote]:my-8 [&_ul]:mb-6 [&_ul]:pl-5 [&_li]:mb-2 [&_li]:text-zinc-700 [&_li]:list-disc [&_ol]:mb-6 [&_ol]:pl-5 [&_code]:bg-zinc-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_a]:text-[var(--cp)] [&_a]:underline [&_img]:rounded-lg [&_img]:my-6 [&_hr]:border-zinc-100 [&_hr]:my-8"
          style={{ fontSize: '1.0625rem', lineHeight: '1.85' }}
          dangerouslySetInnerHTML={{ __html: article.content || '<p>No content available.</p>' }}
        />

        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-zinc-100">
            {article.tags.map(tag => (
              <span
                key={tag}
                className="border border-zinc-200 rounded-full px-3 py-1 text-xs text-zinc-500 cursor-default hover:border-[var(--cp)] hover:text-[var(--cp)] transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-6 text-sm text-zinc-400 flex-wrap gap-3">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-colors ${liked ? 'text-red-500' : 'hover:text-zinc-700'}`}
          >
            <span>{liked ? '♥' : '♡'}</span>
            <span>{likeCount}</span>
            <span>· {article.views_count.toLocaleString()} views</span>
          </button>

          <div className="flex items-center gap-4">
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(article.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-zinc-900 transition-colors text-xs"
            >
              Share on X
            </a>
            <button
              onClick={copyLink}
              className="text-zinc-400 hover:text-zinc-900 transition-colors text-xs"
            >
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </div>

        {relatedArticles.length > 0 && (
          <div className="mt-20 pt-12 border-t border-zinc-100">
            <p className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-8">
              More to read
            </p>
            {relatedArticles.slice(0, 3).map(ra => (
              <RelatedArticleRow
                key={ra.id}
                article={ra}
                href={aHref(ra.slug)}
                primaryColor={primaryColor}
              />
            ))}
          </div>
        )}

        <div
          id="newsletter"
          className="mt-20 pt-12 border-t border-zinc-100"
        >
          <h2 className="text-2xl font-bold text-zinc-950 mb-2">Subscribe</h2>
          <p className="text-zinc-500 text-sm mb-6">
            Enjoyed this? Get more articles from {blog.name} in your inbox.
          </p>
          {subStatus === 'ok' ? (
            <p className="text-sm font-medium" style={{ color: primaryColor }}>
              You&apos;re subscribed. Thank you!
            </p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors"
                onFocus={e => (e.currentTarget.style.borderColor = primaryColor)}
                onBlur={e => (e.currentTarget.style.borderColor = '')}
              />
              <button
                type="submit"
                disabled={subStatus === 'loading'}
                className="px-5 py-2.5 rounded-lg text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 transition-opacity shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {subStatus === 'loading' ? '…' : 'Subscribe'}
              </button>
            </form>
          )}
          {subStatus === 'error' && (
            <p className="text-xs text-red-500 mt-2">Something went wrong. Please try again.</p>
          )}
        </div>
      </div>

      <MinimalFooter
        blog={blog}
        categories={[]}
        basePath={basePath}
        primaryColor={primaryColor}
      />
    </div>
  );
}
