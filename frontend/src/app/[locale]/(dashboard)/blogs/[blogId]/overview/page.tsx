'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  FileText, BarChart2, Users, Eye, Plus, Pencil,
  ArrowRight, Palette, Settings, TrendingUp, Clock,
  CheckCircle2, Circle,
} from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { tenantsApi, articlesApi, analyticsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { ArticleStatus } from '@/types';

export default function OverviewPage() {
  const params = useParams();
  const locale  = params.locale as string;
  const blogId  = params.blogId as string;
  const t = useTranslations('blogs.overview');
  const tArticles = useTranslations('articles');

  const STATUS_CONFIG: Record<ArticleStatus, { label: string; color: string; icon: React.ElementType }> = {
    published: { label: tArticles('status.published'), color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
    draft:     { label: tArticles('status.draft'),     color: 'text-slate-500 bg-slate-50 border-slate-200',       icon: Circle },
    scheduled: { label: tArticles('status.scheduled'), color: 'text-amber-600 bg-amber-50 border-amber-200',       icon: Clock },
    archived:  { label: tArticles('status.archived'),  color: 'text-slate-400 bg-slate-50 border-slate-200',       icon: Circle },
  };

  const { data: tenant, isLoading: loadingBlog } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: () => tenantsApi.get(blogId).then((r) => r.data),
  });

  const { data: articlesData, isLoading: loadingArticles } = useQuery({
    queryKey: ['articles', blogId, 'overview'],
    queryFn: () => articlesApi.list(blogId, { limit: 6 }).then((r) => r.data),
    enabled: !!blogId,
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', blogId, 'overview'],
    queryFn: () => analyticsApi.overview(blogId, 30).then((r) => r.data),
    enabled: !!blogId,
  });

  const articles = articlesData?.items ?? [];
  const base = `/${locale}/blogs/${blogId}`;

  const stats = [
    {
      label: t('articles'),
      value: tenant?.articles_count ?? 0,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      href: `${base}/articles`,
    },
    {
      label: t('views30'),
      value: analytics?.total_views ?? '—',
      icon: Eye,
      color: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
      href: `${base}/analytics`,
    },
    {
      label: t('subscribers'),
      value: tenant?.subscribers_count ?? 0,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      href: `${base}/newsletter`,
    },
    {
      label: t('authors'),
      value: tenant?.authors_count ?? 0,
      icon: Users,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      href: `${base}/team`,
    },
  ];

  const quickActions = [
    {
      href: `${base}/articles/new`,
      icon: Plus,
      label: t('writeArticle'),
      desc: t('writeArticleDesc'),
      primary: true,
    },
    {
      href: `${base}/appearance`,
      icon: Palette,
      label: t('appearance'),
      desc: t('appearanceDesc'),
      primary: false,
    },
    {
      href: `${base}/analytics`,
      icon: TrendingUp,
      label: t('analytics'),
      desc: t('analyticsDesc'),
      primary: false,
    },
    {
      href: `${base}/settings`,
      icon: Settings,
      label: t('settingsLabel'),
      desc: t('settingsDesc'),
      primary: false,
    },
  ];

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
      <div className="max-w-5xl space-y-8">

        {/* Blog header */}
        <div className="flex items-start gap-4">
          {loadingBlog ? (
            <Skeleton className="h-14 w-14 rounded-xl" />
          ) : tenant?.logo_url ? (
            <img src={tenant.logo_url} alt={tenant.name} className="h-14 w-14 rounded-xl object-cover shadow-sm border border-slate-100" />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-2xl font-black shadow-sm">
              {tenant?.name?.[0]?.toUpperCase() ?? 'B'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {loadingBlog ? (
              <>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-72" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">{tenant?.name}</h1>
                  <Badge variant="outline" className="text-[10px] capitalize border-emerald-200 text-emerald-700 bg-emerald-50">
                    {tenant?.status ?? 'active'}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {tenant?.theme ?? 'minimal'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
                  {tenant?.slug}.nexusblog.io
                </p>
                {tenant?.description && (
                  <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 line-clamp-1">{tenant.description}</p>
                )}
              </>
            )}
          </div>
          <Button asChild variant="outline" size="sm" className="h-8 text-xs shrink-0" disabled={loadingBlog}>
            <a href={tenant ? `/en/${tenant.slug}` : '#'} target="_blank" rel="noopener noreferrer">
              <Eye className="h-3.5 w-3.5" />
              {t('viewBlog')}
            </a>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="group rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-blue-200 hover:shadow-sm transition-all"
            >
              <div className={`h-9 w-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`h-[18px] w-[18px] ${stat.color}`} />
              </div>
              {loadingBlog ? (
                <Skeleton className="h-7 w-16 mb-1" />
              ) : (
                <p className="text-2xl font-black text-slate-800 dark:text-white leading-none mb-0.5">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </p>
              )}
              <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">{stat.label}</p>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">{t('quickActions')}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`group flex flex-col gap-2 rounded-xl border p-4 transition-all ${
                  action.primary
                    ? 'border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 dark:bg-blue-950/30 dark:border-blue-800 dark:hover:bg-blue-950/50'
                    : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm dark:bg-zinc-900 dark:border-zinc-800'
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  action.primary ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-zinc-800'
                }`}>
                  <action.icon className={`h-4 w-4 ${action.primary ? 'text-white' : 'text-slate-500 dark:text-zinc-400'}`} />
                </div>
                <div>
                  <p className={`text-[13px] font-semibold leading-tight ${action.primary ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {action.label}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5 leading-tight">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent articles */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('recentArticles')}</h2>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1">
              <Link href={`${base}/articles`}>
                {t('viewAll')}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          {loadingArticles ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : articles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-12 text-center">
              <FileText className="h-8 w-8 mx-auto text-slate-300 dark:text-zinc-600 mb-3" />
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">{t('noArticles')}</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mb-4">{t('noArticlesDesc')}</p>
              <Button asChild size="sm">
                <Link href={`${base}/articles/new`}>
                  <Plus className="h-3.5 w-3.5" />
                  {t('firstArticle')}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-100 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
              {articles.map((article, i) => {
                const cfg = STATUS_CONFIG[article.status];
                const Icon = cfg.icon;
                return (
                  <div
                    key={article.id}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors ${i > 0 ? 'border-t border-slate-50 dark:border-zinc-800' : ''}`}
                  >
                    {article.cover_image_url ? (
                      <img src={article.cover_image_url} alt="" className="h-9 w-9 rounded-lg object-cover shrink-0 bg-slate-100" />
                    ) : (
                      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-slate-300 dark:text-zinc-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-slate-800 dark:text-slate-100 truncate leading-tight">
                        {article.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cfg.color}`}>
                          <Icon className="h-2.5 w-2.5" />
                          {cfg.label}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                          {formatDate(article.updated_at, locale)}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`${base}/articles/${article.id}/edit`}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all shrink-0"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </DashboardShell>
  );
}
