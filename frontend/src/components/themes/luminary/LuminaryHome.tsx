'use client';
import { useState, useCallback, type CSSProperties, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, ChevronRight } from 'lucide-react';
import type { HomeProps } from '../ThemeRenderer';
import type { PublicArticle, PublicCategory } from '@/lib/public-api';
import { LuminaryHeader, LuminaryFooter } from './LuminaryShared';
import { AdRotator } from '../shared/AdRotator';
import { VideoCardThumb } from '../shared/VideoCardThumb';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.smarterbloggers.com';

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

function shortDate(d: string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function padNum(n: number): string {
  return String(n).padStart(2, '0');
}

interface ArticleRowProps {
  article: PublicArticle;
  index: number;
  href: string;
  primaryColor: string;
}

function ArticleRow({ article, index, href, primaryColor }: ArticleRowProps) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-6 py-5 border-b border-zinc-100 hover:bg-[#f0ede6] transition-colors px-4 -mx-4"
    >
      <span className="font-mono text-xs text-zinc-300 pt-1 shrink-0 w-6">{padNum(index + 1)}</span>
      <div className="flex-1 min-w-0">
        <h3 className="font-serif text-lg text-zinc-900 leading-snug mb-1 group-hover:text-[var(--cp)] transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="font-sans text-xs text-zinc-400">
          {article.author_name && <span>{article.author_name} &middot; </span>}
          {article.category_name && <span>{article.category_name} &middot; </span>}
          {article.reading_time_minutes && <span>{article.reading_time_minutes} min read</span>}
        </p>
      </div>
      <ChevronRight
        className="h-4 w-4 text-zinc-300 group-hover:text-[var(--cp)] transition-colors shrink-0 mt-1.5 opacity-0 group-hover:opacity-100"
      />
    </Link>
  );
}

interface DepartmentCardProps {
  article: PublicArticle;
  href: string;
  primaryColor: string;
}

function DepartmentCard({ article, href, primaryColor }: DepartmentCardProps) {
  return (
    <Link href={href} className="group flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden mb-4">
        {article.article_type === 'video' ? (
          <VideoCardThumb videoUrl={article.video_url} coverImageUrl={article.cover_image_url} />
        ) : article.cover_image_url ? (
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
      <h3 className="font-serif text-base text-zinc-900 leading-snug mb-2 line-clamp-2 group-hover:text-[var(--cp)] transition-colors">
        {article.title}
      </h3>
      <p className="font-sans text-xs text-zinc-400 mt-auto">
        {article.author_name && <span>{article.author_name} &middot; </span>}
        {shortDate(article.published_at)}
      </p>
    </Link>
  );
}

export default function LuminaryHome({
  blog,
  articles,
  categories,
  currentCategory,
  searchQuery,
  getArticleHref,
  previewSlug,
  basePath: baseProp,
}: HomeProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const basePath = baseProp !== undefined
    ? baseProp
    : previewSlug
      ? `/en/template?preview=${previewSlug}`
      : `/${locale}/${blog.slug}`;
  const primaryColor = blog.primary_color || '#b8960c';

  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [topAdId, setTopAdId] = useState<string | null>(null);

  const aHref = useCallback(
    (articleSlug: string) => {
      if (getArticleHref) return getArticleHref(articleSlug);
      if (previewSlug) return `/en/template/${articleSlug}?preview=${previewSlug}`;
      return `${basePath}/${articleSlug}`;
    },
    [getArticleHref, previewSlug, basePath],
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
  const heroTitle = homeCfg?.hero?.sectionTitle || 'Featured';
  const showNewsletter = homeCfg?.newsletter?.enabled !== false;
  const newsletterTitle = homeCfg?.newsletter?.title || 'Stay well-read.';
  const newsletterDesc = homeCfg?.newsletter?.description || `Thoughtful stories from ${blog.name}, delivered to your inbox. No noise, no filler.`;
  const newsletterBtn = homeCfg?.newsletter?.buttonLabel || 'Subscribe';
  const newsletterPlaceholder = homeCfg?.newsletter?.placeholder || 'your@email.com';
  const newsletterDisclaimer = homeCfg?.newsletter?.disclaimer || 'No spam. Unsubscribe anytime.';
  const showLatest = homeCfg?.latest?.enabled !== false;
  const latestTitle = homeCfg?.latest?.sectionTitle || 'Latest';

  const isFiltered = !!(currentCategory || searchQuery);
  const filteredCategory = categories.find(c => c.slug === currentCategory);
  const coverArticle = !isFiltered && showHero && articles.length > 0 ? articles[0] : null;
  const remainingArticles = isFiltered ? articles : (showHero ? articles.slice(1) : articles);

  const articlesByCategory: Record<string, { category: PublicCategory; articles: PublicArticle[] }> = {};
  if (!isFiltered) {
    for (const cat of categories) {
      const catArticles = remainingArticles.filter(a => a.category_slug === cat.slug).slice(0, 3);
      if (catArticles.length >= 1) {
        articlesByCategory[cat.slug] = { category: cat, articles: catArticles };
      }
    }
  }

  const uncategorised = remainingArticles.filter(a => !a.category_slug || !articlesByCategory[a.category_slug]);

  return (
    <div
      className="bg-[#faf8f4] min-h-screen text-zinc-900"
      style={{ '--cp': primaryColor } as CSSProperties}
    >
      <LuminaryHeader
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />

      {coverArticle && (
        <section className="relative w-full h-[70vh] min-h-[420px]">
          {coverArticle.article_type === 'video' ? (
            <VideoCardThumb videoUrl={coverArticle.video_url} coverImageUrl={coverArticle.cover_image_url} />
          ) : coverArticle.cover_image_url ? (
            <Image
              src={coverArticle.cover_image_url}
              alt={coverArticle.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${grad(coverArticle.id)}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-6 sm:px-10 pb-10 sm:pb-14">
            <div className="max-w-3xl">
              {coverArticle.category_name && (
                <p
                  className="font-serif italic text-lg mb-3"
                  style={{ color: primaryColor }}
                >
                  {coverArticle.category_name}
                </p>
              )}
              <Link href={aHref(coverArticle.slug)}>
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-tight text-white mb-4 hover:opacity-90 transition-opacity">
                  {coverArticle.title}
                </h1>
              </Link>
              {coverArticle.excerpt && (
                <p className="font-serif italic text-lg text-white/80 mb-5 line-clamp-2">
                  {coverArticle.excerpt}
                </p>
              )}
              <p className="font-sans text-xs uppercase tracking-widest text-white/60">
                {coverArticle.author_name && <span>{coverArticle.author_name} &middot; </span>}
                {shortDate(coverArticle.published_at)}
                {coverArticle.reading_time_minutes && (
                  <span> &middot; {coverArticle.reading_time_minutes} min read</span>
                )}
              </p>
            </div>
          </div>
        </section>
      )}

      {!previewSlug && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <AdRotator slug={blog.slug} primaryColor={primaryColor} onAdLoaded={setTopAdId} />
        </div>
      )}

      {isFiltered && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-4">
          <Link
            href={basePath || "/"}
            className="font-sans text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors inline-flex items-center gap-1 mb-8"
          >
            &larr; All Stories
          </Link>
          <h2 className="font-serif text-4xl text-zinc-900 mb-2">
            {filteredCategory?.name ?? searchQuery ?? 'Results'}
          </h2>
          <p className="font-sans text-sm text-zinc-400 mb-8">
            {articles.length} article{articles.length !== 1 ? 's' : ''} found
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map(a => (
              <DepartmentCard
                key={a.id}
                article={a}
                href={aHref(a.slug)}
                primaryColor={primaryColor}
              />
            ))}
          </div>
        </div>
      )}

      {!isFiltered && articles.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-32 text-center">
          <p className="font-serif italic text-3xl text-zinc-300 mb-4">No stories yet.</p>
          <p className="font-sans text-sm text-zinc-400">Check back soon.</p>
        </div>
      )}

      {!isFiltered && articles.length > 0 && (
        <>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-zinc-300" />
              <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-400 whitespace-nowrap">
                In This Issue
              </span>
              <div className="flex-1 h-px bg-zinc-300" />
            </div>

            <div className="max-w-2xl mx-auto">
              {articles.slice(1, 8).map((a, i) => (
                <ArticleRow
                  key={a.id}
                  article={a}
                  index={i}
                  href={aHref(a.slug)}
                  primaryColor={primaryColor}
                />
              ))}
            </div>

            {articles.length > 8 && (
              <div className="text-center mt-8">
                <Link
                  href={basePath || "/"}
                  className="font-sans text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors inline-flex items-center gap-2"
                >
                  View all stories <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </section>

          {Object.values(articlesByCategory).map(({ category, articles: catArts }) => (
            <section key={category.id} className="py-12 border-t border-zinc-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center gap-4 mb-10">
                  <div className="flex-1 h-px bg-zinc-300" />
                  <Link
                    href={`${basePath}/categories/${category.slug}`}
                    className="font-sans text-xs uppercase tracking-[0.25em] text-zinc-900 hover:text-[var(--cp)] transition-colors whitespace-nowrap font-semibold"
                  >
                    {category.name}
                  </Link>
                  <div className="flex-1 h-px bg-zinc-300" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {catArts.map(a => (
                    <DepartmentCard
                      key={a.id}
                      article={a}
                      href={aHref(a.slug)}
                      primaryColor={primaryColor}
                    />
                  ))}
                </div>
                <div className="text-right mt-6">
                  <Link
                    href={`${basePath}/categories/${category.slug}`}
                    className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 hover:text-[var(--cp)] transition-colors inline-flex items-center gap-1.5"
                  >
                    More in {category.name} <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </section>
          ))}

          {uncategorised.length > 0 && Object.keys(articlesByCategory).length > 0 && (
            <section className="py-12 border-t border-zinc-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center gap-4 mb-10">
                  <div className="flex-1 h-px bg-zinc-300" />
                  <span className="font-sans text-xs uppercase tracking-[0.25em] text-zinc-900 whitespace-nowrap font-semibold">
                    More Reading
                  </span>
                  <div className="flex-1 h-px bg-zinc-300" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {uncategorised.slice(0, 6).map(a => (
                    <DepartmentCard
                      key={a.id}
                      article={a}
                      href={aHref(a.slug)}
                      primaryColor={primaryColor}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {showNewsletter && (
        <section id="newsletter" className="bg-zinc-950 py-24">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-4">Newsletter</p>
            <h2 className="font-serif italic text-4xl sm:text-5xl text-white mb-4">{newsletterTitle}</h2>
            <p className="font-sans text-sm text-zinc-400 mb-10 leading-relaxed">{newsletterDesc}</p>
            {subStatus === 'ok' ? (
              <p className="font-serif italic text-xl text-white">Thank you for subscribing.</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex items-end gap-0 max-w-sm mx-auto border-b border-zinc-600 pb-px">
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={newsletterPlaceholder}
                  className="flex-1 bg-transparent border-0 px-0 py-3 text-white placeholder:text-zinc-600 focus:outline-none text-sm min-w-0 font-sans" />
                <button type="submit" disabled={subStatus === 'loading'}
                  className="font-sans text-xs uppercase tracking-widest text-white hover:text-[var(--cp)] transition-colors shrink-0 pl-4 py-3 disabled:opacity-60">
                  {subStatus === 'loading' ? '…' : newsletterBtn}
                </button>
              </form>
            )}
            {subStatus === 'error' && <p className="font-sans text-xs text-red-400 mt-3">Something went wrong. Please try again.</p>}
            {newsletterDisclaimer && <p className="font-sans text-xs text-zinc-600 mt-6">{newsletterDisclaimer}</p>}
          </div>
        </section>
      )}

      {!previewSlug && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdRotator slug={blog.slug} primaryColor={primaryColor} variant="strip" excludeId={topAdId ?? undefined} />
        </div>
      )}

      <LuminaryFooter
        blog={blog}
        categories={categories}
        basePath={basePath}
        primaryColor={primaryColor}
      />
    </div>
  );
}
