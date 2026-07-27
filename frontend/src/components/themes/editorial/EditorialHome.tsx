'use client';
import { useState, useCallback, type CSSProperties, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, BookOpen, Clock } from 'lucide-react';
import type { HomeProps } from '../ThemeRenderer';
import { getFetchErrorMessage } from '@/lib/utils';
import { EditorialHeader, EditorialFooter } from './EditorialShared';
import { EditableSection } from '../shared/EditableSection';
import { InlineEditable } from '../shared/InlineEditable';
import { VideoCardThumb } from '../shared/VideoCardThumb';
import { ThemeSidebar } from '../shared/ThemeSidebar';

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

export default function EditorialHome({
  blog,
  articles,
  categories,
  currentCategory,
  searchQuery,
  getArticleHref,
  previewSlug,
  basePath: baseProp,
  editMode,
  selectedSectionId,
  onSectionClick,
  onSectionHover,
}: HomeProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('publicBlog');
  const basePath = baseProp !== undefined
    ? baseProp
    : previewSlug
      ? `/en/template?preview=${previewSlug}`
      : `/${locale}/${blog.slug}`;
  const primaryColor = blog.primary_color || '#18181b';

  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [subError, setSubError] = useState('');

  const aHref = useCallback(
    (s: string) => {
      if (getArticleHref) return getArticleHref(s);
      if (previewSlug) return `/en/template/${s}?preview=${previewSlug}`;
      return `${basePath}/${s}`;
    },
    [getArticleHref, previewSlug, basePath],
  );

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubStatus('loading');
    setSubError('');
    try {
      const res = await fetch(`/api/public-proxy/${blog.slug}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubStatus('ok');
      } else {
        setSubError(await getFetchErrorMessage(res, t('subscribeError')));
        setSubStatus('error');
      }
    } catch {
      setSubError(t('subscribeError'));
      setSubStatus('error');
    }
  };

  const homeCfg = blog.template_config?.home;
  const showHero = homeCfg?.hero?.enabled !== false;
  const heroTitle = homeCfg?.hero?.sectionTitle || t('featuredNews');
  const showLatest = homeCfg?.latest?.enabled !== false;
  const latestTitle = homeCfg?.latest?.sectionTitle || t('recentArticles');
  const showNewsletter = homeCfg?.newsletter?.enabled !== false;
  const newsletterTitle = homeCfg?.newsletter?.title || t('stayInformed');
  const newsletterDesc = homeCfg?.newsletter?.description || t('subscribeDesc');
  const newsletterBtn = homeCfg?.newsletter?.buttonLabel || t('subscribeButton');
  const newsletterPlaceholder = homeCfg?.newsletter?.placeholder || t('emailPlaceholder');
  const newsletterDisclaimer = homeCfg?.newsletter?.disclaimer || t('noSpam');
  const showCategoriesStrip = homeCfg?.categoriesStrip?.enabled !== false;
  const categoriesStripLabel = homeCfg?.categoriesStrip?.label || t('explore');

  const sidebarCfg = homeCfg?.sidebar;

  const editProps = { editMode, selectedSectionId, onSectionClick, onSectionHover };
  const isFiltered = !!(currentCategory || searchQuery);
  const filteredCategory = categories.find(c => c.slug === currentCategory);
  const featuredArticle = !isFiltered && showHero && articles.length > 0 ? articles[0] : null;
  const gridArticles = isFiltered ? articles : (showHero ? articles.slice(1) : articles);

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <EditableSection id="header" {...editProps}>
        <EditorialHeader
          blog={blog}
          categories={categories}
          basePath={basePath}
          primaryColor={primaryColor}
        />
      </EditableSection>

      {featuredArticle && (
        <EditableSection id="home.hero" {...editProps}>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-zinc-200" />
            <InlineEditable path="template_config.home.hero.sectionTitle" value={heroTitle} editMode={editMode} tag="span" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 whitespace-nowrap" />
            <div className="flex-1 h-px bg-zinc-200" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 overflow-hidden rounded-2xl border border-zinc-100 shadow-sm">
            <div className="relative h-72 sm:h-80 lg:h-[420px] lg:col-span-3">
              {featuredArticle.article_type === 'video' ? (
                <VideoCardThumb videoUrl={featuredArticle.video_url} coverImageUrl={featuredArticle.cover_image_url} />
              ) : featuredArticle.cover_image_url ? (
                <Image
                  src={featuredArticle.cover_image_url}
                  alt={featuredArticle.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center">
                  <span className="text-2xl font-bold text-zinc-400">{blog.name}</span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
              {featuredArticle.category_name && (
                <span className="absolute top-4 left-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {featuredArticle.category_name}
                </span>
              )}
            </div>

            <div className="lg:col-span-2 bg-white flex flex-col justify-center px-8 py-10">
              {featuredArticle.category_name && (
                <p
                  className="text-xs font-black uppercase tracking-widest mb-3"
                  style={{ color: primaryColor }}
                >
                  {featuredArticle.category_name}
                </p>
              )}
              <Link href={aHref(featuredArticle.slug)}>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 leading-snug mb-4 hover:underline underline-offset-4">
                  {featuredArticle.title}
                </h2>
              </Link>
              {featuredArticle.excerpt && (
                <p className="text-zinc-500 text-sm leading-relaxed mb-6 line-clamp-4">
                  {featuredArticle.excerpt}
                </p>
              )}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white bg-zinc-800 shrink-0">
                  {initials(featuredArticle.author_name)}
                </div>
                <div>
                  <p className="font-semibold text-sm text-zinc-900 leading-tight">
                    {featuredArticle.author_name || blog.name}
                  </p>
                  <p className="text-xs text-zinc-400">{formatDate(featuredArticle.published_at, locale)}</p>
                </div>
              </div>
              <Link
                href={aHref(featuredArticle.slug)}
                className="inline-flex items-center gap-2 mt-5 text-sm font-bold hover:gap-3 transition-all"
                style={{ color: primaryColor }}
              >
                {t('readMore')} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
        </EditableSection>
      )}

      {isFiltered && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
          <Link
            href={basePath || "/"}
            className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors inline-flex items-center gap-1 mb-6"
          >
            ← {t('backToHome')}
          </Link>
          <h2 className="text-3xl font-bold text-zinc-900 mb-2">
            {filteredCategory?.name ?? searchQuery ?? t('searchResults')}
          </h2>
          <p className="text-sm text-zinc-400">
            {articles.length} {articles.length !== 1 ? t('articleCountPlural', { count: '' }).replace('{count} ', '') : t('articleCount', { count: '' }).replace('{count} ', '')}
          </p>
        </div>
      )}

      {articles.length === 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24 text-center">
          <BookOpen className="h-14 w-14 mx-auto mb-5 text-zinc-200" />
          <p className="text-xl font-bold text-zinc-400 mb-2">{t('noArticles')}</p>
          <p className="text-sm text-zinc-400">{t('noArticlesDesc')}</p>
        </div>
      )}

      {articles.length > 0 && showLatest && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-14 mb-8 flex items-center gap-4">
          {isFiltered ? (
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-900 whitespace-nowrap">{t('searchResults')}</h2>
          ) : (
            <InlineEditable path="template_config.home.latest.sectionTitle" value={latestTitle} editMode={editMode} tag="h2" className="text-xs font-black uppercase tracking-widest text-zinc-900 whitespace-nowrap" />
          )}
          <div className="flex-1 h-px bg-zinc-200" />
          <span className="text-xs text-zinc-400">{gridArticles.length !== 1 ? t('articleCountPlural', { count: gridArticles.length }) : t('articleCount', { count: gridArticles.length })}</span>
        </div>
      )}

      {gridArticles.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex gap-10 items-start">
            {/* Article grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-8">
          {gridArticles.map((a, i) => (
            <Link key={a.id} href={aHref(a.slug)} className="group flex flex-col">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4 ring-0 group-hover:ring-2 transition-all ring-offset-2 ring-[var(--cp)]">
                {a.article_type === 'video' ? (
                  <VideoCardThumb videoUrl={a.video_url} coverImageUrl={a.cover_image_url} />
                ) : a.cover_image_url ? (
                  <Image
                    src={a.cover_image_url}
                    alt={a.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${cardGradients[i % cardGradients.length]}`}
                  />
                )}
                {a.category_name && (
                  <span className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/90 text-zinc-700">
                    {a.category_name}
                  </span>
                )}
              </div>

              {!a.cover_image_url && a.category_name && (
                <p
                  className="text-[10px] font-black uppercase tracking-wider mb-1.5"
                  style={{ color: primaryColor }}
                >
                  {a.category_name}
                </p>
              )}

              <h3 className="text-base font-bold text-zinc-900 leading-snug mb-2 line-clamp-2 group-hover:text-[var(--cp)] transition-colors">
                {a.title}
              </h3>
              {a.excerpt && (
                <p className="text-sm text-zinc-500 leading-relaxed mb-4 line-clamp-2">{a.excerpt}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-auto pt-2 border-t border-zinc-100 flex-wrap">
                {a.author_name && <span>{a.author_name}</span>}
                {a.author_name && <span>·</span>}
                <span>{formatDate(a.published_at, locale)}</span>
                {a.reading_time_minutes && (
                  <>
                    <span>·</span>
                    <Clock className="h-3 w-3" />
                    <span>{t('minRead', { min: a.reading_time_minutes })}</span>
                  </>
                )}
              </div>
            </Link>
          ))}
            </div>
            {/* Sidebar */}
            <div className="hidden lg:block w-72 shrink-0">
              <ThemeSidebar
                blog={blog}
                articles={articles}
                categories={categories}
                config={sidebarCfg}
                getArticleHref={aHref}
                isPreview={!!previewSlug}
                locale={locale}
                basePath={basePath}
              />
            </div>
          </div>
        </div>
      )}

      {showNewsletter && (
        <EditableSection id="home.newsletter" {...editProps}>
        <div id="newsletter" className="max-w-6xl mx-auto px-4 sm:px-6 mt-16 mb-4">
          <div className="bg-zinc-950 rounded-3xl px-6 sm:px-16 py-16 text-center">
            <InlineEditable path="template_config.home.newsletter.title" value={newsletterTitle} editMode={editMode} tag="h2" className="text-3xl font-bold text-white mb-3" />
            <InlineEditable path="template_config.home.newsletter.description" value={newsletterDesc} editMode={editMode} tag="p" className="text-zinc-400 text-base mb-8 max-w-md mx-auto" multiline />
            {subStatus === 'ok' ? (
              <p className="text-sm font-medium text-emerald-400">{t('subscribeSuccess')}</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex max-w-md mx-auto gap-0">
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={newsletterPlaceholder}
                  className="flex-1 bg-zinc-800 border-0 rounded-l-2xl px-5 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 text-sm min-w-0" />
                <button type="submit" disabled={subStatus === 'loading'}
                  className="px-6 py-3.5 rounded-r-2xl font-bold text-sm bg-white hover:bg-zinc-100 transition-colors disabled:opacity-60 shrink-0"
                  style={{ color: primaryColor }}>
                  {subStatus === 'loading' ? '…' : newsletterBtn}
                </button>
              </form>
            )}
            {subStatus === 'error' && <p className="text-xs text-red-400 mt-3">{subError}</p>}
            {newsletterDisclaimer && <p className="text-xs text-zinc-600 mt-4">{newsletterDisclaimer}</p>}
          </div>
        </div>
        </EditableSection>
      )}

      {showCategoriesStrip && categories.length > 0 && (
        <EditableSection id="home.categories" {...editProps}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-5">
            {categoriesStripLabel}
          </p>
          <div className="flex flex-wrap gap-3">
            {categories.map(c => (
              <Link
                key={c.id}
                href={`${basePath}/categories/${c.slug}`}
                className="border border-zinc-200 rounded-full px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all duration-200"
              >
                {c.name} ({c.articles_count})
              </Link>
            ))}
          </div>
        </div>
        </EditableSection>
      )}

      <EditableSection id="footer" {...editProps}>
        <EditorialFooter
          blog={blog}
          categories={categories}
          basePath={basePath}
          primaryColor={primaryColor}
        />
      </EditableSection>
    </div>
  );
}
