'use client';

import { useCallback, type CSSProperties } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { TrendingUp, BookOpen, Hash, ChevronRight, ArrowRight } from 'lucide-react';

import type { HomeProps } from '../ThemeRenderer';
import {
  CorporateHeader, CorporateFooter, NewsletterSection,
  CardHero, CardSide, CardMedium, CardCompact,
} from './shared';
import { AdRotator } from '../shared/AdRotator';

export default function CorporateHome({
  blog, articles, categories, currentCategory, searchQuery, getArticleHref, previewSlug,
}: HomeProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('publicBlog');

  const primaryColor = blog.primary_color || '#2563eb';
  const homeConfig = blog.template_config?.home;
  const legacyContent = blog.template_config?.content;
  const isFiltered = !!(searchQuery || currentCategory);
  const isPreview = !!(previewSlug || blog.slug === 'demo');

  // For preview: /en/template. For real blog: /{locale}/{slug}
  const basePath = isPreview ? '/en/template' : `/${locale}/${blog.slug}`;

  const aHref = useCallback(
    (articleSlug: string) => {
      if (getArticleHref) return getArticleHref(articleSlug);
      if (previewSlug) return `/en/template/${articleSlug}?preview=${previewSlug}`;
      return `/${locale}/${blog.slug}/${articleSlug}`;
    },
    [getArticleHref, previewSlug, locale, blog.slug],
  );

  const featuredTitle = homeConfig?.hero?.sectionTitle || legacyContent?.featuredSectionTitle || t('featuredNews');
  const latestTitle = homeConfig?.latest?.sectionTitle || legacyContent?.latestSectionTitle || t('noArticles').split(' ')[0];
  const newsletterTitle = homeConfig?.newsletter?.title || legacyContent?.newsletterTitle;
  const newsletterDesc = homeConfig?.newsletter?.description || legacyContent?.newsletterDescription;

  const showHero = homeConfig?.hero?.enabled !== false;
  const showNewsletter = homeConfig?.newsletter?.enabled !== false;
  const showLatest = homeConfig?.latest?.enabled !== false;
  const showCategoriesStrip = homeConfig?.categoriesStrip?.enabled !== false;

  const featuredHero = !isFiltered && showHero ? articles[0] : undefined;
  const featuredSide = !isFiltered && showHero ? articles.slice(1, 3) : [];
  const latestArticles = !isFiltered && showHero ? articles.slice(3) : articles;
  const sidebarPopular = articles.slice(0, 5);
  const tags = Array.from(new Set(articles.flatMap(a => a.tags ?? []))).slice(0, 16);

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900"
      style={{
        '--cp': primaryColor,
        fontFamily: blog.font_family ? `'${blog.font_family}', system-ui, sans-serif` : 'system-ui, -apple-system, sans-serif',
      } as CSSProperties}
    >
      <CorporateHeader
        blog={blog}
        categories={categories}
        current={currentCategory}
        searchQuery={searchQuery}
        primaryColor={primaryColor}
        basePath={basePath}
        previewSlug={previewSlug}
      />

      {/* ── FILTERED / SEARCH VIEW ─────────────────────────────────────────── */}
      {isFiltered ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center gap-4 mb-10">
            <Link href={basePath}
              className="h-9 w-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:border-[var(--cp)] hover:text-[var(--cp)] transition-all">
              <ChevronRight className="h-4 w-4 rotate-180" />
            </Link>
            <div>
              {searchQuery ? (
                <>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{t('searchResults')}</p>
                  <h1 className="text-2xl font-black">« {searchQuery} »</h1>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{t('categoryLabel')}</p>
                  <h1 className="text-2xl font-black">{categories.find(c => c.slug === currentCategory)?.name ?? currentCategory}</h1>
                </>
              )}
              <p className="text-sm text-slate-400 mt-0.5">
                {articles.length} {articles.length !== 1 ? t('articleCountPlural', { count: '' }).replace('{count} ', '') : t('articleCount', { count: '' }).replace('{count} ', '')}
              </p>
            </div>
          </div>

          {articles.length === 0 ? (
            <div className="py-32 text-center">
              <BookOpen className="h-14 w-14 mx-auto mb-5 text-slate-200" />
              <p className="text-xl font-bold text-slate-400 mb-2">{t('noArticlesFound')}</p>
              <Link href={basePath} className="inline-flex items-center gap-2 text-sm font-semibold hover:underline" style={{ color: primaryColor }}>
                <ArrowRight className="h-4 w-4 rotate-180" /> {t('backToHome')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map(a => <CardMedium key={a.id} article={a} href={aHref(a.slug)} />)}
            </div>
          )}
        </main>
      ) : (

        /* ── HOME VIEW ─────────────────────────────────────────────────────── */
        <>
          {articles.length === 0 ? (
            <div className="max-w-7xl mx-auto px-4 py-40 text-center">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-slate-100 mb-6">
                <BookOpen className="h-10 w-10 text-slate-300" />
              </div>
              <h2 className="text-2xl font-black text-slate-400 mb-2">{t('noArticles')}</h2>
              <p className="text-slate-400">{t('noArticlesDesc')}</p>
            </div>
          ) : (
            <>
              {/* ── HERO ──────────────────────────────────────────────────── */}
              {featuredHero && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-2">
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>
                      {featuredTitle}
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-5">
                    {/* Main hero card — 3/5 */}
                    <div className="lg:col-span-3">
                      <CardHero article={featuredHero} href={aHref(featuredHero.slug)} />
                    </div>
                    {/* Side cards — 2/5 */}
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-5">
                      {featuredSide.map(a => (
                        <CardSide key={a.id} article={a} href={aHref(a.slug)} />
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* ── CATEGORIES STRIP ──────────────────────────────────────── */}
              {showCategoriesStrip && categories.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0 mr-3">{t('explore')}</span>
                    {categories.map(c => (
                      <Link key={c.slug} href={`?category=${c.slug}`}
                        className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:border-[var(--cp)] hover:text-[var(--cp)] transition-all shadow-sm whitespace-nowrap">
                        {c.name}
                        <span className="text-xs text-slate-400">{c.articles_count}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* ── NEWSLETTER ────────────────────────────────────────────── */}
              {showNewsletter && (
              <NewsletterSection
                blog={blog}
                primaryColor={primaryColor}
                title={newsletterTitle}
                description={newsletterDesc}
              />
              )}

              {/* ── LATEST ARTICLES + SIDEBAR ─────────────────────────────── */}
              {showLatest && latestArticles.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* Article grid — 2/3 */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-3 mb-8">
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">
                          {latestTitle}
                        </h2>
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-xs text-slate-400 shrink-0">{latestArticles.length} articles</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {latestArticles.map(a => <CardMedium key={a.id} article={a} href={aHref(a.slug)} />)}
                      </div>
                    </div>

                    {/* Sidebar — 1/3 */}
                    <aside className="space-y-7">

                      {/* Popular articles */}
                      {sidebarPopular.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                          <div className="flex items-center gap-2 mb-5">
                            <TrendingUp className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700">{t('popularArticles')}</h3>
                          </div>
                          {sidebarPopular.map((a, i) => (
                            <CardCompact key={a.id} article={a} href={aHref(a.slug)} rank={i + 1} />
                          ))}
                        </div>
                      )}

                      {/* Categories */}
                      {categories.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                          <div className="flex items-center gap-2 mb-5">
                            <BookOpen className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700">{t('categories')}</h3>
                          </div>
                          <div className="space-y-0.5">
                            {categories.map(c => (
                              <Link key={c.slug} href={`?category=${c.slug}`}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                  currentCategory === c.slug
                                    ? 'text-white font-bold'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                                style={currentCategory === c.slug ? { backgroundColor: primaryColor } : {}}>
                                <span>{c.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-lg ${currentCategory === c.slug ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                  {c.articles_count}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {tags.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                          <div className="flex items-center gap-2 mb-5">
                            <Hash className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700">{t('tagsLabel')}</h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {tags.map(tag => (
                              <Link key={tag} href={`?q=${encodeURIComponent(tag)}`}
                                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:border-[var(--cp)] hover:text-[var(--cp)] transition-colors bg-slate-50">
                                #{tag}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ad rotator */}
                      {!isPreview && (
                        <AdRotator slug={blog.slug} primaryColor={primaryColor} />
                      )}

                      {/* Newsletter mini */}
                      <div className="rounded-2xl p-6 text-white" style={{ backgroundColor: primaryColor }}>
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/20 mb-4">
                          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="font-black text-lg mb-2 leading-tight">{t('joinCommunity')}</h3>
                        <p className="text-white/80 text-sm leading-relaxed mb-4">
                          {t('subscribeDesc')}
                        </p>
                        <a href="#newsletter"
                          className="flex items-center justify-center gap-2 h-10 w-full rounded-xl bg-white font-bold text-sm hover:bg-white/90 transition-colors"
                          style={{ color: primaryColor }}>
                          {t('subscribeFree')}
                        </a>
                      </div>
                    </aside>
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}

      <CorporateFooter blog={blog} categories={categories} primaryColor={primaryColor} basePath={basePath} previewSlug={previewSlug} />
    </div>
  );
}
