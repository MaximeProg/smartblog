'use client';
import { useState, useCallback, type CSSProperties, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { HomeProps } from '../ThemeRenderer';
import { MinimalHeader, MinimalFooter } from './MinimalShared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.nexusblog.io';

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function MinimalHome({
  blog,
  articles,
  categories,
  currentCategory,
  getArticleHref: _getArticleHref,
  previewSlug,
}: HomeProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const basePath = `/${locale}/${blog.slug}`;
  const primaryColor = blog.primary_color || '#18181b';

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

  const homeCfg = blog.template_config?.home;
  const showHero = homeCfg?.hero?.enabled !== false;
  const showLatest = homeCfg?.latest?.enabled !== false;
  const latestTitle = homeCfg?.latest?.sectionTitle || '';
  const showNewsletter = homeCfg?.newsletter?.enabled !== false;
  const newsletterTitle = homeCfg?.newsletter?.title || 'Subscribe';
  const newsletterDesc = homeCfg?.newsletter?.description || `Get the best articles from ${blog.name} delivered to your inbox.`;
  const newsletterBtn = homeCfg?.newsletter?.buttonLabel || 'Subscribe';
  const newsletterPlaceholder = homeCfg?.newsletter?.placeholder || 'your@email.com';
  const showCategoriesStrip = homeCfg?.categoriesStrip?.enabled !== false;

  const isFiltered = !!currentCategory;
  const filteredCategory = categories.find(c => c.slug === currentCategory);

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <MinimalHeader
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />

      {showHero && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-16 pb-12 border-b border-zinc-100">
          <h1 className="text-3xl font-bold text-zinc-950 mb-3">{blog.name}</h1>
          {blog.description && (
            <p className="text-zinc-500 text-base leading-relaxed">{blog.description}</p>
          )}
          {showCategoriesStrip && categories.length > 0 && (
            <div className="flex gap-2 mt-6 overflow-x-auto pb-1">
              {categories.map(c => (
                <Link
                  key={c.id}
                  href={`?category=${c.slug}`}
                  className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-zinc-200 text-zinc-500 transition-colors whitespace-nowrap shrink-0"
                  style={
                    currentCategory === c.slug
                      ? { borderColor: primaryColor, color: primaryColor }
                      : {}
                  }
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {isFiltered && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8">
          <Link
            href={basePath}
            className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors inline-flex items-center gap-1 mb-4"
          >
            ← All posts
          </Link>
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-bold text-zinc-950">
              {filteredCategory?.name ?? currentCategory}
            </h2>
            <span className="text-sm text-zinc-400">
              {articles.length} article{articles.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {latestTitle && showLatest && !isFiltered && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">{latestTitle}</p>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {articles.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-zinc-400">Nothing here yet.</p>
          </div>
        ) : (
          <div>
            {articles.map(a => (
              <Link
                key={a.id}
                href={aHref(a.slug)}
                className="group py-8 border-b border-zinc-100 last:border-0 flex items-start justify-between gap-6"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {a.category_name && (
                      <>
                        <span
                          className="w-2 h-2 rounded-full shrink-0 inline-block"
                          style={{ backgroundColor: primaryColor }}
                        />
                        <span
                          className="text-[11px] font-bold uppercase tracking-wider"
                          style={{ color: primaryColor }}
                        >
                          {a.category_name}
                        </span>
                        <span className="text-zinc-300">·</span>
                      </>
                    )}
                    <span className="text-[11px] text-zinc-400">{formatDate(a.published_at)}</span>
                    {a.reading_time_minutes && (
                      <>
                        <span className="text-zinc-300">·</span>
                        <span className="text-[11px] text-zinc-400">
                          {a.reading_time_minutes} min read
                        </span>
                      </>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900 leading-snug mb-2 group-hover:text-[var(--cp)] transition-colors">
                    {a.title}
                  </h2>
                  {a.excerpt && (
                    <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2">{a.excerpt}</p>
                  )}
                </div>
                <div className="shrink-0 hidden sm:block text-right pt-1">
                  {a.views_count > 0 && (
                    <p className="text-xs text-zinc-300">{a.views_count.toLocaleString()} views</p>
                  )}
                  {a.likes_count > 0 && (
                    <p className="text-xs text-zinc-300 mt-0.5">♥ {a.likes_count}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showNewsletter && (
      <div
        id="newsletter"
        className="max-w-2xl mx-auto px-4 sm:px-6 py-14 border-t border-zinc-100 mt-8"
      >
        <h2 className="text-2xl font-bold text-zinc-950 mb-2">{newsletterTitle}</h2>
        <p className="text-zinc-500 text-sm mb-6">{newsletterDesc}</p>
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
              placeholder={newsletterPlaceholder}
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
              {subStatus === 'loading' ? '…' : newsletterBtn}
            </button>
          </form>
        )}
        {subStatus === 'error' && (
          <p className="text-xs text-red-500 mt-2">Something went wrong. Please try again.</p>
        )}
      </div>
      )}

      <MinimalFooter
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />
    </div>
  );
}
