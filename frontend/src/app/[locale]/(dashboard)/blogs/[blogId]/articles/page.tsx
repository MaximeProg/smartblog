'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Plus, Search, FileText, MoreHorizontal, Pencil,
  Trash2, Eye, EyeOff, Clock, CheckCircle2, Circle, ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { articlesApi, tenantsApi } from '@/lib/api';
import type { ArticleStatus } from '@/types';

export default function ArticlesPage() {
  const params  = useParams();
  const locale  = params.locale as string;
  const blogId  = params.blogId as string;
  const queryClient = useQueryClient();
  const { toast }   = useToast();
  const t = useTranslations('articles');

  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId,     setDeleteId]     = useState<string | null>(null);

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: () => tenantsApi.get(blogId).then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['articles', blogId, search, statusFilter],
    queryFn: () =>
      articlesApi.list(blogId, {
        limit: 50,
        q:      search  || undefined,
        status: (statusFilter || undefined) as ArticleStatus | undefined,
      }).then((r) => r.data),
    enabled: !!blogId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => articlesApi.delete(blogId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles', blogId] });
      toast({ title: 'Article deleted.' });
      setDeleteId(null);
    },
    onError: () => toast({ variant: 'destructive', title: 'Failed to delete article.' }),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => articlesApi.publish(blogId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles', blogId] });
      toast({ variant: 'success', title: 'Article published!' });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => articlesApi.archive(blogId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles', blogId] });
      toast({ title: 'Article archived.' });
    },
  });

  const STATUS_CONFIG: Record<ArticleStatus, {
    label: string;
    color: string;
    bg: string;
    icon: React.ElementType;
  }> = {
    published: { label: t('status.published'), color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800',  icon: CheckCircle2 },
    draft:     { label: t('status.draft'),     color: 'text-slate-500',   bg: 'bg-slate-50 border-slate-200 dark:bg-zinc-800/60 dark:border-zinc-700',             icon: Circle },
    scheduled: { label: t('status.scheduled'), color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',           icon: Clock },
    archived:  { label: t('status.archived'),  color: 'text-slate-400',   bg: 'bg-slate-50 border-slate-200 dark:bg-zinc-800/40 dark:border-zinc-700',             icon: Circle },
  };

  const STATUS_FILTERS = [
    { value: '',          label: t('filterAll') },
    { value: 'published', label: t('filterPublished') },
    { value: 'draft',     label: t('filterDraft') },
    { value: 'scheduled', label: t('filterScheduled') },
    { value: 'archived',  label: t('filterArchived') },
  ];

  const articles = data?.items ?? [];
  const total    = data?.total ?? 0;
  const base     = `/${locale}/blogs/${blogId}`;

  return (
    <DashboardShell
      locale={locale}
      blogId={blogId}
      breadcrumbs={[
        { label: tenant?.name ?? '…' },
        { label: t('title') },
      ]}
      actions={
        <Button asChild size="sm" className="h-8 text-xs gap-1.5">
          <Link href={`${base}/articles/new`}>
            <Plus className="h-3.5 w-3.5" />
            {t('newArticle')}
          </Link>
        </Button>
      }
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                statusFilter === f.value
                  ? 'bg-slate-800 text-white dark:bg-white dark:text-zinc-900'
                  : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-20 text-center">
          <FileText className="h-10 w-10 mx-auto text-slate-300 dark:text-zinc-600 mb-3" />
          <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300 mb-1">
            {search || statusFilter ? t('noResults') : t('noArticles')}
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mb-5">
            {search || statusFilter ? t('noResultsDesc') : t('noArticlesDesc')}
          </p>
          {!search && !statusFilter && (
            <Button asChild size="sm">
              <Link href={`${base}/articles/new`}>
                <Plus className="h-3.5 w-3.5" />
                {t('writeFirst')}
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mb-3">
            {total === 1 ? t('total', { count: total }) : t('totalPlural', { count: total })}
          </p>
          <div className="rounded-xl border border-slate-100 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
            {articles.map((article, i) => {
              const cfg  = STATUS_CONFIG[article.status];
              const Icon = cfg.icon;
              return (
                <div
                  key={article.id}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors ${i > 0 ? 'border-t border-slate-50 dark:border-zinc-800' : ''}`}
                >
                  {article.cover_image_url ? (
                    <img src={article.cover_image_url} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0 bg-slate-100" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-slate-300 dark:text-zinc-600" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight">
                      {article.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
                        <Icon className="h-2.5 w-2.5" />
                        {cfg.label}
                      </span>
                      {article.category?.name && (
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                          {article.category.name}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                        {formatDate(article.updated_at, locale)}
                      </span>
                      {article.views_count > 0 && (
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                          {article.views_count.toLocaleString()} {t('views')}
                        </span>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-slate-400 hover:text-slate-700">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem asChild>
                        <Link href={`${base}/articles/${article.id}/edit`} className="gap-2 cursor-pointer">
                          <Pencil className="h-3.5 w-3.5" />
                          {t('actions.edit')}
                        </Link>
                      </DropdownMenuItem>
                      {article.status === 'draft' && (
                        <DropdownMenuItem
                          onClick={() => publishMutation.mutate(article.id)}
                          className="gap-2 cursor-pointer text-emerald-700"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {t('actions.publish')}
                        </DropdownMenuItem>
                      )}
                      {article.status === 'published' && (
                        <>
                          <DropdownMenuItem asChild>
                            <a
                              href={tenant ? `/en/${tenant.slug}/${article.slug}` : '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="gap-2 cursor-pointer"
                            >
                              <ArrowUpRight className="h-3.5 w-3.5" />
                              {t('actions.viewOnline')}
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => archiveMutation.mutate(article.id)}
                            className="gap-2 cursor-pointer text-slate-500"
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                            {t('actions.archive')}
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteId(article.id)}
                        className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t('actions.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o: boolean) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t('confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}
