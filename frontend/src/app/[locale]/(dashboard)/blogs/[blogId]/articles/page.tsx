'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus, Search, FileText, Eye, Clock, CheckCircle2,
  Archive, MoreVertical, Edit2, Trash2,
  Camera, Video, Mic, Radio, Layers,
} from 'lucide-react';
import { articlesApi, tenantsApi } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { ArticleListItem, ArticleStatus } from '@/types';
import { BlogStudioShell } from '@/components/dashboard/BlogStudioShell';
import { useStudioPreview } from '@/contexts/studio-preview';

function ArticleRow({
  article, locale, blogId,
  onDelete, onPublish, onArchive,
}: {
  article: ArticleListItem;
  locale: string;
  blogId: string;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const router = useRouter();
  const t = useTranslations('articles');
  const [menuOpen, setMenuOpen] = useState(false);

  const STATUS_CONFIG: Record<ArticleStatus, { label: string; color: string; icon: typeof FileText }> = {
    draft:       { label: t('status.draft'),       color: 'text-slate-500 bg-slate-100',    icon: FileText },
    published:   { label: t('status.published'),   color: 'text-emerald-700 bg-emerald-50', icon: CheckCircle2 },
    scheduled:   { label: t('status.scheduled'),   color: 'text-blue-700 bg-blue-50',       icon: Clock },
    archived:    { label: t('status.archived'),    color: 'text-slate-400 bg-slate-50',     icon: Archive },
    in_review:   { label: t('status.in_review'),   color: 'text-amber-700 bg-amber-50',     icon: Clock },
    unpublished: { label: t('status.unpublished'), color: 'text-slate-400 bg-slate-50',     icon: Archive },
  };

  const sc = STATUS_CONFIG[article.status] ?? STATUS_CONFIG.draft;

  const TYPE_ICON: Record<string, { icon: typeof FileText; color: string }> = {
    article: { icon: FileText, color: 'text-slate-400' },
    photo:   { icon: Camera,   color: 'text-pink-400' },
    video:   { icon: Video,    color: 'text-violet-400' },
    audio:   { icon: Mic,      color: 'text-blue-400' },
    podcast: { icon: Radio,    color: 'text-amber-400' },
    mixed:   { icon: Layers,   color: 'text-emerald-400' },
  };
  const typeKey = (article as any).article_type ?? 'article';
  const tc = TYPE_ICON[typeKey] ?? TYPE_ICON.article;

  return (
    <div className="group flex items-center gap-3 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-800/60 rounded-lg px-2 transition-colors">
      {/* Cover thumb */}
      <div className="h-10 w-14 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden">
        {article.cover_image_url
          ? <img src={article.cover_image_url} alt="" className="h-full w-full object-cover" />
          : <div className="h-full w-full flex items-center justify-center"><FileText className="h-4 w-4 text-slate-300 dark:text-slate-600" /></div>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <tc.icon className={`h-3 w-3 shrink-0 ${tc.color}`} />
          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate leading-snug">{article.title}</p>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
          {formatRelativeTime(article.updated_at ?? article.created_at)} · {t('readTime', { n: article.reading_time_minutes ?? 0 })}
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
          <Eye className="h-3 w-3" />
          {article.views_count}
        </div>
        <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.color}`}>
          <sc.icon className="h-3 w-3" />
          {sc.label}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <div className="absolute right-0 top-8 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 w-40" onBlur={() => setMenuOpen(false)}>
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

  const { data, isLoading } = useQuery({
    queryKey: ['articles', blogId, status],
    queryFn: async () => {
      const { data } = await articlesApi.list(blogId, { status: status || undefined, limit: 50 });
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
    onError: () => toast({ variant: 'destructive', title: t('toastDeleteError') }),
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

  return (
    <BlogStudioShell
      title={t('title')}
      description={t('subtitle')}
      previewPath=""
      blogSlug={tenant?.slug}
    >
      <div className="p-4 space-y-3">

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
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
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[12px] text-slate-600 dark:text-slate-300 outline-none"
          >
            <option value="">{t('filterAll')}</option>
            <option value="draft">{t('filterDraft')}</option>
            <option value="published">{t('filterPublished')}</option>
            <option value="archived">{t('filterArchived')}</option>
          </select>
          <button
            onClick={() => router.push(`/${locale}/blogs/${blogId}/articles/new`)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-colors shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> {t('createShort')}
          </button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3 pt-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex gap-3 animate-pulse py-3">
                <div className="h-10 w-14 bg-slate-100 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
            <p className="text-[14px] font-bold text-slate-800 mb-1">
              {search ? t('noResultsSearch') : t('noArticlesEmpty')}
            </p>
            {!search && (
              <>
                <p className="text-[12px] text-slate-400 mb-4">{t('noArticlesEmptyDesc')}</p>
                <button
                  onClick={() => router.push(`/${locale}/blogs/${blogId}/articles/new`)}
                  className="flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> {t('createFirst')}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="pt-1">
            <p className="text-[11px] text-slate-400 mb-2 px-2">
              {articles.length > 1 ? t('countPlural', { n: articles.length }) : t('countSingular', { n: articles.length })}
            </p>
            {articles.map(a => (
              <ArticleRow
                key={a.id}
                article={a}
                locale={locale}
                blogId={blogId}
                onDelete={id => deleteMut.mutate(id)}
                onPublish={id => publishMut.mutate(id)}
                onArchive={id => archiveMut.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </BlogStudioShell>
  );
}
