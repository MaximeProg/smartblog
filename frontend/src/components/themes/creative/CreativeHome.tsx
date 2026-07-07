'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useCallback, type CSSProperties } from 'react';
import { useParams } from 'next/navigation';
import type { HomeProps } from '../ThemeRenderer';
import { CreativeHeader, CreativeFooter } from './CreativeShared';
import { VideoCardThumb } from '../shared/VideoCardThumb';

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

export default function CreativeHome({
  blog,
  articles,
  categories,
  currentCategory,
  searchQuery,
  getArticleHref,
  previewSlug,
}: HomeProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const primaryColor = blog.primary_color || '#7c3aed';

  const basePath = previewSlug
    ? `/en/template?preview=${previewSlug}`
    : `/${locale}/${blog.slug}`;

  const aHref = useCallback(
    (s: string) => {
      if (getArticleHref) return getArticleHref(s);
      if (previewSlug) return `/en/template/${s}?preview=${previewSlug}`;
      return `/${locale}/${blog.slug}/${s}`;
    },
    [getArticleHref, previewSlug, locale, blog.slug]
  );

  const homeCfg = blog.template_config?.home;
  const showHero = homeCfg?.hero?.enabled !== false;
  const heroTitle = homeCfg?.hero?.sectionTitle || 'Featured';
  const showLatest = homeCfg?.latest?.enabled !== false;
  const latestTitle = homeCfg?.latest?.sectionTitle || 'Latest Work';
  const showNewsletter = homeCfg?.newsletter?.enabled !== false;
  const newsletterTitle = homeCfg?.newsletter?.title || blog.name;
  const newsletterDesc = homeCfg?.newsletter?.description || 'Join the creative community';
  const newsletterBtn = homeCfg?.newsletter?.buttonLabel || 'Subscribe';
  const newsletterPlaceholder = homeCfg?.newsletter?.placeholder || 'your@email.com';

  const isFiltered = !!(currentCategory || searchQuery);
  const heroArticle = !isFiltered && showHero && articles.length > 0 ? articles[0] : null;
  const gridArticles = !isFiltered && showHero && articles.length > 0 ? articles.slice(1) : articles;

  const [email, setEmail] = useState('');

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <CreativeHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />

      {heroArticle && !isFiltered && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
          <Link href={aHref(heroArticle.slug)} className="block">
            <div className="relative h-[60vh] sm:h-[70vh] min-h-[400px] rounded-2xl overflow-hidden group cursor-pointer">
              {heroArticle.article_type === 'video' ? (
                <VideoCardThumb videoUrl={heroArticle.video_url} />
              ) : heroArticle.cover_image_url ? (
                <Image
                  src={heroArticle.cover_image_url}
                  alt={heroArticle.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  priority
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-800 to-zinc-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
                <div className="flex items-center gap-3">
                  {heroArticle.category_name && (
                    <span
                      className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full text-zinc-950"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {heroArticle.category_name}
                    </span>
                  )}
                  <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-white border border-white/20">
                    {heroTitle}
                  </span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight mt-4 mb-4 max-w-3xl">
                  {heroArticle.title}
                </h1>
                <div className="flex items-center gap-4 text-white/60 text-sm flex-wrap">
                  {heroArticle.author_name && <span>{heroArticle.author_name}</span>}
                  {heroArticle.published_at && <span>{formatDate(heroArticle.published_at)}</span>}
                  {heroArticle.reading_time_minutes && (
                    <span>{heroArticle.reading_time_minutes} min read</span>
                  )}
                </div>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white hover:text-[var(--cp)] transition-colors">
                  Read Article →
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {articles.length === 0 ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="bg-zinc-950 rounded-2xl p-20 text-center">
            <p className="text-5xl font-black text-white mb-4">No articles yet</p>
            <p className="text-zinc-500 text-lg">Check back soon for new creative work.</p>
          </div>
        </section>
      ) : (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          {isFiltered ? (
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                  {searchQuery ? `Results for "${searchQuery}"` : `Topic: ${currentCategory}`}
                </p>
                <p className="text-xs text-zinc-300 mt-1">{articles.length} articles</p>
              </div>
              <Link
                href={basePath}
                className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors border border-zinc-200 rounded-full px-4 py-2"
              >
                ← Back to all
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-8">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">{latestTitle}</p>
              <p className="text-xs text-zinc-300">{gridArticles.length} articles</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {gridArticles.map((a, i) => {
              const isWide = i % 7 === 0;
              const isPortrait = i % 2 === 0;
              const aspectClass = isWide
                ? 'aspect-[16/7]'
                : isPortrait
                ? 'aspect-[3/4]'
                : 'aspect-[4/3]';
              return (
                <Link
                  key={a.id}
                  href={aHref(a.slug)}
                  className={`group relative rounded-xl overflow-hidden cursor-pointer block ${isWide ? 'sm:col-span-2' : ''} ${aspectClass}`}
                >
                  {a.article_type === 'video' ? (
                    <VideoCardThumb videoUrl={a.video_url} />
                  ) : a.cover_image_url ? (
                    <Image
                      src={a.cover_image_url}
                      alt={a.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[i % 6]}`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/0 group-hover:from-black/80 transition-colors duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    {a.category_name && (
                      <span
                        className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-2 text-zinc-950 inline-block"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {a.category_name}
                      </span>
                    )}
                    <p className="text-base sm:text-lg font-black text-white leading-tight line-clamp-2">
                      {a.title}
                    </p>
                    <p className="text-white/50 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {a.author_name && <span>{a.author_name}</span>}
                      {a.author_name && a.published_at && <span> · </span>}
                      {a.published_at && <span>{formatDate(a.published_at)}</span>}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {!isFiltered && categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 border-t border-zinc-100">
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-400 shrink-0 mr-3">
              Topics:
            </span>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`${basePath}/categories/${cat.slug}`}
                className="shrink-0 px-5 py-2.5 rounded-full border border-zinc-200 text-sm font-bold text-zinc-700 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {!isFiltered && showNewsletter && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="bg-zinc-950 rounded-2xl px-8 sm:px-16 py-16 text-center">
            <p className="text-4xl font-black text-white mb-2">{newsletterTitle}</p>
            <p className="text-zinc-400 text-base mb-8 max-w-md mx-auto">
              {newsletterDesc}
            </p>
            <form
              className="flex max-w-sm mx-auto gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setEmail('');
              }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={newsletterPlaceholder}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-[var(--cp)]"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-xl font-black text-sm text-zinc-950 hover:opacity-90 transition-opacity shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {newsletterBtn}
              </button>
            </form>
          </div>
        </section>
      )}

      <div className="py-6" />

      <CreativeFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
    </div>
  );
}
