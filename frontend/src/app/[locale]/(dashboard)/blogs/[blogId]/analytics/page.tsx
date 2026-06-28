'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Eye, Users, Clock, ExternalLink } from 'lucide-react';

import { analyticsApi, tenantsApi } from '@/lib/api';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

export default function AnalyticsPage() {
  const t = useTranslations('analytics');
  const params = useParams();
  const locale = params.locale as string;
  const blogId = params.blogId as string;

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: () => tenantsApi.get(blogId).then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', blogId],
    queryFn: () => analyticsApi.overview(blogId, 30).then((r) => r.data),
    enabled: !!blogId,
  });

  const stats = data
    ? [
        {
          label: t('pageViews'),
          value: (data.total_views ?? 0).toLocaleString(),
          icon: Eye,
        },
        {
          label: t('uniqueVisitors'),
          value: (data.unique_sessions ?? 0).toLocaleString(),
          icon: Users,
        },
        {
          label: 'Avg. session',
          value: formatDuration(data.avg_duration_seconds ?? 0),
          icon: Clock,
        },
        {
          label: 'Top referrers',
          value: (data.top_referrers ?? []).length.toString(),
          icon: ExternalLink,
        },
      ]
    : [];

  return (
    <DashboardShell
      locale={locale}
      blogId={blogId}
      breadcrumbs={[
        { label: tenant?.name ?? '…' },
        { label: t('title') },
      ]}
    >
      <div className="max-w-4xl">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{t('title')}</h2>
            <p className="text-sm text-slate-400 dark:text-zinc-500 mt-0.5">{t('subtitle')}</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map(({ label, value, icon: Icon }) => (
                  <Card key={label}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {data && (data.top_articles ?? []).length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-base">{t('topArticles')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.top_articles.map((article, i) => (
                        <div key={article.id} className="flex items-center gap-3">
                          <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                          <p className="flex-1 text-sm font-medium truncate">{article.title}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="h-3.5 w-3.5" />
                            {(article.views ?? 0).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {data && (data.top_referrers ?? []).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top Referrers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.top_referrers.map((ref) => (
                        <div key={ref.domain} className="flex items-center gap-3">
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <p className="flex-1 text-sm font-medium truncate">{ref.domain}</p>
                          <span className="text-xs text-muted-foreground">
                            {(ref.visits ?? 0).toLocaleString()} visits
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {data && (data.top_articles ?? []).length === 0 && (
                <div className="text-center py-16 text-slate-300 dark:text-zinc-600">
                  <Eye className="h-10 w-10 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 dark:text-zinc-500">{t('noData')}</p>
                </div>
              )}
            </>
          )}
        </div>
    </DashboardShell>
  );
}
