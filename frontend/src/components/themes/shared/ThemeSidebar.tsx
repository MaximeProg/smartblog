'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { TrendingUp, BookOpen, Hash, Mail } from 'lucide-react';
import type { BlogInfo, PublicArticle, PublicCategory, TemplateConfig } from '@/lib/public-api';
import { getFetchErrorMessage } from '@/lib/utils';
import { AdRotator } from './AdRotator';

interface ThemeSidebarProps {
  blog: BlogInfo;
  articles: PublicArticle[];
  categories: PublicCategory[];
  config?: NonNullable<TemplateConfig['home']>['sidebar'];
  getArticleHref: (slug: string) => string;
  isPreview?: boolean;
  locale: string;
  basePath?: string;
  /** Visual style variant — 'light' (default) or 'dark' */
  variant?: 'light' | 'dark';
}

export function ThemeSidebar({
  blog,
  articles,
  categories,
  config,
  getArticleHref,
  isPreview,
  locale,
  basePath,
  variant = 'light',
}: ThemeSidebarProps) {
  const t = useTranslations('publicBlog');
  const [email, setEmail]         = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [subError, setSubError]   = useState('');

  const primaryColor = blog.primary_color || '#18181b';

  // Config flags — enabled by default
  const showPopular      = config?.popularArticles !== false;
  const showCategories   = config?.categories      !== false;
  const showTags         = config?.tags            !== false;
  const showNewsletter   = config?.newsletterMini  !== false;
  const popularTitle     = config?.popularTitle    || t('popularArticles');
  const categoriesTitle  = config?.categoriesTitle || t('categories');
  const tagsTitle        = config?.tagsTitle       || t('tagsLabel');

  // Computed data
  const popular = [...articles].sort((a, b) => (b.views_count ?? 0) - (a.views_count ?? 0)).slice(0, 5);
  const allTags = Array.from(new Set(articles.flatMap(a => a.tags ?? []))).slice(0, 20);

  const isDark = variant === 'dark';
  const card   = isDark
    ? 'bg-slate-900 border-slate-800'
    : 'bg-white border-slate-100 shadow-sm';
  const labelCls = isDark ? 'text-slate-400' : 'text-slate-700';
  const subLabelCls = isDark ? 'text-slate-500' : 'text-slate-500';
  const textCls  = isDark ? 'text-slate-200' : 'text-slate-800';
  const tagBg    = isDark
    ? 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200'
    : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-[var(--cp)] hover:border-[var(--cp)]';

  async function handleSubscribe(e: FormEvent) {
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
  }

  return (
    <aside className="space-y-5" style={{ '--cp': primaryColor } as React.CSSProperties}>

      {/* Popular articles */}
      {showPopular && popular.length > 0 && (
        <div className={`rounded-2xl border p-5 ${card}`}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
            <h3 className={`text-[10px] font-black uppercase tracking-widest ${labelCls}`}>{popularTitle}</h3>
          </div>
          <div className="space-y-3">
            {popular.map((a, i) => (
              <Link key={a.id} href={getArticleHref(a.slug)} className="flex items-start gap-3 group">
                <span className="text-[18px] font-black leading-none w-6 shrink-0 mt-0.5" style={{ color: `${primaryColor}55` }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {a.cover_image_url ? (
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden shrink-0">
                    <Image src={a.cover_image_url} alt={a.title} fill className="object-cover" sizes="48px" />
                  </div>
                ) : null}
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] font-bold leading-snug line-clamp-2 group-hover:text-[var(--cp)] transition-colors ${textCls}`}>
                    {a.title}
                  </p>
                  {a.category_name && (
                    <p className={`text-[10px] mt-0.5 ${subLabelCls}`}>{a.category_name}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {showCategories && categories.length > 0 && (
        <div className={`rounded-2xl border p-5 ${card}`}>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
            <h3 className={`text-[10px] font-black uppercase tracking-widest ${labelCls}`}>{categoriesTitle}</h3>
          </div>
          <div className="space-y-0.5">
            {categories.map(c => (
              <Link
                key={c.slug}
                href={`${basePath !== undefined ? (basePath || '/') : `/${locale}/${blog.slug}`}?category=${c.slug}`}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-medium transition-colors ${
                  isDark
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{c.name}</span>
                {'articles_count' in c && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                    {(c as any).articles_count ?? ''}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {showTags && allTags.length > 0 && (
        <div className={`rounded-2xl border p-5 ${card}`}>
          <div className="flex items-center gap-2 mb-4">
            <Hash className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
            <h3 className={`text-[10px] font-black uppercase tracking-widest ${labelCls}`}>{tagsTitle}</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map(tag => (
              <Link
                key={tag}
                href={`${basePath !== undefined ? (basePath || '/') : `/${locale}/${blog.slug}`}?q=${encodeURIComponent(tag)}`}
                className={`text-[11px] px-2.5 py-1 rounded-xl border transition-colors ${tagBg}`}
              >
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
      {showNewsletter && (
        <div className="rounded-2xl p-5 text-white" style={{ backgroundColor: primaryColor }}>
          <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <Mail className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-black text-[15px] mb-1 leading-tight">{t('joinCommunity')}</h3>
          <p className="text-white/75 text-[12px] leading-relaxed mb-4">
            {t('weeklyNewsletterDesc')}
          </p>
          {subStatus === 'ok' ? (
            <p className="text-[12px] font-bold text-white/80">{t('subscribeSuccess')}</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-0">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="flex-1 min-w-0 h-9 rounded-l-xl bg-white/20 border-0 px-3 text-[12px] text-white placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-white/40"
              />
              <button
                type="submit"
                disabled={subStatus === 'loading'}
                className="h-9 px-3 rounded-r-xl bg-white text-[12px] font-black transition-colors disabled:opacity-60 shrink-0"
                style={{ color: primaryColor }}
              >
                {subStatus === 'loading' ? '…' : t('subscribeButton')}
              </button>
            </form>
          )}
          {subStatus === 'error' && <p className="text-[11px] text-red-300 mt-2">{subError}</p>}
        </div>
      )}
    </aside>
  );
}
