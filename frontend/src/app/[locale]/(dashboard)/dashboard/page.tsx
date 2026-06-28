'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, ArrowRight, Zap, Globe, FileText, Users, BarChart2, Newspaper } from 'lucide-react';
import Link from 'next/link';

import { useAuthStore } from '@/store/auth.store';
import { getPlanConfig, canCreateBlog } from '@/lib/plans';
import { Button } from '@/components/ui/button';
import { PlatformShell } from '@/components/dashboard/PlatformShell';

export default function DashboardPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('dashboardPage');
  const tNav = useTranslations('platformNav');
  const { user, tenants, setCurrentTenant } = useAuthStore();

  const plan = user?.plan ?? 'free';
  const planConfig = getPlanConfig(plan);
  const blogCount = tenants.length;
  const canCreate = canCreateBlog(plan, blogCount);

  /* ── Aggregate stats across all blogs ── */
  const totalArticles    = tenants.reduce((s, b) => s + (b.articles_count    ?? 0), 0);
  const totalSubscribers = tenants.reduce((s, b) => s + (b.subscribers_count ?? 0), 0);
  const totalAuthors     = tenants.reduce((s, b) => s + (b.authors_count     ?? 0), 0);

  const globalStats = [
    { label: t('statBlogs'),       value: blogCount,         icon: Newspaper,  color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30',    href: `/${locale}/blogs` },
    { label: t('statArticles'),    value: totalArticles,     icon: FileText,   color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30', href: `/${locale}/blogs` },
    { label: t('statSubscribers'), value: totalSubscribers,  icon: Users,      color: 'text-emerald-600',bg: 'bg-emerald-50 dark:bg-emerald-950/30',href: `/${locale}/blogs` },
    { label: t('statAuthors'),     value: totalAuthors,      icon: BarChart2,  color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950/30',   href: `/${locale}/blogs` },
  ];

  const firstName = user?.display_name?.split(' ')[0] ?? 'there';

  return (
    <PlatformShell
      locale={locale}
      breadcrumbs={[{ label: tNav('dashboard') }]}
      actions={
        canCreate ? (
          <Button asChild size="sm" className="h-8 text-xs gap-1.5">
            <Link href={`/${locale}/blogs/new`}>
              <Plus className="h-3.5 w-3.5" />
              {t('newBlog')}
            </Link>
          </Button>
        ) : undefined
      }
    >
      <div className="max-w-4xl space-y-8">

        {/* ── Welcome ─────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('greeting', { name: firstName })}
          </h1>
          <p className="text-sm text-slate-400 dark:text-zinc-500 mt-1">
            {t('subtitle')}
          </p>
        </div>

        {/* ── Plan banner ─────────────────────────────── */}
        <div className={`relative rounded-2xl bg-gradient-to-br ${planConfig.color} p-5 text-white overflow-hidden shadow-lg`}>
          <div className="pointer-events-none absolute -right-4 -top-4 opacity-10">
            <Zap strokeWidth={1} className="h-32 w-32" />
          </div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold opacity-70 uppercase tracking-widest">
                {t('planCurrent')}
              </p>
              <h2 className="text-xl font-black mt-0.5">{planConfig.label}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2">
                {planConfig.customDomain && <FeaturePill icon={<Globe className="h-3 w-3" />} label={t('planCustomDomain')} />}
                {planConfig.newsletter   && <FeaturePill icon={<FileText className="h-3 w-3" />} label={t('planNewsletter')} />}
                {planConfig.api          && <FeaturePill icon={<Zap className="h-3 w-3" />} label={t('planAPI')} />}
                {planConfig.whiteLabel   && <FeaturePill icon={<span>✦</span>} label={t('planWhiteLabel')} />}
                {!planConfig.hasAds      && <FeaturePill icon={<span>✓</span>} label={t('planNoAds')} />}
              </div>
            </div>
            <Button
              asChild size="sm"
              className="shrink-0 bg-white/20 hover:bg-white/30 text-white border-0 text-xs font-semibold"
            >
              <Link href={`/${locale}/subscription`}>
                <Zap className="h-3.5 w-3.5" />
                {t('planUpgrade')}
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Global stats ────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
            {t('statsTitle')}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {globalStats.map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className="group rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <div className={`h-9 w-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                  <stat.icon className={`h-[18px] w-[18px] ${stat.color}`} />
                </div>
                <p className="text-2xl font-black text-slate-800 dark:text-white leading-none mb-0.5">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">{stat.label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* ── My blogs (compact, max 3) ────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t('myBlogsTitle')}
            </h2>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1">
              <Link href={`/${locale}/blogs`}>
                {t('seeAllBlogs')}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          {tenants.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-14 px-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/30 dark:to-violet-950/30 flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-900/50">
                <Newspaper className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-white mb-1 text-sm">{t('createFirstTitle')}</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mb-5 max-w-xs mx-auto leading-relaxed">
                {t('createFirstDesc')}
              </p>
              <Button asChild size="sm">
                <Link href={`/${locale}/blogs/new`}>
                  <Plus className="h-4 w-4" />
                  {t('createFirstCta')}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {tenants.slice(0, 3).map((tenant) => (
                <div
                  key={tenant.id}
                  className="group flex items-center gap-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm transition-all px-4 py-3"
                >
                  <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${planConfig.color} flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0`}>
                    {tenant.name[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {tenant.name}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                      {tenant.slug}.nexusblog.io
                      {(tenant.articles_count ?? 0) > 0 && (
                        <span className="ml-2 text-slate-300 dark:text-zinc-600">·</span>
                      )}
                      {(tenant.articles_count ?? 0) > 0 && (
                        <span className="ml-2">{tenant.articles_count} {t('statArticles').toLowerCase()}</span>
                      )}
                    </p>
                  </div>
                  <Button
                    asChild variant="ghost" size="sm"
                    className="h-7 text-xs text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:text-zinc-500 dark:hover:text-blue-400 dark:hover:bg-blue-950/20 gap-1 shrink-0"
                    onClick={() => setCurrentTenant(tenant.id)}
                  >
                    <Link href={`/${locale}/blogs/${tenant.id}/overview`}>
                      {t('manageBlog')}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              ))}

              {tenants.length > 3 && (
                <Link
                  href={`/${locale}/blogs`}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 dark:border-zinc-700 py-3 text-xs font-medium text-slate-400 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-700 dark:hover:text-blue-400 transition-all"
                >
                  {t('moreBlogs', { count: tenants.length - 3 })}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}
        </div>

      </div>
    </PlatformShell>
  );
}

function FeaturePill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium opacity-80">
      {icon} {label}
    </span>
  );
}
