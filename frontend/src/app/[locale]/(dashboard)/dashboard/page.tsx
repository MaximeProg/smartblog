'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Plus, Newspaper, Mail, Users, ExternalLink, Settings, TrendingUp, Eye, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { useAuthStore } from '@/store/auth.store';
import { tenantsApi, analyticsApi } from '@/lib/api';
import type { TenantInfo, DailyMetric } from '@/types';

// ─── Plan gradients ───────────────────────────────────────────────────────────

const PLAN_GRADIENTS: Record<string, string> = {
  free:     'from-slate-400 to-slate-600',
  starter:  'from-indigo-400 to-indigo-600',
  pro:      'from-blue-400 to-blue-600',
  business: 'from-amber-400 to-orange-500',
};

// ─── Aggregate views by day across all blogs ──────────────────────────────────

function mergeViewsByDay(allData: DailyMetric[][]): DailyMetric[] {
  const map = new Map<string, number>();
  for (const series of allData) {
    for (const { date, views } of series) {
      map.set(date, (map.get(date) ?? 0) + views);
    }
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, views]) => ({ date, views }));
}

// ─── SVG Area Chart ───────────────────────────────────────────────────────────

function AreaChart({ data, color = '#3b82f6' }: { data: DailyMetric[]; color?: string }) {
  if (!data.length) return null;
  const W = 200;
  const H = 56;
  const max = Math.max(...data.map(d => d.views), 1);
  const n = data.length;
  const pts = data.map((d, i) => ({
    x: n === 1 ? W / 2 : (i / (n - 1)) * W,
    y: H - (d.views / max) * H * 0.85 + 2,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;
  const gradId = `g-${color.replace('#', '')}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Mini sparkline for stat cards ───────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const W = 60;
  const H = 20;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - (v / max) * H * 0.85 + 1,
  }));
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-14 h-5">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
}

// ─── Blog Card ────────────────────────────────────────────────────────────────

function BlogCard({ blog, locale, views }: { blog: TenantInfo; locale: string; views: number }) {
  const t = useTranslations('dashboardPage');
  const plan = blog.plan?.toLowerCase() ?? 'free';
  const gradient = PLAN_GRADIENTS[plan] ?? PLAN_GRADIENTS.free;
  const PLAN_LABELS: Record<string, string> = {
    free: t('planFree'), starter: t('planStarter'), pro: t('planPro'), business: t('planBusiness'),
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all overflow-hidden flex flex-col">
      <div className="relative h-[90px] shrink-0 overflow-hidden">
        {blog.cover_image_url ? (
          <img src={blog.cover_image_url} alt={blog.name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-[64px] font-black text-white/[0.12] leading-none select-none">
              {blog.name[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-black/25 text-white backdrop-blur-sm">
          {PLAN_LABELS[plan] ?? plan}
        </span>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[14px] leading-tight truncate">{blog.name}</h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">{blog.slug}.nexusblog.io</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Newspaper, val: blog.articles_count ?? 0,    label: t('blogCardArticles') },
            { icon: Mail,      val: blog.subscribers_count ?? 0, label: t('blogCardSubscribers') },
            { icon: Eye,       val: views,                        label: 'Views' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center py-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <span className="text-[14px] font-black text-slate-800 dark:text-slate-200 leading-none">{s.val}</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-auto">
          <Link
            href={`/${locale}/blogs/${blog.id}/general`}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-900 text-[12px] font-semibold transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
            Studio
          </Link>
          <a
            href={`/${locale}/${blog.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden animate-pulse">
      <div className="h-[90px] bg-slate-100 dark:bg-slate-800" />
      <div className="p-4 space-y-3">
        <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-3/5" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-lg w-2/5" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg" />)}
        </div>
        <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const { user } = useAuthStore();
  const t = useTranslations('dashboardPage');

  const { data: blogs = [], isLoading: blogsLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data } = await tenantsApi.list();
      return data;
    },
  });

  // Fetch analytics for every blog in parallel
  const analyticsResults = useQueries({
    queries: blogs.map(blog => ({
      queryKey: ['analytics', blog.id, 30],
      queryFn: async () => {
        const { data } = await analyticsApi.overview(blog.id, 30);
        return data;
      },
      enabled: blogs.length > 0,
    })),
  });

  const analyticsLoaded = analyticsResults.every(r => !r.isLoading);
  const allViewsByDay = analyticsResults
    .filter(r => r.data?.views_by_day)
    .map(r => r.data!.views_by_day);
  const mergedViews = mergeViewsByDay(allViewsByDay);
  const totalViews = analyticsResults.reduce((s, r) => s + (r.data?.total_views ?? 0), 0);
  const totalSessions = analyticsResults.reduce((s, r) => s + (r.data?.unique_sessions ?? 0), 0);

  const firstName = user?.display_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? '';
  const totalArticles = blogs.reduce((s, b) => s + (b.articles_count ?? 0), 0);
  const totalSubscribers = blogs.reduce((s, b) => s + (b.subscribers_count ?? 0), 0);

  const viewsSparkline = mergedViews.slice(-14).map(d => d.views);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar />

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 space-y-6 lg:space-y-8 max-w-[1400px]">

            {/* Welcome */}
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-[18px] sm:text-[22px] font-black text-slate-900 dark:text-slate-100 leading-tight">
                  {t('greeting', { name: firstName })} 👋
                </h2>
                <p className="text-[12px] sm:text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                  {blogsLoading
                    ? t('loadingBlogs')
                    : blogs.length === 0
                    ? t('startNow')
                    : blogs.length === 1
                    ? t('manageCount', { count: blogs.length })
                    : t('manageCountPlural', { count: blogs.length })}
                </p>
              </div>
              <button
                onClick={() => router.push(`/${locale}/blogs/new`)}
                className="shrink-0 flex items-center gap-2 h-9 px-4 sm:px-5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-900 text-[12px] sm:text-[13px] font-semibold transition-colors shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('newBlog')}</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>

            {!blogsLoading && blogs.length > 0 && (
              <>
                {/* Global stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    {
                      label: 'Total views (30d)',
                      value: totalViews,
                      icon: Eye,
                      color: 'text-blue-600 dark:text-blue-400',
                      bg: 'bg-blue-50 dark:bg-blue-900/20',
                      border: 'border-blue-100 dark:border-blue-800',
                      spark: viewsSparkline,
                      sparkColor: '#3b82f6',
                    },
                    {
                      label: 'Unique sessions (30d)',
                      value: totalSessions,
                      icon: Users,
                      color: 'text-violet-600 dark:text-violet-400',
                      bg: 'bg-violet-50 dark:bg-violet-900/20',
                      border: 'border-violet-100 dark:border-violet-800',
                      spark: viewsSparkline,
                      sparkColor: '#7c3aed',
                    },
                    {
                      label: t('statArticlesPublished'),
                      value: totalArticles,
                      icon: Newspaper,
                      color: 'text-emerald-600 dark:text-emerald-400',
                      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                      border: 'border-emerald-100 dark:border-emerald-800',
                      spark: [],
                      sparkColor: '#16a34a',
                    },
                    {
                      label: t('statSubscribersTotal'),
                      value: totalSubscribers,
                      icon: Mail,
                      color: 'text-amber-600 dark:text-amber-400',
                      bg: 'bg-amber-50 dark:bg-amber-900/20',
                      border: 'border-amber-100 dark:border-amber-800',
                      spark: [],
                      sparkColor: '#d97706',
                    },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm px-5 py-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className={`h-9 w-9 rounded-xl border ${stat.border} ${stat.bg} flex items-center justify-center shrink-0`}>
                          <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                        {stat.spark.length > 1 && <Sparkline data={stat.spark} color={stat.sparkColor} />}
                      </div>
                      <p className="text-[26px] font-black text-slate-900 dark:text-slate-100 leading-none">
                        {analyticsLoaded || stat.spark.length === 0 ? stat.value : '–'}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Views chart */}
                {analyticsLoaded && mergedViews.length > 1 && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Page views — last 30 days</p>
                        <p className="text-[22px] font-black text-slate-900 dark:text-slate-100 mt-0.5 leading-none">{totalViews.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                        <TrendingUp className="h-3 w-3" />
                        {blogs.length} blog{blogs.length > 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="h-[120px] w-full">
                      <AreaChart data={mergedViews} color="#3b82f6" />
                    </div>
                    {/* X-axis labels */}
                    <div className="flex justify-between mt-2">
                      <span className="text-[10px] text-slate-400">{mergedViews[0]?.date?.slice(5)}</span>
                      <span className="text-[10px] text-slate-400">{mergedViews[Math.floor(mergedViews.length / 2)]?.date?.slice(5)}</span>
                      <span className="text-[10px] text-slate-400">{mergedViews[mergedViews.length - 1]?.date?.slice(5)}</span>
                    </div>
                  </div>
                )}

                {/* Blog section header */}
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('yourBlogs')}</p>
                  <Link href={`/${locale}/blogs`} className="flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    {t('seeAll')} <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </>
            )}

            {/* Blog grid */}
            {blogsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : blogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
                  <Newspaper className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-slate-100 mb-2">{t('noBlogsTitle')}</h3>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-[260px] mb-6 leading-relaxed">{t('noBlogsDesc')}</p>
                <button
                  onClick={() => router.push(`/${locale}/blogs/new`)}
                  className="flex items-center gap-2 h-10 px-5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-900 text-[13px] font-semibold transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  {t('createFirstBlogCta')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {blogs.map((blog, i) => (
                  <BlogCard
                    key={blog.id}
                    blog={blog}
                    locale={locale}
                    views={analyticsResults[i]?.data?.total_views ?? 0}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
