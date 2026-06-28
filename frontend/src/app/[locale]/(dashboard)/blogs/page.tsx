'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, ArrowRight, Lock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { useAuthStore } from '@/store/auth.store';
import { getPlanConfig, canCreateBlog } from '@/lib/plans';
import { Button } from '@/components/ui/button';
import { PlatformShell } from '@/components/dashboard/PlatformShell';
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from '@/components/ui/tooltip';

const PLAN_GRADIENT: Record<string, string> = {
  free:     'from-slate-400 to-slate-500',
  starter:  'from-slate-500 to-slate-600',
  pro:      'from-blue-500 to-blue-600',
  business: 'from-amber-500 to-orange-500',
};

export default function BlogsListPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('myBlogs');
  const tNav = useTranslations('platformNav');
  const { user, tenants, setCurrentTenant } = useAuthStore();

  const plan = user?.plan ?? 'free';
  const planConfig = getPlanConfig(plan);
  const canCreate = canCreateBlog(plan, tenants.length);

  return (
    <TooltipProvider>
      <PlatformShell
        locale={locale}
        breadcrumbs={[
          { label: tNav('dashboard'), href: `/${locale}/dashboard` },
          { label: t('title') },
        ]}
        actions={
          canCreate ? (
            <Button asChild size="sm" className="h-8 text-xs gap-1.5">
              <Link href={`/${locale}/blogs/new`}>
                <Plus className="h-3.5 w-3.5" />
                {t('createNew')}
              </Link>
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button size="sm" variant="outline" disabled className="h-8 text-xs gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    {t('limitReached')}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{t('upgradeDesc')}</TooltipContent>
            </Tooltip>
          )
        }
      >
        <div className="max-w-4xl">
          <div className="mb-6">
            <p className="text-sm text-slate-400 dark:text-zinc-500">
              {tenants.length === 0
                ? t('createFirst')
                : tenants.length === 1
                ? t('noBlogsDesc', { count: tenants.length })
                : t('noBlogsDescPlural', { count: tenants.length })}
              {tenants.length > 0 && ` · ${planConfig.label}`}
            </p>
          </div>

          {tenants.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-24 px-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/30 dark:to-violet-950/30 flex items-center justify-center mb-5 border border-blue-100 dark:border-blue-900/50">
                <Plus className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-white mb-2">{t('createFirst')}</h3>
              <p className="text-sm text-slate-400 dark:text-zinc-500 mb-6 max-w-xs mx-auto leading-relaxed">
                {t('createFirstDesc')}
              </p>
              <Button asChild>
                <Link href={`/${locale}/blogs/new`}>
                  <Plus className="h-4 w-4" />
                  {t('createFirstCta')}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tenants.map((tenant) => {
                const grad = PLAN_GRADIENT[tenant.plan?.toLowerCase() ?? 'free'] ?? PLAN_GRADIENT.free;
                return (
                  <div
                    key={tenant.id}
                    className="group flex items-center gap-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm transition-all duration-200 px-5 py-4"
                  >
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0`}>
                      {tenant.name[0]?.toUpperCase() ?? '?'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[14px] text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {tenant.name}
                        </h3>
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full capitalize shrink-0">
                          {tenant.role.replace('tenant_admin', 'Admin').replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-400 dark:text-zinc-500 mt-0.5">
                        {tenant.slug}.nexusblog.io
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`/en/${tenant.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {t('view')}
                      </a>
                      <Button
                        asChild size="sm"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => setCurrentTenant(tenant.id)}
                      >
                        <Link href={`/${locale}/blogs/${tenant.id}/overview`}>
                          {t('manage')}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}

              {canCreate && (
                <Link
                  href={`/${locale}/blogs/new`}
                  className="group flex items-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-all px-5 py-4"
                >
                  <div className="h-12 w-12 rounded-xl border-2 border-dashed border-slate-300 dark:border-zinc-600 group-hover:border-blue-400 flex items-center justify-center shrink-0 transition-colors">
                    <Plus className="h-5 w-5 text-slate-300 dark:text-zinc-600 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <span className="text-[13px] font-medium text-slate-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {t('createNew')}
                  </span>
                </Link>
              )}
            </div>
          )}
        </div>
      </PlatformShell>
    </TooltipProvider>
  );
}
