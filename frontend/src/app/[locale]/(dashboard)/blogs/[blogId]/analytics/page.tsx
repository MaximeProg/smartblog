'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Eye, Users, Clock, TrendingUp, Globe } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { analyticsApi, tenantsApi } from '@/lib/api';
import { FullPageShell } from '@/components/dashboard/BlogStudioShell';
import type { DailyMetric } from '@/types';

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function MiniBarChart({ data, viewsUnit }: { data: DailyMetric[]; viewsUnit: string }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.views), 1);
  return (
    <div className="flex items-end gap-0.5 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
          <div
            className="w-full rounded-t bg-blue-500/70 hover:bg-blue-600 transition-colors min-h-[2px]"
            style={{ height: `${Math.max(4, (d.views / max) * 88)}px` }}
          />
          <div className="absolute bottom-full mb-1 hidden group-hover:flex bg-slate-800 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap z-10">
            {d.date.slice(5)}: {d.views} {viewsUnit}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const [days, setDays] = useState(30);
  const ts = useTranslations('studio');

  const PERIODS = [
    { label: ts('analyticsPeriod7'),  value: 7  },
    { label: ts('analyticsPeriod30'), value: 30 },
    { label: ts('analyticsPeriod90'), value: 90 },
  ];

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: async () => { const { data } = await tenantsApi.get(blogId); return data; },
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', blogId, days],
    queryFn: async () => { const { data } = await analyticsApi.overview(blogId, days); return data; },
  });

  const stats = [
    { label: ts('analyticsViews'),    value: analytics?.total_views ?? 0,       icon: Eye,       color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/30',   border: 'border-blue-100 dark:border-blue-800'   },
    { label: ts('analyticsSessions'), value: analytics?.unique_sessions ?? 0,    icon: Users,     color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30', border: 'border-violet-100 dark:border-violet-800' },
    { label: ts('analyticsDuration'), value: formatDuration(analytics?.avg_duration_seconds ?? 0), icon: Clock, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-100 dark:border-emerald-800' },
    { label: ts('analyticsTrend'),    value: analytics ? `+${analytics.total_views}` : '–', icon: TrendingUp, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-100 dark:border-amber-800' },
  ];

  const periodSelector = (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
      {PERIODS.map(p => (
        <button
          key={p.value}
          onClick={() => setDays(p.value)}
          className={`h-8 px-4 rounded-lg text-[12px] font-semibold transition-all ${
            days === p.value
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );

  return (
    <FullPageShell
      title={ts('pageAnalytics')}
      description={ts('pageAnalyticsDesc')}
      action={periodSelector}
    >
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">

        {/* Stats cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map(s => (
              <div key={s.label} className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl border ${s.border} ${s.bg} flex items-center justify-center shrink-0`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[22px] font-black text-slate-900 dark:text-slate-100 leading-none">{s.value}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Bar chart */}
          {analytics?.views_by_day && analytics.views_by_day.length > 0 && (
            <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 p-5 lg:col-span-2">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">{ts('analyticsViewsByDay')}</p>
              <MiniBarChart data={analytics.views_by_day} viewsUnit={ts('analyticsViewsUnit')} />
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-slate-400">{analytics.views_by_day[0]?.date?.slice(5)}</span>
                <span className="text-[10px] text-slate-400">{analytics.views_by_day[analytics.views_by_day.length - 1]?.date?.slice(5)}</span>
              </div>
            </div>
          )}

          {/* Top articles */}
          {analytics?.top_articles && analytics.top_articles.length > 0 && (
            <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{ts('analyticsTopArticles')}</p>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {analytics.top_articles.slice(0, 8).map((art, i) => (
                  <div key={art.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="text-[11px] font-bold text-slate-300 dark:text-slate-600 w-5 shrink-0">{i + 1}</span>
                    <p className="flex-1 text-[13px] text-slate-700 dark:text-slate-300 truncate">{art.title}</p>
                    <span className="text-[12px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">{art.views} {ts('analyticsViewsUnit')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top referrers */}
          {analytics?.top_referrers && analytics.top_referrers.length > 0 && (
            <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{ts('analyticsSources')}</p>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {analytics.top_referrers.slice(0, 8).map(ref => (
                  <div key={ref.domain} className="flex items-center gap-3 px-5 py-3">
                    <Globe className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <p className="flex-1 text-[13px] text-slate-700 dark:text-slate-300 truncate font-mono">{ref.domain || 'Direct'}</p>
                    <span className="text-[12px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">{ref.visits}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Empty state */}
        {!isLoading && !analytics?.total_views && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1">{ts('analyticsNoDataTitle')}</p>
            <p className="text-[12px] text-slate-400 dark:text-slate-500">{ts('analyticsNoDataDesc')}</p>
          </div>
        )}
      </div>
    </FullPageShell>
  );
}
