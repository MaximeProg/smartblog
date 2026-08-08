'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus, Search, FileText, Eye, CheckCircle2,
  Archive, Edit2, Trash2, MoreVertical, Clock,
  Camera, Video, Mic, Radio, Layers, Hash, Mail, Share2,
  AlertTriangle, Zap,
} from 'lucide-react';
import { articlesApi, tenantsApi, affiliateApi, type AffiliateDashboard } from '@/lib/api';
import Link from 'next/link';
import { formatRelativeTime, getErrorMessage } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { ArticleListItem, ArticleStatus } from '@/types';
import { FullPageShell } from '@/components/dashboard/BlogStudioShell';
import { useStudioPreview } from '@/contexts/studio-preview';

const TYPE_ICON: Record<string, { icon: typeof FileText; color: string }> = {
  article: { icon: FileText, color: 'text-slate-400' },
  photo:   { icon: Camera,   color: 'text-pink-500' },
  video:   { icon: Video,    color: 'text-violet-500' },
  audio:   { icon: Mic,      color: 'text-blue-500' },
  podcast: { icon: Radio,    color: 'text-amber-500' },
  mixed:   { icon: Layers,   color: 'text-emerald-500' },
};

function ArticleRow({
  article, locale, blogId, blogSlug, affiliateCode,
  onDelete, onPublish, onArchive,
}: {
  article: ArticleListItem;
  locale: string;
  blogId: string;
  blogSlug: string | undefined;
  affiliateCode: string | null | undefined;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const router = useRouter();
  const t = useTranslations('articles');
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);

  const shareArticle = () => {
    if (!blogSlug || !affiliateCode) return;
    const url = `https://${blogSlug}.smarterbloggers.com/${article.slug}?ref=${affiliateCode}`;
    navigator.clipboard.writeText(url);
    toast({ title: t('shareLinkCopied') });
  };

  const STATUS_CONFIG: Record<ArticleStatus, { label: string; color: string; icon: typeof FileText }> = {
    draft:       { label: t('status.draft'),       color: 'text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-700',             icon: FileText },
    published:   { label: t('status.published'),   color: 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30',   icon: CheckCircle2 },
    scheduled:   { label: t('status.scheduled'),   color: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30',               icon: Clock },
    archived:    { label: t('status.archived'),    color: 'text-slate-400 bg-slate-50 dark:text-slate-500 dark:bg-slate-800',              icon: Archive },
    in_review:   { label: t('status.in_review'),   color: 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30',           icon: Clock },
    approved:    { label: t('status.approved'),    color: 'text-teal-700 bg-teal-50 dark:text-teal-400 dark:bg-teal-900/30',               icon: CheckCircle2 },
    rejected:    { label: t('status.rejected'),    color: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/30',                   icon: Archive },
    unpublished: { label: t('status.unpublished'), color: 'text-slate-400 bg-slate-50 dark:text-slate-500 dark:bg-slate-800',              icon: Archive },
  };

  const sc = STATUS_CONFIG[article.status] ?? STATUS_CONFIG.draft;
  const tc = TYPE_ICON[article.article_type] ?? TYPE_ICON.article;
  const TypeIcon = tc.icon;
  const typeLabel = t(`type.${article.article_type}` as any);

  const dateStr = article.published_at
    ? new Date(article.published_at).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: '2-digit' })
    : formatRelativeTime(article.created_at);

  return (
    <div className="group grid items-center gap-4 px-6 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
      style={{ gridTemplateColumns: '64px 1fr 150px 130px 96px 60px 72px' }}>

      {/* Thumb */}
      <div className="h-11 w-16 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
        {article.cover_image_url
          ? <img src={article.cover_image_url} alt="" className="h-full w-full object-cover" />
          : <div className="h-full w-full flex items-center justify-center">
              <TypeIcon className={`h-4 w-4 ${tc.color}`} />
            </div>
        }
      </div>

      {/* Title + type */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 mb-0.5">
          <TypeIcon className={`h-3 w-3 shrink-0 ${tc.color}`} />
          <span className={`text-[9px] font-bold uppercase tracking-wider ${tc.color}`}>{typeLabel}</span>
        </div>
        <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate leading-snug">{article.title}</p>
        {article.excerpt && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{article.excerpt}</p>
        )}
      </div>

      {/* Category */}
      <div className="min-w-0">
        {article.category ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full max-w-full">
            <Hash className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{article.category.name}</span>
          </span>
        ) : (
          <span className="text-[11px] text-slate-300 dark:text-slate-600">—</span>
        )}
      </div>

      {/* Status */}
      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full w-fit ${sc.color}`}>
        <sc.icon className="h-3 w-3 shrink-0" />
        {sc.label}
      </span>

      {/* Date */}
      <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{dateStr}</span>

      {/* Views */}
      <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
        <Eye className="h-3 w-3 shrink-0" />
        {article.views_count}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 justify-end">
        <button
          onClick={() => router.push(`/${locale}/blogs/${blogId}/articles/${article.id}/edit`)}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
          title={t('editTooltip')}
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-8 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 w-44"
              onBlur={() => setMenuOpen(false)}
            >
              {article.status === 'draft' && (
                <button onClick={() => { onPublish(article.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {t('publishAction')}
                </button>
              )}
              {article.status === 'published' && (
                <button onClick={() => { onArchive(article.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Archive className="h-3.5 w-3.5 text-slate-400" /> {t('archiveAction')}
                </button>
              )}
              <button
                onClick={() => { router.push(`/${locale}/blogs/${blogId}/newsletter?from_article=${article.id}`); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Mail className="h-3.5 w-3.5 text-violet-500" /> {t('sendAsNewsletter')}
              </button>
              {blogSlug && affiliateCode && (
                <button onClick={() => { shareArticle(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Share2 className="h-3.5 w-3.5 text-blue-500" /> {t('shareAction')}
                </button>
              )}
              <button onClick={() => { onDelete(article.id); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                <Trash2 className="h-3.5 w-3.5" /> {t('deleteAction')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ArticlesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const blogId = params.blogId as string;
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { refresh } = useStudioPreview();
  const t = useTranslations('articles');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ArticleStatus | ''>('');

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: async () => { const { data } = await tenantsApi.get(blogId); return data; },
  });

  const { data: affiliateDashboard } = useQuery<AffiliateDashboard>({
    queryKey: ['affiliate-dashboard'],
    queryFn: async () => { const { data } = await affiliateApi.getDashboard(); return data; },
  });

  const articlesMax = tenant?.limits?.max_articles ?? null;
  const articlesUsed = tenant?.usage?.articles_count ?? 0;
  const usagePct = articlesMax != null ? articlesUsed / articlesMax : 0;
  const atLimit = articlesMax != null && articlesUsed >= articlesMax;
  const nearLimit = !atLimit && usagePct >= 0.8;

  const { data, isLoading } = useQuery({
    queryKey: ['articles', blogId, status],
    queryFn: async () => {
      const { data } = await articlesApi.list(blogId, { status: status || undefined, limit: 100 });
      return data;
    },
  });

  const articles = (data?.data ?? []).filter(a =>
    !search || a.title.toLowerCase().includes(search.toLowerCase())
  );

  const deleteMut = useMutation({
    mutationFn: (id: string) => articlesApi.delete(blogId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles', blogId] });
      toast({ title: t('toastDeleted') });
      setTimeout(refresh, 600);
    },
    onError: (err: any) => toast({ variant: 'destructive', title: t('toastDeleteError'), description: getErrorMessage(err, '') }),
  });

  const publishMut = useMutation({
    mutationFn: (id: string) => articlesApi.publish(blogId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles', blogId] });
      toast({ title: t('toastPublished') });
      setTimeout(refresh, 600);
    },
  });

  const archiveMut = useMutation({
    mutationFn: (id: string) => articlesApi.archive(blogId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles', blogId] });
      toast({ title: t('toastArchived') });
      setTimeout(refresh, 600);
    },
  });

  const createAction = (
    <button
      onClick={() => !atLimit && router.push(`/${locale}/blogs/${blogId}/articles/new`)}
      disabled={atLimit}
      className={`flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-bold transition-colors ${atLimit ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
      title={atLimit ? t('limitReachedTooltip') : undefined}
    >
      <Plus className="h-4 w-4" /> {t('createShort')}
    </button>
  );

  return (
    <FullPageShell title={t('title')} description={t('subtitle')} action={createAction}>
      <div className="p-6 space-y-4">

        {/* Plan usage banner */}
        {(atLimit || nearLimit) && articlesMax !== null && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
            atLimit
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
          }`}>
            <AlertTriangle className={`h-4 w-4 shrink-0 ${atLimit ? 'text-red-500' : 'text-amber-500'}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-[13px] font-bold ${atLimit ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                {atLimit ? t('limitReachedTitle', { max: articlesMax }) : t('limitNearTitle', { used: articlesUsed, max: articlesMax })}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {atLimit ? t('limitReachedDesc') : t('limitNearDesc')}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className={`w-24 h-1.5 rounded-full ${atLimit ? 'bg-red-200 dark:bg-red-800' : 'bg-amber-200 dark:bg-amber-800'} overflow-hidden`}>
                <div
                  className={`h-full rounded-full ${atLimit ? 'bg-red-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, Math.round(usagePct * 100))}%` }}
                />
              </div>
              <span className={`text-[11px] font-mono font-bold ${atLimit ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {articlesUsed}/{articlesMax}
              </span>
              <Link
                href={`/${locale}/subscription`}
                className="flex items-center gap-1 h-7 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors"
              >
                <Zap className="h-3 w-3" /> {t('upgrade')}
              </Link>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('searchPlaceholderShort')}
              className="flex-1 bg-transparent text-[13px] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
            />
          </div>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as ArticleStatus | '')}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] text-slate-600 dark:text-slate-300 outline-none"
          >
            <option value="">{t('filterAll')}</option>
            <option value="draft">{t('filterDraft')}</option>
            <option value="in_review">{t('status.in_review')}</option>
            <option value="approved">{t('status.approved')}</option>
            <option value="rejected">{t('status.rejected')}</option>
            <option value="published">{t('filterPublished')}</option>
            <option value="unpublished">{t('status.unpublished')}</option>
            <option value="scheduled">{t('status.scheduled')}</option>
            <option value="archived">{t('filterArchived')}</option>
          </select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4 animate-pulse px-6 py-3">
                <div className="h-11 w-16 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
              <FileText className="h-7 w-7 text-blue-500" />
            </div>
            <p className="text-[15px] font-bold text-slate-800 dark:text-slate-100 mb-1.5">
              {search ? t('noResultsSearch') : t('noArticlesEmpty')}
            </p>
            {!search && (
              <>
                <p className="text-[13px] text-slate-400 dark:text-slate-500 mb-5">{t('noArticlesEmptyDesc')}</p>
                <button
                  onClick={() => router.push(`/${locale}/blogs/${blogId}/articles/new`)}
                  className="flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold transition-colors"
                >
                  <Plus className="h-4 w-4" /> {t('createFirst')}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* Column headers */}
            <div className="grid items-center gap-4 px-6 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700"
              style={{ gridTemplateColumns: '64px 1fr 150px 130px 96px 60px 72px' }}>
              <div />
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('table.title')}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('table.category')}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('table.status')}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('table.date')}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('table.views')}</div>
              <div />
            </div>

            {articles.map(a => (
              <ArticleRow
                key={a.id}
                article={a}
                locale={locale}
                blogId={blogId}
                blogSlug={tenant?.slug}
                affiliateCode={affiliateDashboard?.affiliate_code}
                onDelete={id => deleteMut.mutate(id)}
                onPublish={id => publishMut.mutate(id)}
                onArchive={id => archiveMut.mutate(id)}
              />
            ))}

            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {articles.length > 1 ? t('countPlural', { n: articles.length }) : t('countSingular', { n: articles.length })}
              </p>
            </div>
          </div>
        )}
      </div>
    </FullPageShell>
  );
}
