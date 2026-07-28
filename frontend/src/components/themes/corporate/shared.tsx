'use client';
import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  Search, Menu, X, Clock, Calendar, Mail,
  Facebook, Twitter, Instagram, Youtube, Linkedin, Rss, ChevronRight,
} from 'lucide-react';
import type { PublicArticle, PublicCategory } from '@/lib/public-api';
import { getFetchErrorMessage } from '@/lib/utils';
import { VideoCardThumb } from '../shared/VideoCardThumb';
import { ShareButtons } from '../shared/ShareButtons';
import { InlineEditable } from '../shared/InlineEditable';
import { BlogLanguageSwitcher } from '../shared/BlogLanguageSwitcher';
import { MobileBottomNav } from '../shared/MobileBottomNav';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fmtDate(iso: string | null, locale = 'fr') {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function fmtDateShort(iso: string | null, locale = 'fr') {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short' });
}

const GRADS = [
  'from-violet-500 to-purple-800',
  'from-rose-500 to-pink-800',
  'from-blue-500 to-indigo-800',
  'from-emerald-500 to-teal-800',
  'from-amber-500 to-orange-700',
  'from-cyan-500 to-sky-700',
  'from-fuchsia-500 to-purple-700',
  'from-lime-500 to-green-700',
];

export function grad(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return GRADS[Math.abs(h) % GRADS.length];
}

// ─── Cards ────────────────────────────────────────────────────────────────────

export function CardHero({ article, href }: { article: PublicArticle; href: string }) {
  const [err, setErr] = useState(false);
  const hasImg = !!article.cover_image_url && !err;
  const isVideo = article.article_type === 'video';
  return (
    <Link href={href} className="group relative flex flex-col rounded-3xl overflow-hidden bg-slate-900 min-h-[480px] lg:min-h-[540px]">
      {isVideo ? (
        <VideoCardThumb videoUrl={article.video_url} coverImageUrl={article.cover_image_url} />
      ) : hasImg ? (
        <Image src={article.cover_image_url!} alt={article.title} fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          onError={() => setErr(true)} sizes="60vw" priority />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${grad(article.id)}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />
      <div className="relative mt-auto p-7 sm:p-10">
        <div className="flex items-center gap-3 mb-4">
          {article.category_name && (
            <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl text-white" style={{ backgroundColor: 'var(--cp)' }}>
              {article.category_name}
            </span>
          )}
          {article.is_paid && (
            <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-amber-400 text-amber-900">Premium</span>
          )}
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight mb-4 group-hover:text-[var(--cp)] transition-colors duration-300">
          {article.title}
        </h2>
        {article.excerpt && (
          <p className="text-white/70 text-base leading-relaxed mb-5 line-clamp-2">{article.excerpt}</p>
        )}
        <div className="flex items-center gap-4 text-white/50 text-sm flex-wrap">
          {article.author_name && <span className="text-white/80 font-semibold">{article.author_name}</span>}
          {article.author_name && <span>·</span>}
          <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{fmtDate(article.published_at)}</span>
          {article.reading_time_minutes && (
            <><span>·</span><span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{article.reading_time_minutes} min</span></>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CardSide({ article, href }: { article: PublicArticle; href: string }) {
  const [err, setErr] = useState(false);
  const hasImg = !!article.cover_image_url && !err;
  const isVideo = article.article_type === 'video';
  return (
    <Link href={href} className="group relative rounded-2xl overflow-hidden flex flex-col min-h-[220px] bg-slate-800">
      {isVideo ? (
        <VideoCardThumb videoUrl={article.video_url} coverImageUrl={article.cover_image_url} />
      ) : hasImg ? (
        <Image src={article.cover_image_url!} alt={article.title} fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => setErr(true)} sizes="30vw" />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${grad(article.id)}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="relative mt-auto p-5">
        {article.category_name && (
          <span className="text-[10px] font-black uppercase tracking-wider text-white/70 block mb-1.5">{article.category_name}</span>
        )}
        <h3 className="font-bold text-white leading-snug line-clamp-2 group-hover:text-[var(--cp)] transition-colors">
          {article.title}
        </h3>
        <p className="text-white/50 text-xs mt-2">{fmtDateShort(article.published_at)}</p>
      </div>
    </Link>
  );
}

export function CardMedium({ article, href }: { article: PublicArticle; href: string }) {
  const [err, setErr] = useState(false);
  const hasImg = !!article.cover_image_url && !err;
  const isVideo = article.article_type === 'video';
  return (
    <Link href={href} className="group flex flex-col rounded-2xl overflow-hidden border border-slate-100 bg-white hover:shadow-xl hover:border-[var(--cp)]/20 transition-all duration-300">
      <div className="relative aspect-[16/9] overflow-hidden">
        {isVideo ? (
          <VideoCardThumb videoUrl={article.video_url} coverImageUrl={article.cover_image_url} />
        ) : hasImg ? (
          <Image src={article.cover_image_url!} alt={article.title} fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setErr(true)} sizes="(max-width:768px) 100vw, 33vw" />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${grad(article.id)}`} />
        )}
        {article.category_name && (
          <span className="absolute bottom-3 left-3 text-[10px] font-black uppercase tracking-wider bg-black/60 text-white px-2.5 py-1 rounded-lg backdrop-blur-sm">
            {article.category_name}
          </span>
        )}
        {article.is_paid && (
          <span className="absolute top-3 right-3 text-[10px] font-black bg-amber-400 text-amber-900 px-2.5 py-1 rounded-lg">Premium</span>
        )}
      </div>
      <div className="flex-1 flex flex-col p-5">
        <h3 className="font-bold text-slate-900 leading-snug group-hover:text-[var(--cp)] transition-colors line-clamp-2 mb-2 flex-1">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-3">{article.excerpt}</p>
        )}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-50 text-xs text-slate-400 flex-wrap">
          {article.author_name && <span className="font-medium text-slate-600">{article.author_name}</span>}
          {article.author_name && <span>·</span>}
          <span>{fmtDateShort(article.published_at)}</span>
          {article.reading_time_minutes && (
            <span className="ml-auto flex items-center gap-1"><Clock className="h-3 w-3" />{article.reading_time_minutes} min</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CardCompact({ article, href, rank }: { article: PublicArticle; href: string; rank?: number }) {
  const [err, setErr] = useState(false);
  const hasImg = !!article.cover_image_url && !err;
  const isVideo = article.article_type === 'video';
  return (
    <Link href={href} className="group flex gap-4 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors">
      {rank !== undefined && (
        <span className="text-2xl font-black text-slate-100 w-7 shrink-0 leading-none mt-1 select-none">{rank}</span>
      )}
      <div className="relative shrink-0 w-20 h-16 rounded-xl overflow-hidden bg-slate-100">
        {isVideo ? (
          <VideoCardThumb videoUrl={article.video_url} coverImageUrl={article.cover_image_url} />
        ) : hasImg ? (
          <Image src={article.cover_image_url!} alt={article.title} fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            onError={() => setErr(true)} sizes="80px" />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${grad(article.id)}`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        {article.category_name && (
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--cp)]">{article.category_name}</span>
        )}
        <h4 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-[var(--cp)] transition-colors mt-0.5">
          {article.title}
        </h4>
        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
          {article.reading_time_minutes && <><Clock className="h-2.5 w-2.5" />{article.reading_time_minutes} min · </>}
          {fmtDateShort(article.published_at)}
        </p>
      </div>
    </Link>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function CorporateHeader({
  blog, categories, current, searchQuery, primaryColor, minimal = false, basePath, previewSlug,
}: {
  blog: { name: string; logo_url?: string | null; language?: string; enabled_languages?: string[]; social_links?: Record<string, string>; template_config?: { header?: { topBar?: { enabled?: boolean; showDate?: boolean; showSocial?: boolean; showNewsletter?: boolean; showRss?: boolean }; subscribe?: { enabled?: boolean; label?: string }; nav?: { links?: { label: string; url: string }[] } } } | null };
  categories: PublicCategory[];
  current?: string;
  searchQuery?: string;
  primaryColor: string;
  minimal?: boolean;
  basePath?: string;
  previewSlug?: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('publicBlog');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [q, setQ] = useState(searchQuery ?? '');

  const headerConfig = blog.template_config?.header;
  const topBar = headerConfig?.topBar;
  const subscribeConfig = headerConfig?.subscribe;
  const customNavLinks = headerConfig?.nav?.links ?? [];

  // Appends ?preview=slug to internal links when in preview mode
  const pq = previewSlug ? `?preview=${previewSlug}` : '';

  const homeHref = (basePath ?? '/') + pq || '/';
  const catBasePath = basePath != null ? `${basePath}/categories` : null;

  const defaultPageLinks = basePath != null
    ? [
        { href: (basePath || '/') + pq, label: t('navHome') },
        { href: `${basePath}/about${pq}`, label: t('navAbout') },
        { href: `${basePath}/contact${pq}`, label: t('navContact') },
      ]
    : [];

  // Resolve a stored nav URL against basePath.
  // Stored URLs often contain a bare locale prefix (e.g. /en, /en/about) but no blog slug.
  // Strip that prefix first so /en/about → /about → basePath/about.
  const resolveNavHref = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (basePath == null) return url;
    // Strip leading /{locale} or /{locale-REGION}  e.g. /en, /fr, /en-US
    const withoutLocale = url.replace(/^\/[a-z]{2}(?:-[A-Z]{2})?(\/|$)/, '$1') || '/';
    if (withoutLocale === '/') return (basePath || '/') + pq;
    return basePath + withoutLocale + pq;
  };

  const pageLinks = customNavLinks.length > 0
    ? customNavLinks.map(l => ({ href: resolveNavHref(l.url), label: l.label }))
    : defaultPageLinks;
  // Le tiroir mobile n'a pas besoin de "Home" — déjà dans la bottom nav.
  const drawerPageLinks = pageLinks.filter(l => l.href !== homeHref);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) { router.push(`?q=${encodeURIComponent(q.trim())}`); setSearchOpen(false); }
  };

  const socialIcons: Record<string, ReactNode> = {
    facebook: <Facebook className="h-3.5 w-3.5" />,
    twitter: <Twitter className="h-3.5 w-3.5" />,
    instagram: <Instagram className="h-3.5 w-3.5" />,
    youtube: <Youtube className="h-3.5 w-3.5" />,
    linkedin: <Linkedin className="h-3.5 w-3.5" />,
  };

  const showTopBar = topBar?.enabled !== false;
  const showDate = topBar?.showDate !== false;
  const showSocialInTopBar = topBar?.showSocial !== false;
  const showNewsletterLink = topBar?.showNewsletter !== false;
  const showRssLink = topBar?.showRss !== false;
  const subscribeEnabled = subscribeConfig?.enabled !== false;
  const subscribeLabel = subscribeConfig?.label || "S'abonner";

  return (
    <>
      {/* Top bar */}
      {showTopBar && (
        <div className="bg-slate-900 border-b border-white/5 text-white hidden md:block">
          <div className="max-w-7xl mx-auto px-6 h-9 flex items-center justify-between text-xs">
            {showDate && (
              <p className="text-slate-500">
                {new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            <div className="flex items-center gap-5 ml-auto">
              {showSocialInTopBar && Object.entries(blog.social_links ?? {}).filter(([, u]) => !!u).slice(0, 5).map(([net, url]) => (
                <a key={net} href={url} target="_blank" rel="noopener noreferrer"
                  className="text-slate-500 hover:text-white transition-colors">
                  {socialIcons[net] ?? <span className="capitalize text-[10px]">{net}</span>}
                </a>
              ))}
              {showSocialInTopBar && Object.keys(blog.social_links ?? {}).filter(k => !!(blog.social_links as any)[k]).length > 0 && (
                <div className="h-3 w-px bg-white/10" />
              )}
              {showNewsletterLink && (
                <a href="#newsletter" className="font-semibold hover:underline" style={{ color: primaryColor }}>Newsletter</a>
              )}
              {showRssLink && (
                <a href="/rss.xml" className="text-slate-500 hover:text-white transition-colors flex items-center gap-1">
                  <Rss className="h-3 w-3" /> RSS
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main header */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md text-white shadow-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 h-16">

            {/* Logo */}
            <Link href={homeHref} className="flex items-center gap-3 shrink-0 group">
              {blog.logo_url ? (
                <Image src={blog.logo_url} alt={blog.name} width={36} height={36} className="rounded-xl object-contain" />
              ) : (
                <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0"
                  style={{ backgroundColor: primaryColor }}>
                  {blog.name[0]?.toUpperCase()}
                </div>
              )}
              <span className="font-black text-lg text-white hidden sm:block max-w-[180px] truncate group-hover:text-[var(--cp)] transition-colors">
                {blog.name}
              </span>
            </Link>

            {/* Desktop nav */}
            {pageLinks.length > 0 && (
              <>
                <div className="hidden lg:block h-5 w-px bg-white/10 shrink-0" />
                <nav className="hidden lg:flex items-center gap-0.5 flex-1">

                  {/* Page links */}
                  {pageLinks.map(link => (
                    <Link key={link.href} href={link.href}
                      className="shrink-0 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/8 transition-all">
                      {link.label}
                    </Link>
                  ))}

                  {/* Categories dropdown */}
                  {catBasePath && categories.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setCatOpen(o => !o)}
                        onBlur={() => setTimeout(() => setCatOpen(false), 150)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/8 transition-all"
                      >
                        {t('categories')}
                        <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${catOpen ? 'rotate-90' : ''}`} />
                      </button>

                      {/* Dropdown panel */}
                      {catOpen && (
                        <div className="absolute top-full left-0 mt-2 w-[520px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                          <div className="p-4 grid grid-cols-2 gap-3">
                            {categories.map(c => (
                              <Link
                                key={c.slug}
                                href={`${catBasePath}/${c.slug}${pq}`}
                                onClick={() => setCatOpen(false)}
                                className="group flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                              >
                                {/* Category image thumbnail */}
                                <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                                  {c.cover_image_url ? (
                                    <Image src={c.cover_image_url} alt={c.name} fill
                                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                                      sizes="64px" />
                                  ) : (
                                    <div className={`absolute inset-0 bg-gradient-to-br ${grad(c.id)}`} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-800 group-hover:text-[var(--cp)] transition-colors leading-tight"
                                    style={{ '--cp': primaryColor } as CSSProperties}>
                                    {c.name}
                                  </p>
                                  <p className="text-xs text-slate-400 mt-0.5">{c.articles_count} article{c.articles_count > 1 ? 's' : ''}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                          <div className="px-4 pb-4">
                            <Link href={catBasePath + pq} onClick={() => setCatOpen(false)}
                              className="flex items-center justify-center gap-2 w-full h-10 rounded-xl text-sm font-bold border-2 transition-all hover:text-white"
                              style={{ borderColor: primaryColor, color: primaryColor }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = primaryColor; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = primaryColor; }}>
                              {t('allCategories')}
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </nav>
              </>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 ml-auto">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <input
                    autoFocus value={q} onChange={e => setQ(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className="h-9 w-40 sm:w-56 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 px-3.5 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': `${primaryColor}80` } as CSSProperties}
                  />
                  <button type="button" onClick={() => setSearchOpen(false)} className="text-slate-400 hover:text-white p-1 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <button onClick={() => setSearchOpen(true)}
                  className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                  <Search className="h-4 w-4" />
                </button>
              )}
              <BlogLanguageSwitcher sourceLang={blog.language || 'en'} enabledLanguages={blog.enabled_languages ?? []} basePath={basePath ?? ''} className="text-slate-300 hover:text-white hover:bg-white/10" />
              {basePath != null && (
                <Link href={`${basePath}/advertise${pq}`}
                  className="hidden lg:inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-bold border border-white/20 text-slate-200 hover:border-white/50 hover:text-white transition-all shrink-0">
                  Advertise
                </Link>
              )}
              {subscribeEnabled && (
                <a href="#newsletter"
                  className="hidden sm:inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity shrink-0"
                  style={{ backgroundColor: primaryColor }}>
                  <Mail className="h-3.5 w-3.5" /> {subscribeLabel}
                </a>
              )}
              <button onClick={() => setMenuOpen(true)} aria-label="Open menu"
                className="lg:hidden h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Tiroir vertical mobile (menu complet) ───────────────────── */}
        {menuOpen && (
          <div className="lg:hidden fixed inset-0 z-[100]">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] animate-in fade-in duration-200" onClick={() => setMenuOpen(false)} />
            <div className="absolute top-0 right-0 h-full w-[82%] max-w-sm bg-slate-950 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              <div className="h-16 shrink-0 flex items-center justify-between px-5 border-b border-white/5">
                <span className="font-black text-lg text-white">{blog.name}</span>
                <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="text-slate-400 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-0.5">
                {drawerPageLinks.map(link => (
                  <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                    className="px-1 py-3 text-[15px] font-semibold text-slate-200 hover:text-white transition-colors border-b border-white/5">
                    {link.label}
                  </Link>
                ))}

                {catBasePath && categories.length > 0 && (
                  <>
                    <p className="px-1 pt-4 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">{t('categories')}</p>
                    {categories.map(c => (
                      <Link key={c.slug} href={`${catBasePath}/${c.slug}${pq}`} onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-1 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors">
                        <div className="relative w-10 h-7 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                          {c.cover_image_url ? (
                            <Image src={c.cover_image_url} alt={c.name} fill className="object-cover" sizes="40px" />
                          ) : (
                            <div className={`absolute inset-0 bg-gradient-to-br ${grad(c.id)}`} />
                          )}
                        </div>
                        <span>{c.name}</span>
                        <span className="ml-auto text-xs text-slate-600">{c.articles_count}</span>
                      </Link>
                    ))}
                    <Link href={catBasePath + pq} onClick={() => setMenuOpen(false)}
                      className="px-1 py-2.5 text-sm font-semibold transition-colors text-[var(--cp)]"
                      style={{ '--cp': primaryColor } as CSSProperties}>
                      → {t('allCategories')}
                    </Link>
                  </>
                )}

                {basePath != null && (
                  <Link href={`${basePath}/advertise${pq}`} onClick={() => setMenuOpen(false)}
                    className="mt-4 flex items-center justify-center h-11 px-4 rounded-xl text-sm font-bold border border-white/20 text-slate-200 hover:bg-white/5 transition-colors">
                    Advertise
                  </Link>
                )}
                <div className="mt-4">
                  <BlogLanguageSwitcher sourceLang={blog.language || 'en'} enabledLanguages={blog.enabled_languages ?? []} basePath={basePath ?? ''} className="text-slate-300 hover:text-white hover:bg-white/10" />
                </div>
              </div>

              {subscribeEnabled && (
                <div className="shrink-0 p-5 border-t border-white/5">
                  <a href="#newsletter" onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold text-white"
                    style={{ backgroundColor: primaryColor }}>
                    <Mail className="h-4 w-4" /> {subscribeLabel}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

export function CorporateFooter({
  blog, categories, primaryColor, basePath, previewSlug,
}: {
  blog: { name: string; description?: string | null; logo_url?: string | null; social_links?: Record<string, string>; template_config?: { footer?: { description?: string; showCategories?: boolean; navLinks?: { label: string; url: string }[]; showSocialLinks?: boolean; showNewsletterMini?: boolean; newsletterMiniText?: string; copyrightText?: string; showPoweredBy?: boolean } } | null };
  categories: PublicCategory[];
  primaryColor: string;
  basePath?: string;
  previewSlug?: string;
}) {
  const t = useTranslations('publicBlog');
  const footerConfig = blog.template_config?.footer;

  const pq = previewSlug ? `?preview=${previewSlug}` : '';
  const showCategories = footerConfig?.showCategories !== false;
  const showSocialLinks = footerConfig?.showSocialLinks !== false;
  const showNewsletterMini = footerConfig?.showNewsletterMini !== false;
  const showPoweredBy = footerConfig?.showPoweredBy !== false;
  const footerDesc = footerConfig?.description || blog.description;
  const newsletterMiniText = footerConfig?.newsletterMiniText || t('subscribeDesc');
  const copyrightText = footerConfig?.copyrightText || `© ${new Date().getFullYear()} ${blog.name}. Tous droits réservés.`;

  const defaultNavLinks = [
    { href: ((basePath ?? '/') || '/') + pq, label: t('navHome') },
    { href: basePath != null ? `${basePath}/about${pq}` : '/about', label: t('navAbout') },
    { href: basePath != null ? `${basePath}/contact${pq}` : '/contact', label: t('navContact') },
    { href: basePath != null ? `${basePath}/advertise${pq}` : '/advertise', label: 'Advertise' },
    { href: '/rss.xml', label: t('navRss') },
  ];
  const navLinks = footerConfig?.navLinks?.length
    ? footerConfig.navLinks.map(l => ({ href: l.url, label: l.label }))
    : defaultNavLinks;

  const socialIcons: Record<string, ReactNode> = {
    facebook: <Facebook className="h-4 w-4" />,
    twitter: <Twitter className="h-4 w-4" />,
    instagram: <Instagram className="h-4 w-4" />,
    youtube: <Youtube className="h-4 w-4" />,
    linkedin: <Linkedin className="h-4 w-4" />,
  };

  return (
    <footer className="bg-slate-950 text-white pb-16 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">

          {/* Brand */}
          <div>
            <Link href={(basePath ?? '/') || '/'} className="flex items-center gap-3 mb-5">
              {blog.logo_url ? (
                <Image src={blog.logo_url} alt={blog.name} width={32} height={32} className="rounded-xl" />
              ) : (
                <div className="h-8 w-8 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0"
                  style={{ backgroundColor: primaryColor }}>
                  {blog.name[0]?.toUpperCase()}
                </div>
              )}
              <span className="font-black text-lg text-white">{blog.name}</span>
            </Link>
            {footerDesc && (
              <p className="text-slate-400 text-sm leading-relaxed mb-5 line-clamp-4">{footerDesc}</p>
            )}
            {showSocialLinks && (
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(blog.social_links ?? {}).filter(([, u]) => !!u).map(([platform, url]) => (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                    className="h-9 w-9 rounded-xl bg-white/5 hover:bg-[var(--cp)] flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200">
                    {socialIcons[platform] ?? <span className="text-xs font-bold">{platform[0].toUpperCase()}</span>}
                  </a>
                ))}
                <a href="/rss.xml" title="RSS"
                  className="h-9 w-9 rounded-xl bg-white/5 hover:bg-orange-500 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200">
                  <Rss className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>

          {/* Categories */}
          {showCategories && categories.length > 0 && (
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-5">{t('categories')}</h4>
              <ul className="space-y-2.5">
                {categories.slice(0, 7).map(c => (
                  <li key={c.slug}>
                    <Link href={basePath != null ? `${basePath}/categories/${c.slug}${pq}` : `?category=${c.slug}`}
                      className="group flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" style={{ color: primaryColor }} />
                      <span>{c.name}</span>
                      <span className="ml-auto text-xs text-slate-600 group-hover:text-slate-400 transition-colors">{c.articles_count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Navigation */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-5">{t('navigation')}</h4>
            <ul className="space-y-2.5">
              {navLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href}
                    className="group flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" style={{ color: primaryColor }} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter mini */}
          {showNewsletterMini && (
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-5">Newsletter</h4>
              <p className="text-sm text-slate-400 leading-relaxed mb-5">{newsletterMiniText}</p>
              <a href="#newsletter"
                className="flex items-center justify-center gap-2 h-11 w-full rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primaryColor }}>
                <Mail className="h-4 w-4" /> {t('subscribeFree')}
              </a>
            </div>
          )}
        </div>

        <div className="pt-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <span>{copyrightText}</span>
          <div className="flex items-center gap-4 flex-wrap">
            <ShareButtons
              url={typeof window !== 'undefined' ? window.location.origin + (basePath ?? '') : (basePath ?? '')}
              title={blog.name}
              primaryColor={primaryColor}
              variant="blog"
            />
            {showPoweredBy && (
              <span>{t('poweredBy')}{' '}
                <a href="https://smarterbloggers.com" target="_blank" rel="noopener noreferrer"
                  className="font-semibold transition-colors hover:text-white" style={{ color: primaryColor }}>
                  SmarterBloggers
                </a>
              </span>
            )}
          </div>
        </div>
      </div>
      <MobileBottomNav basePath={basePath ?? ''} primaryColor={primaryColor} dark breakpoint="lg" />
    </footer>
  );
}

// ─── Newsletter Section ───────────────────────────────────────────────────────

export function NewsletterSection({
  blog, primaryColor, title, description, editMode,
}: {
  blog: { name: string; slug: string };
  primaryColor: string;
  title?: string;
  description?: string;
  editMode?: boolean;
}) {
  const t = useTranslations('publicBlog');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [subError, setSubError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setSubError('');
    try {
      const res = await fetch(`/api/public-proxy/${blog.slug}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('ok');
      } else {
        setSubError(await getFetchErrorMessage(res, t('subscribeError')));
        setStatus('error');
      }
    } catch {
      setSubError(t('subscribeError'));
      setStatus('error');
    }
  };

  return (
    <section id="newsletter" className="relative py-20 px-4 overflow-hidden" style={{ backgroundColor: primaryColor }}>
      <div className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />

      <div className="relative max-w-2xl mx-auto text-center text-white">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm mb-6">
          <Mail className="h-7 w-7 text-white" />
        </div>
        <InlineEditable path="template_config.home.newsletter.title" value={title || t('stayInformed')} editMode={editMode} tag="h2" className="text-3xl sm:text-4xl font-black mb-4 leading-tight" />
        <InlineEditable path="template_config.home.newsletter.description" value={description || t('subscribeDesc')} editMode={editMode} tag="p" className="text-white/80 text-lg mb-8 leading-relaxed" multiline />

        {status === 'ok' ? (
          <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm px-8 py-4 rounded-2xl font-bold text-lg">
            ✓ {t('subscribeSuccess')}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              disabled={status === 'loading'}
              className="flex-1 h-14 rounded-2xl border-0 bg-white/15 backdrop-blur-sm text-white placeholder-white/40 px-5 text-base focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            <button type="submit" disabled={status === 'loading'}
              className="h-14 px-8 rounded-2xl bg-white font-bold text-base whitespace-nowrap hover:bg-white/90 transition-colors disabled:opacity-60"
              style={{ color: primaryColor }}>
              {status === 'loading' ? t('subscribeSending') : t('subscribeButton')}
            </button>
          </form>
        )}

        {status === 'error' && <p className="text-white/70 text-sm mt-3">{subError}</p>}
        <p className="text-white/40 text-xs mt-4">{t('noSpam')}</p>
      </div>
    </section>
  );
}
